import { diasProva, horariosProva } from '@/data/inscricao';
import { instituicao, vestibular } from '@/data/vestibular';
import { atualizar, trocarHorario, visaoCandidato } from '@/utils/vestibular/inscricoes';
import { enviarAtualizacao } from '@/utils/vestibular/email';
import { entrarComLimite, mensagemBloqueio } from '@/utils/vestibular/limite';
import { enviarConversaoRd } from '@/utils/vestibular/rd';
import { entregarSeVenceu, modoTeste } from '@/utils/vestibular/prova';
import { resultadoDoCandidato, resultadoPublicado } from '@/utils/vestibular/resultado';
import {
  ErroEdicao,
  lerEdicoes,
  limiteTrocasCurso,
  registrarEdicao,
  salvarEdicao,
  trocasCursoFeitas,
  validarTrocaCurso,
} from '@/utils/vestibular/edicao';
import { idadeEm, soDigitos } from '@/utils/vestibular/validacao';
import { NextResponse } from 'next/server';

// Área do candidato: POST entra com CPF + código e devolve a inscrição; PATCH troca o dia/horário da prova ou o
// curso (até o fim das inscrições) ou registra a data de nascimento de quem foi importado do SEI sem ela.
// Toda chamada confere CPF e código de novo, então não há sessão para roubar.

type Corpo = Partial<Record<string, unknown>>;

const texto = (v: unknown, max = 40) => (typeof v === 'string' ? v.trim().slice(0, max) : '');

const naoEncontrada = async () => {
  // Uma pequena espera a cada erro deixa tentativa e erro de códigos impraticável
  await new Promise((r) => setTimeout(r, 700));
  return NextResponse.json(
    {
      ok: false,
      mensagem: `CPF ou código não conferem. Confira o código que apareceu na sua inscrição; se não tiver mais, fale com a Faculdade Vidal pelo ${instituicao.telefone}.`,
    },
    { status: 401 },
  );
};

const bloqueio = () => NextResponse.json({ ok: false, mensagem: mensagemBloqueio }, { status: 429 });

const autenticar = (request: Request, corpo: Corpo) =>
  entrarComLimite(request, soDigitos(texto(corpo.cpf)), texto(corpo.codigo));

export async function POST(request: Request) {
  const { bloqueado, inscricao } = await autenticar(request, await request.json().catch(() => ({})));
  if (bloqueado) {
    return bloqueio();
  }
  if (!inscricao) {
    return naoEncontrada();
  }
  const atual = await entregarSeVenceu(inscricao);
  return NextResponse.json({
    ok: true,
    inscricao: {
      ...visaoCandidato(atual),
      trocasCursoRestantes: limiteTrocasCurso - trocasCursoFeitas(await lerEdicoes(), atual.numero),
    },
    modoTeste,
    resultado: atual.faz_prova ? await resultadoDoCandidato(atual) : null,
    // Hora do servidor: a tela segue ela, não o relógio do celular (que pode estar errado ou em outro fuso)
    agora: Date.now(),
  });
}

export async function PATCH(request: Request) {
  const corpo: Corpo = await request.json().catch(() => ({}));
  const { bloqueado, inscricao } = await autenticar(request, corpo);
  if (bloqueado) {
    return bloqueio();
  }
  if (!inscricao) {
    return naoEncontrada();
  }
  // Troca de curso: sem "confirmar", só valida e devolve o antes → depois; com "confirmar", grava, registra no log de
  // edições (origem: candidato), manda o e-mail "Sua inscrição foi atualizada" e a conversão de atualização na RD
  if (corpo.oferta !== undefined) {
    try {
      const feitas = trocasCursoFeitas(await lerEdicoes(), inscricao.numero);
      const publicado = !!(await resultadoPublicado())?.publicadoEm;
      const { campos, antes, depois } = validarTrocaCurso(inscricao, texto(corpo.oferta, 60), { publicado, feitas });
      if (corpo.confirmar !== true) {
        return NextResponse.json({ ok: true, antes, depois, restantes: limiteTrocasCurso - feitas });
      }
      const atualizada = await salvarEdicao(inscricao, campos);
      const [email, rd] = await Promise.all([
        enviarAtualizacao(atualizada),
        enviarConversaoRd(atualizada, 'atualizacao'),
      ]);
      await registrarEdicao({
        numero: atualizada.numero,
        origem: 'candidato',
        por: 'Candidato (Minha inscrição)',
        em: new Date().toISOString(),
        antes,
        depois,
        avisouPorEmail: email,
        rd,
      });
      return NextResponse.json({
        ok: true,
        inscricao: { ...visaoCandidato(atualizada), trocasCursoRestantes: limiteTrocasCurso - feitas - 1 },
      });
    } catch (e) {
      if (e instanceof ErroEdicao) {
        return NextResponse.json(
          { ok: false, mensagem: e.message.replace('O candidato começou', 'Você começou') },
          { status: 400 },
        );
      }
      throw e;
    }
  }
  // Importado do SEI sem data de nascimento: o candidato informa uma vez (depois, só a secretaria corrige)
  if (corpo.nascimento !== undefined) {
    if (inscricao.nascimento) {
      return NextResponse.json({ ok: false, mensagem: 'Sua data de nascimento já está registrada.' }, { status: 400 });
    }
    const nascimento = texto(corpo.nascimento, 10);
    const idade = idadeEm(nascimento);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(nascimento) || !(idade >= 14 && idade <= 100)) {
      return NextResponse.json({ ok: false, mensagem: 'Confira a data de nascimento.' }, { status: 400 });
    }
    const atualizada = await atualizar(inscricao, { nascimento });
    return NextResponse.json({ ok: true, inscricao: visaoCandidato(atualizada) });
  }
  if (!inscricao.faz_prova) {
    return NextResponse.json({ ok: false, mensagem: 'Sua inscrição não tem prova agendada.' }, { status: 400 });
  }
  if (Date.now() > new Date(vestibular.fimInscricoes).getTime()) {
    return NextResponse.json(
      { ok: false, mensagem: 'O horário da prova só pode ser trocado até 20/11, às 18h.' },
      { status: 410 },
    );
  }
  const dia = texto(corpo.diaProva, 10);
  const hora = texto(corpo.horaProva, 5);
  if (!diasProva.some((d) => d.id === dia) || !horariosProva.includes(hora)) {
    return NextResponse.json({ ok: false, mensagem: 'Escolha o dia e o horário da prova.' }, { status: 400 });
  }
  const atualizada = await trocarHorario(inscricao, dia, hora);
  // Dados novos para o aluno (e-mail) e para o lead na RD (conversão de atualização, sem disparar WhatsApp)
  await Promise.all([enviarAtualizacao(atualizada), enviarConversaoRd(atualizada, 'atualizacao')]);
  return NextResponse.json({ ok: true, inscricao: visaoCandidato(atualizada) });
}

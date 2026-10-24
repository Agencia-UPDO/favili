import { diasProva, horariosProva } from '@/data/inscricao';
import { instituicao, vestibular } from '@/data/vestibular';
import { trocarHorario, visaoCandidato } from '@/utils/vestibular/inscricoes';
import { entrarComLimite, mensagemBloqueio } from '@/utils/vestibular/limite';
import { entregarSeVenceu, modoTeste } from '@/utils/vestibular/prova';
import { resultadoDoCandidato } from '@/utils/vestibular/resultado';
import { soDigitos } from '@/utils/vestibular/validacao';
import { NextResponse } from 'next/server';

// Área do candidato: POST entra com CPF + código e devolve a inscrição; PATCH troca o dia/horário da prova
// (até o fim das inscrições). Toda chamada confere CPF e código de novo, então não há sessão para roubar.

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
    inscricao: visaoCandidato(atual),
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
  return NextResponse.json({ ok: true, inscricao: visaoCandidato(atualizada) });
}

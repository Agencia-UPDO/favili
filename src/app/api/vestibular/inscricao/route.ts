import { horariosProva, diasProva, ofertasAtivas } from '@/data/inscricao';
import { FormaId, formas, instituicao, vestibular } from '@/data/vestibular';
import { CpfJaInscrito, criarInscricao, visaoCandidato } from '@/utils/vestibular/inscricoes';
import { celularValido, cpfValido, emailValido, idadeEm, soDigitos } from '@/utils/vestibular/validacao';
import { confirmacaoLigada, enviarConfirmacao } from '@/utils/vestibular/email';
import { enviarConversaoRd } from '@/utils/vestibular/rd';
import { NextResponse } from 'next/server';

// Recebe a inscrição do formulário de /vestibular/inscricao, valida tudo de novo e grava.
// Responde com o número de inscrição e o código de acesso à prova.

type Corpo = Partial<Record<string, string | boolean>>;

const texto = (v: unknown, max = 200) => (typeof v === 'string' ? v.trim().slice(0, max) : '');

const erro = (mensagem: string, campo?: string, status = 400) =>
  NextResponse.json({ ok: false, mensagem, campo }, { status });

export async function POST(request: Request) {
  if (Date.now() > new Date(vestibular.fimInscricoes).getTime()) {
    return erro(
      'As inscrições do Vestibular Conquista Vidal 2027.1 foram encerradas em 20/11, às 18h.',
      undefined,
      410,
    );
  }

  const corpo: Corpo = await request.json().catch(() => ({}));

  const forma = texto(corpo.forma) as FormaId;
  if (!formas.some((f) => f.id === forma)) {
    return erro('Escolha como você quer entrar.', 'forma');
  }

  // Só ofertas abertas nesta edição (cursos retirados são recusados aqui também)
  const oferta = ofertasAtivas.find((o) => o.id === texto(corpo.oferta));
  if (!oferta) {
    return erro('Escolha o curso.', 'oferta');
  }
  if (!oferta.formas.includes(forma)) {
    return erro('Essa forma de ingresso não está disponível para esse curso.', 'forma');
  }

  const cpf = soDigitos(texto(corpo.cpf));
  if (!cpfValido(cpf)) {
    return erro('Confira o CPF: ele não é válido.', 'cpf');
  }

  const nome = texto(corpo.nome, 120).replace(/\s+/g, ' ');
  if (nome.split(' ').length < 2) {
    return erro('Escreva o nome completo.', 'nome');
  }

  const email = texto(corpo.email, 160).toLowerCase();
  if (!emailValido(email)) {
    return erro('Confira o e-mail.', 'email');
  }

  const celular = soDigitos(texto(corpo.celular));
  if (!celularValido(celular)) {
    return erro('Confira o WhatsApp com DDD.', 'celular');
  }

  const nascimento = texto(corpo.nascimento, 10);
  const idade = idadeEm(nascimento);
  if (!(idade >= 14 && idade <= 100)) {
    return erro('Confira a data de nascimento.', 'nascimento');
  }

  // Quem entra pelo vestibular faz a prova; quem tem Enem pode fazer também para tentar uma bolsa maior
  const fazProva = forma === 'vestibular' || (forma === 'enem' && corpo.fazProva === true);
  const diaProva = fazProva ? texto(corpo.diaProva, 10) : '';
  const horaProva = fazProva ? texto(corpo.horaProva, 5) : '';
  if (fazProva && !diasProva.some((d) => d.id === diaProva)) {
    return erro('Escolha o dia da prova.', 'diaProva');
  }
  if (fazProva && !horariosProva.includes(horaProva)) {
    return erro('Escolha o horário da prova.', 'horaProva');
  }

  const deOutraFaculdade = forma === 'segunda-graduacao' || forma === 'transferencia';
  const instituicaoOrigem = deOutraFaculdade ? texto(corpo.instituicaoOrigem, 160) : '';
  const cursoOrigem = deOutraFaculdade ? texto(corpo.cursoOrigem, 120) : '';
  const periodoAtual = forma === 'transferencia' ? texto(corpo.periodoAtual, 20) : '';
  if (deOutraFaculdade && !instituicaoOrigem) {
    return erro('Informe a faculdade de origem.', 'instituicaoOrigem');
  }
  if (deOutraFaculdade && !cursoOrigem) {
    return erro('Informe o curso de origem.', 'cursoOrigem');
  }
  if (forma === 'transferencia' && !periodoAtual) {
    return erro('Informe o período em que você está.', 'periodoAtual');
  }

  if (corpo.aceite !== true) {
    return erro('Para se inscrever, aceite o regulamento e o contato.', 'aceite');
  }

  try {
    const inscricao = await criarInscricao({
      cpf,
      nome,
      email,
      celular,
      nascimento,
      forma,
      oferta_id: oferta.id,
      curso: oferta.curso,
      modalidade: oferta.modalidade,
      unidade: oferta.unidade,
      turno: oferta.turno,
      processo_sei: oferta.processoSei,
      faz_prova: fazProva,
      dia_prova: diaProva || null,
      hora_prova: horaProva || null,
      instituicao_origem: instituicaoOrigem || null,
      curso_origem: cursoOrigem || null,
      periodo_atual: periodoAtual || null,
      atendimento_especial: texto(corpo.atendimentoEspecial, 500) || null,
      origem: texto(corpo.origem, 300) || null,
    });

    // Conversão na RD (WhatsApp via Kommo) com o código e o nº já gravados; não derruba a inscrição se falhar
    await enviarConversaoRd(inscricao);

    if (confirmacaoLigada()) {
      // Não atrapalha a inscrição se o e-mail falhar
      await enviarConfirmacao(inscricao).catch(() => false);
    }

    return NextResponse.json({
      ok: true,
      inscricao: visaoCandidato(inscricao),
    });
  } catch (e) {
    if (e instanceof CpfJaInscrito) {
      return NextResponse.json(
        {
          ok: false,
          jaInscrito: true,
          // Não revela número nem e-mail da inscrição existente (qualquer um pode digitar um CPF)
          mensagem: `Esse CPF já tem inscrição. Entre em Minha inscrição com o código de acesso que apareceu quando você se inscreveu; se não tiver mais, fale com a Faculdade Vidal pelo ${instituicao.telefone}.`,
        },
        { status: 409 },
      );
    }
    // Sem dados pessoais no log: só a mensagem técnica
    console.error('[vestibular inscricao] falha ao gravar:', (e as Error).message?.replace(/\d{11}/g, '***'));
    return erro('Não conseguimos concluir sua inscrição agora. Tente de novo em alguns minutos.', undefined, 500);
  }
}

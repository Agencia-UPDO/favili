import { diasProva, horariosProva } from '@/data/inscricao';
import { instituicao, vestibular } from '@/data/vestibular';
import { entrar, trocarHorario, visaoCandidato } from '@/utils/vestibular/inscricoes';
import { entregarSeVenceu, modoTeste } from '@/utils/vestibular/prova';
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

const autenticar = async (corpo: Corpo) => {
  const cpf = soDigitos(texto(corpo.cpf));
  const codigo = texto(corpo.codigo);
  if (cpf.length !== 11 || codigo.length < 6) {
    return null;
  }
  return entrar(cpf, codigo);
};

export async function POST(request: Request) {
  const inscricao = await autenticar(await request.json().catch(() => ({})));
  if (!inscricao) {
    return naoEncontrada();
  }
  return NextResponse.json({ ok: true, inscricao: visaoCandidato(await entregarSeVenceu(inscricao)), modoTeste });
}

export async function PATCH(request: Request) {
  const corpo: Corpo = await request.json().catch(() => ({}));
  const inscricao = await autenticar(corpo);
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

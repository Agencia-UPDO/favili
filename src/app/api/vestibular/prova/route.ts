import { Inscricao } from '@/utils/vestibular/inscricoes';
import {
  entregar,
  entregarSeVenceu,
  iniciar,
  modoTeste,
  responder,
  situacao,
  totalQuestoes,
  visaoProva,
} from '@/utils/vestibular/prova';
import { entrarComLimite, mensagemBloqueio } from '@/utils/vestibular/limite';
import { soDigitos } from '@/utils/vestibular/validacao';
import { NextResponse } from 'next/server';

// Prova on-line. Toda chamada confere CPF + código. Ações:
// - estado: situação da prova; em andamento, devolve as questões (sem gabarito), as respostas e o fim
// - iniciar: começa a contar as 2 horas (só no horário liberado)
// - responder: grava a alternativa de uma questão (ou limpa, com letra null)
// - entregar: encerra e corrige

type Corpo = Partial<Record<string, unknown>>;
const texto = (v: unknown, max = 40) => (typeof v === 'string' ? v.trim().slice(0, max) : '');

const resposta = (i: Inscricao, extra: Record<string, unknown> = {}) => {
  const s = situacao(i);
  return NextResponse.json({
    ok: true,
    situacao: s,
    agora: Date.now(),
    fim: i.prova_fim ? new Date(i.prova_fim).getTime() : null,
    totalQuestoes,
    modoTeste,
    questoes: s === 'em-andamento' ? visaoProva(i) : null,
    ...extra,
  });
};

const negar = (mensagem: string, status: number) => NextResponse.json({ ok: false, mensagem }, { status });

export async function POST(request: Request) {
  const corpo: Corpo = await request.json().catch(() => ({}));
  const cpf = soDigitos(texto(corpo.cpf));
  const codigo = texto(corpo.codigo);
  const acesso = await entrarComLimite(request, cpf, codigo);
  if (acesso.bloqueado) {
    return negar(mensagemBloqueio, 429);
  }
  let inscricao = acesso.inscricao;
  if (!inscricao) {
    await new Promise((r) => setTimeout(r, 700));
    return negar('Sessão expirada. Entre de novo em Minha inscrição com seu CPF e código.', 401);
  }

  inscricao = await entregarSeVenceu(inscricao);
  const acao = texto(corpo.acao);

  if (acao === 'iniciar') {
    const s = situacao(inscricao);
    if (s === 'liberada') {
      inscricao = await iniciar(inscricao);
    } else if (s === 'aguardando') {
      return negar('A prova ainda não foi liberada. Ela abre no horário que você escolheu.', 403);
    } else if (s === 'perdida') {
      return negar('O prazo para fazer a prova terminou.', 403);
    }
    return resposta(inscricao);
  }

  if (acao === 'responder') {
    if (situacao(inscricao) !== 'em-andamento') {
      return resposta(inscricao, { recusada: true });
    }
    const letra = corpo.letra === null ? null : texto(corpo.letra, 1);
    const atualizada = await responder(inscricao, texto(corpo.questao, 60), letra);
    if (!atualizada) {
      return negar('Questão ou alternativa inválida.', 400);
    }
    return NextResponse.json({ ok: true, salvo: true, agora: Date.now() });
  }

  if (acao === 'entregar') {
    if (situacao(inscricao) === 'em-andamento') {
      inscricao = await entregar(inscricao);
    }
    return resposta(inscricao);
  }

  return resposta(inscricao);
}

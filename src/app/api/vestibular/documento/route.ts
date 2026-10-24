import { documentoTamanhoMaximo } from '@/data/inscricao';
import { instituicao, vestibular } from '@/data/vestibular';
import {
  assinaturaLocalValida,
  confirmarEnvio,
  ErroDocumento,
  gravarLocal,
  prepararEnvio,
  removerDocumento,
  salvarNotasEnem,
} from '@/utils/vestibular/documentos';
import { visaoCandidato } from '@/utils/vestibular/inscricoes';
import { entrarComLimite, mensagemBloqueio } from '@/utils/vestibular/limite';
import { soDigitos } from '@/utils/vestibular/validacao';
import { NextResponse } from 'next/server';

// Documentos do candidato (Enem, segunda graduação, transferência). Toda chamada confere CPF + código. Ações:
// - preparar: devolve o link para o navegador enviar o arquivo direto para a pasta privada
// - confirmar: depois do envio, confere o arquivo e registra na inscrição
// - remover: apaga um arquivo (enquanto os documentos não forem analisados)
// - notas: Enem, ano e notas informados pelo candidato (a equipe confere no painel)
// PUT só existe em desenvolvimento (sem Supabase): recebe o arquivo para a pasta local.

type Corpo = Partial<Record<string, unknown>>;
const texto = (v: unknown, max = 60) => (typeof v === 'string' ? v.trim().slice(0, max) : '');

export async function POST(request: Request) {
  const corpo: Corpo = await request.json().catch(() => ({}));
  const cpf = soDigitos(texto(corpo.cpf));
  const codigo = texto(corpo.codigo);
  const { bloqueado, inscricao } = await entrarComLimite(request, cpf, codigo);
  if (bloqueado) {
    return NextResponse.json({ ok: false, mensagem: mensagemBloqueio }, { status: 429 });
  }
  if (!inscricao) {
    await new Promise((r) => setTimeout(r, 700));
    return NextResponse.json(
      { ok: false, mensagem: 'Sessão expirada. Entre de novo em Minha inscrição com seu CPF e código.' },
      { status: 401 },
    );
  }

  try {
    if (corpo.acao === 'preparar') {
      const envio = await prepararEnvio(
        inscricao,
        { item: texto(corpo.item), tipo: texto(corpo.tipo, 40), tamanho: Number(corpo.tamanho) },
        vestibular.fimInscricoes,
      );
      return NextResponse.json({ ok: true, ...envio });
    }
    if (corpo.acao === 'confirmar') {
      const atualizada = await confirmarEnvio(
        inscricao,
        { caminho: texto(corpo.caminho, 120), nome: texto(corpo.nome, 120) },
        vestibular.fimInscricoes,
      );
      return NextResponse.json({ ok: true, inscricao: visaoCandidato(atualizada) });
    }
    if (corpo.acao === 'notas') {
      const atualizada = await salvarNotasEnem(inscricao, corpo.ano, corpo.notas, vestibular.fimInscricoes);
      return NextResponse.json({ ok: true, inscricao: visaoCandidato(atualizada) });
    }
    if (corpo.acao === 'remover') {
      const atualizada = await removerDocumento(inscricao, texto(corpo.id, 20), vestibular.fimInscricoes);
      return NextResponse.json({ ok: true, inscricao: visaoCandidato(atualizada) });
    }
    return NextResponse.json({ ok: false, mensagem: 'Ação inválida.' }, { status: 400 });
  } catch (e) {
    if (e instanceof ErroDocumento) {
      return NextResponse.json({ ok: false, mensagem: e.message }, { status: 400 });
    }
    // Sem dados pessoais no log: só a mensagem técnica
    console.error('[vestibular documento] falha:', (e as Error).message);
    return NextResponse.json(
      {
        ok: false,
        mensagem: `Não conseguimos receber o arquivo agora. Tente de novo em alguns minutos ou fale com a Faculdade Vidal pelo ${instituicao.telefone}.`,
      },
      { status: 500 },
    );
  }
}

export async function PUT(request: Request) {
  if (process.env.SUPABASE_URL || process.env.VERCEL) {
    return NextResponse.json({ ok: false }, { status: 404 });
  }
  const params = new URL(request.url).searchParams;
  const caminho = params.get('caminho') ?? '';
  if (!assinaturaLocalValida(caminho, params.get('assinatura') ?? '')) {
    return NextResponse.json({ ok: false }, { status: 403 });
  }
  const dados = Buffer.from(await request.arrayBuffer());
  if (dados.length > documentoTamanhoMaximo) {
    return NextResponse.json({ ok: false }, { status: 413 });
  }
  await gravarLocal(caminho, dados);
  return NextResponse.json({ ok: true });
}

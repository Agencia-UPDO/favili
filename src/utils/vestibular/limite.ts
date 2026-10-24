import 'server-only';

import { createHash } from 'node:crypto';
import { entrar } from './inscricoes';

// Limite de tentativas erradas (login do candidato e senha do painel), contado no Supabase porque na Vercel cada
// requisição pode cair numa instância diferente. As chaves vão com hash: o CPF não fica gravado nesta tabela.
// Sem Supabase (desenvolvimento), conta em memória. Se a tabela ainda não existir, não bloqueia (só avisa no log).

const janelaMs = 15 * 60 * 1000;

export const limites = {
  cpf: 5, // erros por CPF em 15 minutos
  ipCandidato: 20, // por IP (escolas e famílias dividem o mesmo IP)
  ipPainel: 5, // senha do painel, por IP
  recuperarCpf: 3, // pedidos de "esqueci meu código" por CPF em 1 hora
  recuperarIp: 10, // e por IP em 1 hora
};

export const umaHora = 60 * 60 * 1000;

const tabela = () => {
  const url = process.env.SUPABASE_URL;
  const chave = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !chave) {
    return null;
  }
  return {
    url: `${url.replace(/\/$/, '')}/rest/v1/vestibular_tentativas`,
    headers: { apikey: chave, Authorization: `Bearer ${chave}`, 'Content-Type': 'application/json' },
  };
};

const memoria = new Map<string, number[]>();

const hash = (chave: string) => createHash('sha256').update(`vestibular:${chave}`).digest('hex').slice(0, 40);

export const ipDe = (request: Request) =>
  request.headers.get('x-real-ip') ?? request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'sem-ip';

// Quantos erros cada chave teve na janela
const contar = async (chaves: string[], janela: number): Promise<Record<string, number>> => {
  const desde = Date.now() - janela;
  const t = tabela();
  if (!t) {
    return Object.fromEntries(chaves.map((c) => [c, (memoria.get(c) ?? []).filter((em) => em > desde).length]));
  }
  try {
    const res = await fetch(
      `${t.url}?chave=in.(${chaves.map(hash).join(',')})&em=gte.${new Date(desde).toISOString()}&select=chave`,
      { headers: t.headers, cache: 'no-store' },
    );
    if (!res.ok) {
      throw new Error(`status ${res.status}`);
    }
    const linhas = (await res.json()) as { chave: string }[];
    return Object.fromEntries(chaves.map((c) => [c, linhas.filter((l) => l.chave === hash(c)).length]));
  } catch (e) {
    console.warn('[vestibular limite] contador indisponível, seguindo sem bloqueio:', (e as Error).message);
    return {};
  }
};

export const bloqueado = async (limitesPorChave: Record<string, number>, janela = janelaMs) => {
  const contagem = await contar(Object.keys(limitesPorChave), janela);
  return Object.entries(limitesPorChave).some(([chave, limite]) => (contagem[chave] ?? 0) >= limite);
};

export const registrarErro = async (chaves: string[]) => {
  const t = tabela();
  if (!t) {
    for (const c of chaves) {
      memoria.set(c, [...(memoria.get(c) ?? []), Date.now()]);
    }
    return;
  }
  await fetch(t.url, {
    method: 'POST',
    headers: t.headers,
    body: JSON.stringify(chaves.map((c) => ({ chave: hash(c) }))),
  }).catch(() => undefined);
};

export const mensagemBloqueio = 'Muitas tentativas erradas. Por segurança, aguarde 15 minutos e tente de novo.';

// Entrada do candidato com CPF + código, com limite por CPF e por IP. Só os erros contam.
export const entrarComLimite = async (request: Request, cpf: string, codigo: string) => {
  const chaves = { [`cpf:${cpf}`]: limites.cpf, [`ip:${ipDe(request)}`]: limites.ipCandidato };
  if (await bloqueado(chaves)) {
    return { bloqueado: true as const, inscricao: null };
  }
  const inscricao = cpf.length === 11 && codigo.length >= 6 ? await entrar(cpf, codigo) : null;
  if (!inscricao) {
    await registrarErro(Object.keys(chaves));
  }
  return { bloqueado: false as const, inscricao };
};

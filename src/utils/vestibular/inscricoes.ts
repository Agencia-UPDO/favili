import 'server-only';

import { randomInt } from 'node:crypto';
import { promises as fs } from 'node:fs';
import path from 'node:path';

// Onde as inscrições ficam guardadas: no Supabase (tabela vestibular_inscricoes, ver supabase/migrations) quando
// SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY estão definidas; sem elas, num arquivo local em .data/ só para testar
// em desenvolvimento.

export type NovaInscricao = {
  cpf: string;
  nome: string;
  email: string;
  celular: string;
  nascimento: string;
  forma: string;
  oferta_id: string;
  curso: string;
  modalidade: string;
  unidade: string;
  turno: string;
  processo_sei: number;
  faz_prova: boolean;
  dia_prova: string | null;
  hora_prova: string | null;
  instituicao_origem: string | null;
  curso_origem: string | null;
  periodo_atual: string | null;
  atendimento_especial: string | null;
  origem: string | null;
};

// Campos da prova on-line (vazios até o candidato começar)
export type DadosProva = {
  prova_inicio?: string | null;
  prova_fim?: string | null;
  prova_entregue_em?: string | null;
  questoes_sorteadas?: string[] | null;
  respostas?: Record<string, string> | null;
  acertos?: number | null;
  nota?: number | null;
  nota_matematica?: number | null;
};

export type Inscricao = NovaInscricao &
  DadosProva & {
    numero: number;
    codigo: string;
    criado_em: string;
  };

export class CpfJaInscrito extends Error {
  constructor(public inscricao: Inscricao) {
    super('CPF já inscrito');
  }
}

// Código de acesso à prova: 6 caracteres sem os que confundem (0/O, 1/I/L)
const alfabeto = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
export const gerarCodigo = () => Array.from({ length: 6 }, () => alfabeto[randomInt(alfabeto.length)]).join('');

// Aceita o código com ou sem o antigo prefixo "VIDAL-", em maiúsculas ou minúsculas
const normalizarCodigo = (codigo: string) =>
  codigo
    .trim()
    .toUpperCase()
    .replace(/^VIDAL-?/, '');

const supabase = () => {
  const url = process.env.SUPABASE_URL;
  const chave = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !chave) {
    return null;
  }
  return {
    url: `${url.replace(/\/$/, '')}/rest/v1/vestibular_inscricoes`,
    headers: { apikey: chave, Authorization: `Bearer ${chave}`, 'Content-Type': 'application/json' },
  };
};

// ---------- Arquivo local (desenvolvimento) ----------
const arquivoLocal = path.join(process.cwd(), '.data', 'vestibular-inscricoes.json');

const lerLocal = async (): Promise<Inscricao[]> => {
  try {
    return JSON.parse(await fs.readFile(arquivoLocal, 'utf8'));
  } catch {
    return [];
  }
};

const gravarLocal = async (lista: Inscricao[]) => {
  await fs.mkdir(path.dirname(arquivoLocal), { recursive: true });
  await fs.writeFile(arquivoLocal, JSON.stringify(lista, null, 2));
};

// ---------- Operações ----------
export const buscarPorCpf = async (cpf: string): Promise<Inscricao | null> => {
  const sb = supabase();
  if (!sb) {
    return (await lerLocal()).find((i) => i.cpf === cpf) ?? null;
  }
  const res = await fetch(`${sb.url}?cpf=eq.${cpf}&limit=1`, { headers: sb.headers, cache: 'no-store' });
  if (!res.ok) {
    throw new Error(`Supabase respondeu ${res.status}: ${await res.text()}`);
  }
  const [inscricao] = (await res.json()) as Inscricao[];
  return inscricao ?? null;
};

export const criarInscricao = async (dados: NovaInscricao): Promise<Inscricao> => {
  const existente = await buscarPorCpf(dados.cpf);
  if (existente) {
    throw new CpfJaInscrito(existente);
  }

  const sb = supabase();
  if (!sb) {
    if (process.env.VERCEL) {
      throw new Error('Supabase não configurado (SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY)');
    }
    const lista = await lerLocal();
    const inscricao: Inscricao = {
      ...dados,
      numero: lista.reduce((maior, i) => Math.max(maior, i.numero), 2027100000) + 1,
      codigo: gerarCodigo(),
      criado_em: new Date().toISOString(),
    };
    await gravarLocal([...lista, inscricao]);
    return inscricao;
  }

  // O número sai da sequência do banco; o CPF e o código são únicos na tabela, então uma corrida vira erro 409
  const res = await fetch(sb.url, {
    method: 'POST',
    headers: { ...sb.headers, Prefer: 'return=representation' },
    body: JSON.stringify({ ...dados, codigo: gerarCodigo() }),
  });
  if (res.status === 409) {
    const existenteAgora = await buscarPorCpf(dados.cpf);
    if (existenteAgora) {
      throw new CpfJaInscrito(existenteAgora);
    }
  }
  if (!res.ok) {
    throw new Error(`Supabase respondeu ${res.status}: ${await res.text()}`);
  }
  const [inscricao] = (await res.json()) as Inscricao[];
  return inscricao;
};

// Entrada na área do candidato: CPF e código precisam bater (o código é comparado sem diferenciar maiúsculas)
export const entrar = async (cpf: string, codigo: string): Promise<Inscricao | null> => {
  const inscricao = await buscarPorCpf(cpf);
  return inscricao && normalizarCodigo(inscricao.codigo) === normalizarCodigo(codigo) ? inscricao : null;
};

// Atualiza campos de uma inscrição (horário da prova, respostas, entrega)
export const atualizar = async (inscricao: Inscricao, campos: Partial<Inscricao>): Promise<Inscricao> => {
  const sb = supabase();
  if (!sb) {
    const lista = await lerLocal();
    const atual = lista.find((i) => i.numero === inscricao.numero) ?? inscricao;
    const atualizada = { ...atual, ...campos };
    await gravarLocal(lista.map((i) => (i.numero === inscricao.numero ? atualizada : i)));
    return atualizada;
  }
  const res = await fetch(`${sb.url}?numero=eq.${inscricao.numero}`, {
    method: 'PATCH',
    headers: { ...sb.headers, Prefer: 'return=representation' },
    body: JSON.stringify(campos),
  });
  if (!res.ok) {
    throw new Error(`Supabase respondeu ${res.status}: ${await res.text()}`);
  }
  const [atualizada] = (await res.json()) as Inscricao[];
  return atualizada;
};

export const trocarHorario = (inscricao: Inscricao, dia: string, hora: string) =>
  atualizar(inscricao, { dia_prova: dia, hora_prova: hora });

// O que o candidato vê da própria inscrição (sem CPF nem dados internos)
export const visaoCandidato = (i: Inscricao) => ({
  numero: i.numero,
  codigo: normalizarCodigo(i.codigo),
  nome: i.nome,
  email: i.email,
  celular: i.celular,
  forma: i.forma,
  ofertaId: i.oferta_id,
  fazProva: i.faz_prova,
  diaProva: i.dia_prova,
  horaProva: i.hora_prova?.slice(0, 5) ?? null,
  provaIniciada: !!i.prova_inicio,
  provaEntregue: !!i.prova_entregue_em,
});

export const listarInscricoes = async (): Promise<Inscricao[]> => {
  const sb = supabase();
  if (!sb) {
    return lerLocal();
  }
  const res = await fetch(`${sb.url}?order=numero.asc`, { headers: sb.headers, cache: 'no-store' });
  if (!res.ok) {
    throw new Error(`Supabase respondeu ${res.status}: ${await res.text()}`);
  }
  return (await res.json()) as Inscricao[];
};

// ---------- Configurações (resultado publicado) ----------
// Tabela vestibular_config (chave, valor jsonb) no Supabase; arquivo .data/vestibular-config.json em desenvolvimento
const arquivoConfig = path.join(process.cwd(), '.data', 'vestibular-config.json');

const configSupabase = () => {
  const sb = supabase();
  return sb ? { ...sb, url: sb.url.replace(/vestibular_inscricoes$/, 'vestibular_config') } : null;
};

export const lerConfig = async <T>(chave: string): Promise<T | null> => {
  const sb = configSupabase();
  if (!sb) {
    try {
      return (JSON.parse(await fs.readFile(arquivoConfig, 'utf8'))[chave] as T) ?? null;
    } catch {
      return null;
    }
  }
  const res = await fetch(`${sb.url}?chave=eq.${encodeURIComponent(chave)}&limit=1`, {
    headers: sb.headers,
    cache: 'no-store',
  });
  if (!res.ok) {
    throw new Error(`Supabase respondeu ${res.status}: ${await res.text()}`);
  }
  const [linha] = (await res.json()) as { valor: T }[];
  return linha?.valor ?? null;
};

export const gravarConfig = async (chave: string, valor: unknown) => {
  const sb = configSupabase();
  if (!sb) {
    let atual: Record<string, unknown> = {};
    try {
      atual = JSON.parse(await fs.readFile(arquivoConfig, 'utf8'));
    } catch {
      // primeiro registro
    }
    if (valor === null) {
      delete atual[chave];
    } else {
      atual[chave] = valor;
    }
    await fs.mkdir(path.dirname(arquivoConfig), { recursive: true });
    await fs.writeFile(arquivoConfig, JSON.stringify(atual, null, 2));
    return;
  }
  const res = await fetch(`${sb.url}?on_conflict=chave`, {
    method: 'POST',
    headers: { ...sb.headers, Prefer: 'resolution=merge-duplicates' },
    body: JSON.stringify({ chave, valor }),
  });
  if (!res.ok) {
    throw new Error(`Supabase respondeu ${res.status}: ${await res.text()}`);
  }
};

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

export type Inscricao = NovaInscricao & {
  numero: number;
  codigo: string;
  criado_em: string;
};

export class CpfJaInscrito extends Error {
  constructor(public inscricao: Inscricao) {
    super('CPF já inscrito');
  }
}

// Código de acesso à prova: VIDAL- + 6 caracteres sem os que confundem (0/O, 1/I/L)
const alfabeto = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
export const gerarCodigo = () =>
  `VIDAL-${Array.from({ length: 6 }, () => alfabeto[randomInt(alfabeto.length)]).join('')}`;

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

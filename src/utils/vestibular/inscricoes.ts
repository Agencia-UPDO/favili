import 'server-only';

import { randomInt, timingSafeEqual } from 'node:crypto';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { NotasEnem } from '@/data/bolsas';
import { itensDocumento, StatusDocumento } from '@/data/inscricao';
import { FormaId } from '@/data/vestibular';

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
  // Dia da prova para o qual o lembrete (19/11) já saiu (troca de dia: o painel manda o do dia novo)
  lembrete_enviado_para?: string | null;
};

// Documento enviado pelo candidato (o arquivo fica na pasta privada; aqui só os dados)
export type Documento = {
  id: string;
  item: string;
  nome: string;
  caminho: string;
  tipo: string;
  tamanho: number;
  enviadoEm: string;
};

export type DadosDocumentos = {
  documentos?: Documento[] | null;
  documento_status?: StatusDocumento | null;
  documento_obs?: string | null;
  documento_revisado_em?: string | null;
  documento_revisado_por?: string | null;
  enem_ano?: number | null;
  enem_notas?: Partial<NotasEnem> | null;
  enem_media?: number | null;
};

export type Inscricao = NovaInscricao &
  DadosProva &
  DadosDocumentos & {
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

// Na Vercel não existe arquivo local: sem as variáveis do Supabase, tudo dá erro claro (nada é gravado em lugar
// nenhum por engano). O arquivo em .data/ só vale no computador de desenvolvimento.
export class SupabaseNaoConfigurado extends Error {
  constructor() {
    super('Supabase não configurado (SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY)');
  }
}

const supabase = () => {
  const url = process.env.SUPABASE_URL;
  const chave = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !chave) {
    if (process.env.VERCEL) {
      console.error('[vestibular] SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY não definida neste ambiente da Vercel');
      throw new SupabaseNaoConfigurado();
    }
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
  if (!inscricao) {
    return null;
  }
  const certo = Buffer.from(normalizarCodigo(inscricao.codigo));
  const recebido = Buffer.from(normalizarCodigo(codigo));
  return certo.length === recebido.length && timingSafeEqual(certo, recebido) ? inscricao : null;
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

// Novo código de acesso (o anterior deixa de valer). Se colidir com outro (raríssimo), tenta de novo.
export const trocarCodigo = async (inscricao: Inscricao): Promise<Inscricao> => {
  try {
    return await atualizar(inscricao, { codigo: gerarCodigo() });
  } catch {
    return atualizar(inscricao, { codigo: gerarCodigo() });
  }
};

// Registro de quem viu ou trocou o código pelo painel (últimos 2000)
type RegistroCodigo = { numero: number; acao: 'ver' | 'gerar'; por: string; em: string };
export const registrarCodigo = async (numero: number, acao: RegistroCodigo['acao'], por: string) => {
  const atual = (await lerConfig<RegistroCodigo[]>('log-codigos')) ?? [];
  await gravarConfig('log-codigos', [...atual, { numero, acao, por, em: new Date().toISOString() }].slice(-2000));
};
export const historicoCodigo = async (numero: number) =>
  ((await lerConfig<RegistroCodigo[]>('log-codigos')) ?? []).filter((r) => r.numero === numero).slice(-5);

export const trocarHorario = (inscricao: Inscricao, dia: string, hora: string) =>
  atualizar(inscricao, { dia_prova: dia, hora_prova: hora });

// Situação dos documentos: quem precisa mandar e ainda não tem registro está pendente
export const statusDocumento = (i: Inscricao): StatusDocumento | null =>
  i.documento_status ?? (itensDocumento[i.forma as FormaId] ? 'pendente' : null);

// Liberação antecipada para teste interno: as inscrições listadas em VESTIBULAR_LIBERAR_AGORA (números separados
// por vírgula) podem começar a prova a qualquer momento e têm 2 horas a partir do clique em "Começar" (prova.ts).
// Só elas: as demais seguem a janela do dia e horário escolhidos. Variável vazia ou ausente: nenhuma exceção.
export const liberadaAgora = (i: Pick<Inscricao, 'numero'>) =>
  (process.env.VESTIBULAR_LIBERAR_AGORA ?? '')
    .split(',')
    .map((n) => Number(n.trim()))
    .includes(i.numero);

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
  liberadaAgora: liberadaAgora(i),
  documentoStatus: statusDocumento(i),
  documentoObs: i.documento_status === 'recusado' ? (i.documento_obs ?? null) : null,
  enemAno: i.enem_ano ?? null,
  enemNotas: i.enem_notas ?? null,
  documentos: (i.documentos ?? []).map(({ id, item, nome, tamanho }) => ({ id, item, nome, tamanho })),
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

// Quem faz a prova no dia `dia` (AAAA-MM-DD), ainda não começou e não recebeu o lembrete para esse dia
export const listarParaLembrete = async (dia: string): Promise<Inscricao[]> => {
  const precisa = (i: Inscricao) =>
    i.faz_prova && i.dia_prova === dia && !i.prova_inicio && i.lembrete_enviado_para !== dia;
  const sb = supabase();
  if (!sb) {
    return (await lerLocal()).filter(precisa);
  }
  const filtro = new URLSearchParams({
    faz_prova: 'is.true',
    dia_prova: `eq.${dia}`,
    prova_inicio: 'is.null',
    or: `(lembrete_enviado_para.is.null,lembrete_enviado_para.neq.${dia})`,
    order: 'numero.asc',
  });
  const res = await fetch(`${sb.url}?${filtro}`, { headers: sb.headers, cache: 'no-store' });
  if (!res.ok) {
    throw new Error(`Supabase respondeu ${res.status}: ${await res.text()}`);
  }
  return ((await res.json()) as Inscricao[]).filter(precisa);
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

import 'server-only';

import { areasEnem, enemAprovado, mediaEnem, NotasEnem } from '@/data/bolsas';
import { documentoArquivosPorItem, documentoTamanhoMaximo, itensDocumento, StatusDocumento } from '@/data/inscricao';
import { FormaId } from '@/data/vestibular';
import { createHmac, randomUUID, timingSafeEqual } from 'node:crypto';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { atualizar, Documento, Inscricao, statusDocumento } from './inscricoes';

// Documentos do Enem, da segunda graduação e da transferência.
// Os arquivos vão para a pasta PRIVADA "vestibular-documentos" do Supabase Storage (ver supabase/migrations): o
// navegador envia direto para lá por um link de envio assinado (as funções da Vercel não aceitam corpos de 10 MB),
// e depois o servidor confere o tipo real do arquivo pelos primeiros bytes. Para ver, o painel gera um link que
// expira em 5 minutos. Sem Supabase (desenvolvimento), os arquivos ficam em .data/documentos/.

const pasta = 'vestibular-documentos';
const pastaLocal = path.join(process.cwd(), '.data', 'documentos');

const storage = () => {
  const url = process.env.SUPABASE_URL;
  const chave = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !chave) {
    return null;
  }
  return {
    base: `${url.replace(/\/$/, '')}/storage/v1`,
    headers: { apikey: chave, Authorization: `Bearer ${chave}` },
  };
};

const extensoes: Record<string, string> = {
  'application/pdf': 'pdf',
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/heic': 'heic',
  'image/heif': 'heic',
};

// Tipo real pelo começo do arquivo (não confia no nome nem no tipo que o navegador informou)
const tipoReal = (b: Buffer) => {
  if (b.subarray(0, 4).toString('latin1') === '%PDF') {
    return 'application/pdf';
  }
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) {
    return 'image/jpeg';
  }
  if (b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) {
    return 'image/png';
  }
  if (b.subarray(0, 4).toString('latin1') === 'RIFF' && b.subarray(8, 12).toString('latin1') === 'WEBP') {
    return 'image/webp';
  }
  if (
    b.subarray(4, 8).toString('latin1') === 'ftyp' &&
    /^(heic|heix|hevc|heim|heis|mif1|msf1)$/.test(b.subarray(8, 12).toString('latin1'))
  ) {
    return 'image/heic';
  }
  return null;
};

// ---------- Arquivos (Supabase ou pasta local) ----------
const assinaturaLocal = (caminho: string) =>
  createHmac('sha256', process.env.VESTIBULAR_PAINEL_SENHA || 'desenvolvimento')
    .update(`envio:${caminho}`)
    .digest('hex');

export const assinaturaLocalValida = (caminho: string, assinatura: string) => {
  const certa = Buffer.from(assinaturaLocal(caminho));
  const recebida = Buffer.from(assinatura);
  return certa.length === recebida.length && timingSafeEqual(certa, recebida);
};

const arquivoLocal = (caminho: string) => {
  const completo = path.join(pastaLocal, caminho);
  if (!completo.startsWith(pastaLocal + path.sep)) {
    throw new Error('Caminho inválido');
  }
  return completo;
};

export const gravarLocal = async (caminho: string, dados: Buffer) => {
  const destino = arquivoLocal(caminho);
  await fs.mkdir(path.dirname(destino), { recursive: true });
  await fs.writeFile(destino, dados);
};

export const lerLocal = (caminho: string) => fs.readFile(arquivoLocal(caminho));

// Link para o navegador enviar o arquivo direto (PUT)
const linkDeEnvio = async (caminho: string) => {
  const st = storage();
  if (!st) {
    return `/api/vestibular/documento?caminho=${encodeURIComponent(caminho)}&assinatura=${assinaturaLocal(caminho)}`;
  }
  const res = await fetch(`${st.base}/object/upload/sign/${pasta}/${caminho}`, { method: 'POST', headers: st.headers });
  if (!res.ok) {
    throw new Error(`Storage respondeu ${res.status}: ${await res.text()}`);
  }
  const { url } = (await res.json()) as { url: string };
  return `${st.base}${url}`;
};

// Começo do arquivo e tamanho, para conferir depois do envio
const inspecionar = async (caminho: string): Promise<{ inicio: Buffer; tamanho: number } | null> => {
  const st = storage();
  if (!st) {
    try {
      const dados = await lerLocal(caminho);
      return { inicio: dados.subarray(0, 16), tamanho: dados.length };
    } catch {
      return null;
    }
  }
  const res = await fetch(`${st.base}/object/authenticated/${pasta}/${caminho}`, {
    headers: { ...st.headers, Range: 'bytes=0-15' },
    cache: 'no-store',
  });
  if (!res.ok) {
    return null;
  }
  const total = res.headers.get('content-range')?.split('/')[1];
  const inicio = Buffer.from(await res.arrayBuffer()).subarray(0, 16);
  return { inicio, tamanho: Number(total ?? res.headers.get('content-length') ?? 0) };
};

const apagarArquivo = async (caminho: string) => {
  const st = storage();
  if (!st) {
    await fs.rm(arquivoLocal(caminho), { force: true });
    return;
  }
  await fetch(`${st.base}/object/${pasta}`, {
    method: 'DELETE',
    headers: { ...st.headers, 'Content-Type': 'application/json' },
    body: JSON.stringify({ prefixes: [caminho] }),
  });
};

// Link de leitura que expira em 5 minutos (só o painel usa); em desenvolvimento, null (o painel serve o arquivo)
export const linkDeLeitura = async (caminho: string) => {
  const st = storage();
  if (!st) {
    return null;
  }
  const res = await fetch(`${st.base}/object/sign/${pasta}/${caminho}`, {
    method: 'POST',
    headers: { ...st.headers, 'Content-Type': 'application/json' },
    body: JSON.stringify({ expiresIn: 300 }),
  });
  if (!res.ok) {
    throw new Error(`Storage respondeu ${res.status}: ${await res.text()}`);
  }
  const { signedURL } = (await res.json()) as { signedURL: string };
  return `${st.base}${signedURL}`;
};

// ---------- Regras ----------
export class ErroDocumento extends Error {}

const itens = (i: Inscricao) => itensDocumento[i.forma as FormaId] ?? [];

const completo = (i: Inscricao, documentos: Documento[]) =>
  itens(i).every((item) => documentos.some((d) => d.item === item.id));

const conferirPrazoEStatus = (i: Inscricao, fimInscricoes: string) => {
  if (!itens(i).length) {
    throw new ErroDocumento('Sua forma de ingresso não precisa de documento.');
  }
  if (statusDocumento(i) === 'aprovado' || statusDocumento(i) === 'reprovado') {
    throw new ErroDocumento('Seus documentos já foram analisados.');
  }
  if (Date.now() > new Date(fimInscricoes).getTime()) {
    throw new ErroDocumento('O prazo para enviar documentos pelo site terminou. Fale com a Faculdade Vidal.');
  }
};

export const prepararEnvio = async (
  i: Inscricao,
  dados: { item: string; tipo: string; tamanho: number },
  fimInscricoes: string,
) => {
  conferirPrazoEStatus(i, fimInscricoes);
  if (!itens(i).some((item) => item.id === dados.item)) {
    throw new ErroDocumento('Documento inválido.');
  }
  if (!(dados.tamanho > 0) || dados.tamanho > documentoTamanhoMaximo) {
    throw new ErroDocumento('O arquivo passa de 10 MB. Mande uma foto ou um PDF menor.');
  }
  const extensao = extensoes[dados.tipo];
  if (!extensao) {
    throw new ErroDocumento('Mande o documento em PDF ou como foto (JPG, PNG, HEIC ou WEBP).');
  }
  if ((i.documentos ?? []).filter((d) => d.item === dados.item).length >= documentoArquivosPorItem) {
    throw new ErroDocumento(`São no máximo ${documentoArquivosPorItem} arquivos por documento.`);
  }
  const caminho = `${i.numero}/${dados.item}-${randomUUID()}.${extensao}`;
  return { caminho, url: await linkDeEnvio(caminho) };
};

export const confirmarEnvio = async (i: Inscricao, dados: { caminho: string; nome: string }, fimInscricoes: string) => {
  conferirPrazoEStatus(i, fimInscricoes);
  const [dono, arquivo] = dados.caminho.split('/');
  const item = itens(i).find((it) => arquivo?.startsWith(`${it.id}-`));
  if (dono !== String(i.numero) || !item || !/^[a-z-]+-[0-9a-f-]{36}\.[a-z]+$/.test(arquivo)) {
    throw new ErroDocumento('Envio inválido.');
  }
  const atuais = i.documentos ?? [];
  if (atuais.some((d) => d.caminho === dados.caminho)) {
    return i;
  }
  const info = await inspecionar(dados.caminho);
  if (!info) {
    throw new ErroDocumento('O arquivo não chegou. Tente de novo.');
  }
  const tipo = tipoReal(info.inicio);
  if (!tipo || info.tamanho > documentoTamanhoMaximo) {
    await apagarArquivo(dados.caminho);
    throw new ErroDocumento('Esse arquivo não é um PDF ou uma foto válida. Tente outro arquivo.');
  }
  const documentos = [
    ...atuais,
    {
      id: arquivo.split('.')[0].slice(item.id.length + 1, item.id.length + 9),
      item: item.id,
      nome: dados.nome.slice(0, 120) || `${item.rotulo}.${extensoes[tipo]}`,
      caminho: dados.caminho,
      tipo,
      tamanho: info.tamanho,
      enviadoEm: new Date().toISOString(),
    },
  ];
  const status: StatusDocumento = completo(i, documentos)
    ? 'enviado'
    : statusDocumento(i) === 'recusado'
      ? 'recusado'
      : 'pendente';
  return atualizar(i, { documentos, documento_status: status });
};

export const removerDocumento = async (i: Inscricao, id: string, fimInscricoes: string) => {
  conferirPrazoEStatus(i, fimInscricoes);
  const doc = (i.documentos ?? []).find((d) => d.id === id);
  if (!doc) {
    return i;
  }
  await apagarArquivo(doc.caminho);
  const documentos = (i.documentos ?? []).filter((d) => d.id !== id);
  const atual = statusDocumento(i);
  const status: StatusDocumento = atual === 'recusado' ? 'recusado' : completo(i, documentos) ? 'enviado' : 'pendente';
  return atualizar(i, { documentos, documento_status: status });
};

// ---------- Notas do Enem ----------
const anoAtual = new Date().getFullYear();

// Aceita só números de 0 a 1000; o que faltar ou vier inválido fica de fora
const lerNotas = (bruto: unknown) => {
  const notas: Partial<NotasEnem> = {};
  for (const area of areasEnem) {
    const valor = Number(String((bruto as Record<string, unknown>)?.[area.id] ?? '').replace(',', '.'));
    if (String((bruto as Record<string, unknown>)?.[area.id] ?? '').trim() !== '' && valor >= 0 && valor <= 1000) {
      notas[area.id] = Math.round(valor * 10) / 10;
    }
  }
  return notas;
};

const lerAno = (bruto: unknown) => {
  const ano = Number(bruto);
  return Number.isInteger(ano) && ano >= 1998 && ano <= anoAtual ? ano : null;
};

// O candidato informa o ano e as notas (opcional) para adiantar a conferência da equipe
export const salvarNotasEnem = (i: Inscricao, ano: unknown, notas: unknown, fimInscricoes: string) => {
  conferirPrazoEStatus(i, fimInscricoes);
  if (i.forma !== 'enem') {
    throw new ErroDocumento('Sua forma de ingresso não usa notas do Enem.');
  }
  return atualizar(i, { enem_ano: lerAno(ano), enem_notas: lerNotas(notas) });
};

// A equipe confere as notas com o boletim e confirma: o sistema calcula a média e aprova ou reprova
export const confirmarNotasEnem = (i: Inscricao, ano: unknown, bruto: unknown, por: string) => {
  const notas = lerNotas(bruto);
  if (areasEnem.some((a) => notas[a.id] === undefined)) {
    throw new ErroDocumento('Preencha as 5 notas (de 0 a 1000).');
  }
  const completas = notas as NotasEnem;
  return atualizar(i, {
    enem_ano: lerAno(ano),
    enem_notas: completas,
    enem_media: mediaEnem(completas),
    documento_status: enemAprovado(completas) ? 'aprovado' : 'reprovado',
    documento_obs: null,
    documento_revisado_em: new Date().toISOString(),
    documento_revisado_por: por || null,
  });
};

// Decisão da equipe no painel (transferência e diploma; também "pedir outro documento" no Enem)
export const revisarDocumentos = (
  i: Inscricao,
  decisao: 'aprovado' | 'recusado' | 'enviado',
  obs: string,
  por: string,
) =>
  atualizar(i, {
    documento_status: decisao,
    documento_obs: decisao === 'recusado' ? obs : null,
    documento_revisado_em: new Date().toISOString(),
    documento_revisado_por: por || null,
  });

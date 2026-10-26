import 'server-only';

import { documentoPorForma, linkAreaCandidato } from '@/data/inscricao';
import { FormaId, formas, vestibular } from '@/data/vestibular';
import { Inscricao, statusDocumento } from './inscricoes';

const situacoes: Record<string, string> = {
  pendente: 'Falta enviar',
  enviado: 'Em análise',
  aprovado: 'Aprovado',
  recusado: 'Pedir outro',
  reprovado: 'Não aprovado',
};

// Conversão da inscrição do vestibular na RD Station (para a automação de WhatsApp via Kommo).
// Usa a mesma chave da conta (RDSTATION_API_KEY); o identificador é RDSTATION_CONVERSION_VESTIBULAR
// (padrão "vestibular-2027-1-inscricao"), separado do Empreend. Os campos cf_vestibular_* foram criados na RD em
// 26/10/2026. Vai o código e o nº JÁ gravados no Supabase (o objeto devolvido pelo INSERT); sem CPF nem nascimento.
// Duas conversões, para não confundir a automação:
// - "vestibular-2027-1-inscricao": UMA vez, na nova inscrição (é a que dispara o WhatsApp);
// - "vestibular-2027-1-atualizacao": quando o código é trocado no painel ou o candidato troca dia/horário, só para
//   atualizar os dados do lead (nenhuma automação deve escutar esta).
// Nunca derruba a inscrição: erro na RD só vai para o log (sem dados pessoais).

const endpoint = 'https://api.rd.services/platform/conversions';
// - "vestibular-2027-1-lembrete": na véspera da prova (cron /api/vestibular/lembretes), para o WhatsApp do lembrete.
export type TipoConversao = 'inscricao' | 'atualizacao' | 'lembrete';
const identificador = (tipo: TipoConversao) =>
  ({
    inscricao: process.env.RDSTATION_CONVERSION_VESTIBULAR || 'vestibular-2027-1-inscricao',
    atualizacao: process.env.RDSTATION_CONVERSION_VESTIBULAR_ATUALIZACAO || 'vestibular-2027-1-atualizacao',
    lembrete: process.env.RDSTATION_CONVERSION_VESTIBULAR_LEMBRETE || 'vestibular-2027-1-lembrete',
  })[tipo];

// "88999990000" → "+55 88 99999-0000"
const telefoneRd = (telefone: string) => {
  const digitos = telefone.replace(/\D/g, '');
  return `+55 ${digitos.slice(0, 2)} ${digitos.slice(2, -4)}-${digitos.slice(-4)}`;
};

const dataBr = (iso?: string | null) => (iso ? iso.slice(0, 10).split('-').reverse().join('/') : '');

// "o boletim de desempenho do Enem" → "Boletim de desempenho do Enem"
const semArtigo = (t: string) => t.replace(/^(o|a|os|as) /, '').replace(/^./, (c) => c.toUpperCase());

// Campos vazios não vão (para não apagar na RD um dado que já existe lá)
const semVazios = (o: Record<string, unknown>) =>
  Object.fromEntries(Object.entries(o).filter(([, v]) => v !== '' && v !== null && v !== undefined));

export const payloadRd = (i: Inscricao, tipo: TipoConversao = 'inscricao') =>
  semVazios({
    conversion_identifier: identificador(tipo),
    email: i.email,
    name: i.nome,
    mobile_phone: telefoneRd(i.celular),
    tags: ['vestibular-2027-1', `vestibular-${i.forma}`],
    traffic_source: 'vestibular-2027-1',
    // O formulário exige o aceite de contato por WhatsApp e e-mail
    legal_bases: [{ category: 'communications', type: 'consent', status: 'granted' }],
    cf_vestibular_n_inscricao: String(i.numero),
    cf_vestibular_codigo_de_acesso: i.codigo,
    cf_vestibular_forma_de_ingresso: formas.find((f) => f.id === i.forma)?.rotulo ?? i.forma,
    cf_vestibular_curso: i.curso,
    cf_vestibular_modalidade: i.modalidade,
    cf_vestibular_unidade: i.unidade,
    cf_vestibular_turno: i.turno,
    cf_vestibular_dia_da_prova: i.faz_prova ? dataBr(i.dia_prova) : '',
    cf_vestibular_hora_da_prova: i.faz_prova ? (i.hora_prova?.slice(0, 5) ?? '') : '',
    cf_vestibular_link_minha_inscricao: linkAreaCandidato,
    // Ficha do candidato no painel (pede a senha do painel; sem token no link)
    cf_vestibular_link_do_painel: `${vestibular.site}/vestibular/painel?inscricao=${i.numero}`,
    // Específicos da forma de ingresso (vazios quando não se aplicam)
    cf_vestibular_faz_prova: i.faz_prova ? 'Sim' : 'Não',
    cf_vestibular_instituicao_de_origem: i.instituicao_origem ?? '',
    cf_vestibular_curso_de_origem: i.curso_origem ?? '',
    cf_vestibular_periodo_atual: i.periodo_atual ?? '',
    cf_vestibular_documento: semArtigo(documentoPorForma[i.forma as FormaId] ?? ''),
    cf_vestibular_documento_situacao: situacoes[statusDocumento(i) ?? ''] ?? '',
    cf_vestibular_documento_motivo: i.documento_status === 'recusado' ? (i.documento_obs ?? '') : '',
    cf_vestibular_enem_ano: i.enem_ano ? String(i.enem_ano) : '',
    cf_vestibular_enem_media: i.enem_media != null ? Number(i.enem_media).toFixed(1).replace('.', ',') : '',
    cf_vestibular_enem_redacao:
      i.enem_media != null && i.enem_notas?.redacao != null ? String(i.enem_notas.redacao) : '',
  });

export const enviarConversaoRd = async (i: Inscricao, tipo: TipoConversao = 'inscricao') => {
  const chave = process.env.RDSTATION_API_KEY;
  if (!chave) {
    return false;
  }
  try {
    const res = await fetch(`${endpoint}?api_key=${encodeURIComponent(chave)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ event_type: 'CONVERSION', event_family: 'CDP', payload: payloadRd(i, tipo) }),
      // Não segura o candidato esperando a RD
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) {
      // Só o status e a mensagem da RD (que fala de campos, não do candidato)
      console.error('[vestibular rd] RD respondeu', res.status, (await res.text()).slice(0, 300));
      return false;
    }
    return true;
  } catch (e) {
    console.error('[vestibular rd] falha ao chamar a RD:', (e as Error).message);
    return false;
  }
};

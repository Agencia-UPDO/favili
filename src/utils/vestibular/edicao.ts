import 'server-only';

import { diasProva, horariosProva, ofertas, ofertasAtivas } from '@/data/inscricao';
import { FormaId, formas } from '@/data/vestibular';
import { atualizar, gravarConfig, Inscricao, lerConfig } from './inscricoes';
import { fimDaJanela, modoTeste } from './prova';

// "Editar inscrição" no painel (só a equipe, com a sessão do painel e a senha digitada de novo para salvar):
// - muda a forma de ingresso (ex.: 2ª graduação sem documento que quer fazer a prova para tentar bolsa por nota);
// - muda o dia/horário de quem faz a prova;
// - muda o curso (oferta: curso, modalidade, unidade e turno, só entre as ofertas abertas na inscrição).
// Mantém o número de inscrição e o código de acesso. Nada é apagado: origem acadêmica, documentos enviados e notas do
// Enem continuam gravados como histórico, mas só valem para a forma de ingresso atual (ver statusDocumento e
// payloadRd). As regras de dia e horário são as mesmas da inscrição pública.
// Travas: prova já iniciada ou entregue, horário do candidato já encerrado e resultado publicado.

export class ErroEdicao extends Error {}

export type Pedido = {
  forma: FormaId;
  fazProva: boolean;
  dia: string | null;
  hora: string | null;
  instituicaoOrigem: string | null;
  cursoOrigem: string | null;
  periodoAtual: string | null;
};

// O que aparece no "antes → depois" e no registro (sem dado pessoal: só curso, forma, prova, dia e horário).
// oferta: id da oferta (registros antigos, de antes da troca de curso, não têm)
export type Resumo = { oferta?: string; forma: FormaId; fazProva: boolean; dia: string | null; hora: string | null };

export const resumo = (i: Inscricao): Resumo => ({
  oferta: i.oferta_id,
  forma: i.forma as FormaId,
  fazProva: i.faz_prova,
  dia: i.faz_prova ? i.dia_prova : null,
  hora: i.faz_prova ? (i.hora_prova?.slice(0, 5) ?? null) : null,
});

// Motivo de não poder editar (null: pode)
export const travaEdicao = (i: Inscricao, publicado: boolean, agora = Date.now()): string | null => {
  if (publicado) {
    return 'O resultado já foi publicado: a inscrição não pode mais ser editada.';
  }
  if (i.prova_entregue_em) {
    return 'O candidato já entregou a prova.';
  }
  if (i.prova_inicio) {
    return 'O candidato já começou a prova.';
  }
  if (i.faz_prova && i.dia_prova && i.hora_prova && !modoTeste && agora >= fimDaJanela(i).getTime()) {
    return 'O horário de prova deste candidato já terminou.';
  }
  return null;
};

const texto = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '');

// Valida o pedido (as mesmas regras da inscrição pública) e devolve os campos a gravar
export const validarPedido = (i: Inscricao, corpo: Record<string, unknown>, agora = Date.now()) => {
  const forma = texto(corpo.forma, 30) as FormaId;
  if (!formas.some((f) => f.id === forma)) {
    throw new ErroEdicao('Escolha a forma de ingresso.');
  }
  // Curso: sem troca, vale o atual (mesmo que tenha saído desta edição); trocando, só ofertas abertas
  const ofertaId = texto(corpo.oferta, 60) || i.oferta_id;
  const oferta =
    ofertaId === i.oferta_id ? ofertas.find((o) => o.id === ofertaId) : ofertasAtivas.find((o) => o.id === ofertaId);
  if (!oferta) {
    throw new ErroEdicao('Escolha o curso.');
  }
  if (!oferta.formas.includes(forma)) {
    throw new ErroEdicao('Essa forma de ingresso não está disponível para esse curso.');
  }

  // Vestibular faz a prova; Enem pode fazer também para tentar uma bolsa maior; as outras não fazem
  const fazProva = forma === 'vestibular' || (forma === 'enem' && corpo.fazProva === true);
  const dia = fazProva ? texto(corpo.dia, 10) : '';
  const hora = fazProva ? texto(corpo.hora, 5) : '';
  if (fazProva && !diasProva.some((d) => d.id === dia)) {
    throw new ErroEdicao('Escolha o dia da prova (21 ou 22/11).');
  }
  if (fazProva && !horariosProva.includes(hora)) {
    throw new ErroEdicao('Escolha o horário da prova.');
  }
  if (fazProva && !modoTeste && agora >= fimDaJanela({ ...i, dia_prova: dia, hora_prova: hora }).getTime()) {
    throw new ErroEdicao('Esse horário de prova já terminou. Escolha outro.');
  }

  // 2ª graduação e transferência precisam da origem acadêmica (vem preenchida com o que já estava gravado)
  const deOutraFaculdade = forma === 'segunda-graduacao' || forma === 'transferencia';
  const instituicaoOrigem = deOutraFaculdade ? texto(corpo.instituicaoOrigem, 160) : '';
  const cursoOrigem = deOutraFaculdade ? texto(corpo.cursoOrigem, 120) : '';
  const periodoAtual = forma === 'transferencia' ? texto(corpo.periodoAtual, 20) : '';
  if (deOutraFaculdade && (!instituicaoOrigem || !cursoOrigem)) {
    throw new ErroEdicao('Informe a faculdade e o curso de origem.');
  }
  if (forma === 'transferencia' && !periodoAtual) {
    throw new ErroEdicao('Informe o período atual (transferência).');
  }

  const campos: Partial<Inscricao> = {
    oferta_id: oferta.id,
    curso: oferta.curso,
    modalidade: oferta.modalidade,
    unidade: oferta.unidade,
    turno: oferta.turno,
    processo_sei: oferta.processoSei,
    forma,
    faz_prova: fazProva,
    dia_prova: dia || null,
    hora_prova: hora || null,
    // Origem: só grava o que foi informado; nas outras formas o valor antigo fica como histórico
    ...(deOutraFaculdade ? { instituicao_origem: instituicaoOrigem, curso_origem: cursoOrigem } : {}),
    ...(forma === 'transferencia' ? { periodo_atual: periodoAtual } : {}),
  };
  const depois: Resumo = { oferta: oferta.id, forma, fazProva, dia: dia || null, hora: hora || null };
  const antes = resumo(i);
  const mudouOrigem =
    deOutraFaculdade &&
    (instituicaoOrigem !== (i.instituicao_origem ?? '') ||
      cursoOrigem !== (i.curso_origem ?? '') ||
      (forma === 'transferencia' && periodoAtual !== (i.periodo_atual ?? '')));
  if (JSON.stringify(antes) === JSON.stringify(depois) && !mudouOrigem) {
    throw new ErroEdicao('Nada mudou: escolha outro curso, forma de ingresso, dia ou horário.');
  }
  return { campos, antes, depois };
};

// Grava só se a prova ainda não começou (o candidato pode começar enquanto a equipe edita)
export const salvarEdicao = async (i: Inscricao, campos: Partial<Inscricao>) => {
  const atualizada = await atualizar(i, campos, { soSemProvaIniciada: true });
  if (!atualizada) {
    throw new ErroEdicao('O candidato começou a prova agora há pouco: a edição não foi salva.');
  }
  return atualizada;
};

// ---------- Registro (vestibular_config, chave "log-edicoes"; últimos 2000) ----------
// Só nº de inscrição, quem (nome digitado no painel), quando e o que mudou: forma, prova, dia e horário.
export type RegistroEdicao = {
  numero: number;
  por: string;
  em: string;
  antes: Resumo;
  depois: Resumo;
  avisouPorEmail: boolean;
  rd: boolean;
};

const chaveLog = 'log-edicoes';

export const registrarEdicao = async (registro: RegistroEdicao) => {
  const atual = (await lerConfig<RegistroEdicao[]>(chaveLog)) ?? [];
  await gravarConfig(chaveLog, [...atual, registro].slice(-2000));
};

export const lerEdicoes = async () => (await lerConfig<RegistroEdicao[]>(chaveLog)) ?? [];

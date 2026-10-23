import 'server-only';

import { bolsaIntegral, bolsasPorOferta, limitarQuantidades, notaAprovacao, notaMinimaBolsa } from '@/data/bolsas';
import { nomeOferta, ofertas } from '@/data/inscricao';
import { gravarConfig, Inscricao, lerConfig, listarInscricoes } from './inscricoes';

// Resultado do Vestibular Conquista Vidal 2027.1 (regulamento, Arts. 15 a 24, e notas mínimas da faculdade):
// - quem entregou a prova com nota abaixo de notaAprovacao é reprovado e não entra na classificação;
// - classificação dos aprovados pela nota total, da maior para a menor;
// - desempate: maior nota em Matemática, depois o candidato mais velho, depois a inscrição mais antiga;
// - bolsa de 100% para o 1º lugar geral, só se ele tiver a nota mínima dessa faixa;
// - as parciais vão, em cada oferta (curso, modalidade e unidade), na ordem da classificação: cada um recebe a
//   maior faixa ainda disponível no curso cuja nota mínima ele alcançou (ver src/data/bolsas.ts);
// - aprovado sem bolsa fica com os 40% garantidos; quem não fez a prova não aparece no resultado.

export type LinhaResultado = {
  numero: number;
  iniciais: string;
  ofertaId: string;
  oferta: string;
  nota: number;
  notaMatematica: number;
  aprovado: boolean;
  // posições só entre os aprovados (null para reprovados)
  classificacaoGeral: number | null;
  classificacaoOferta: number | null;
  bolsa: number | null;
};

export type Resultado = {
  publicadoEm: string | null;
  geradoEm: string;
  linhas: LinhaResultado[];
};

const chaveResultado = 'resultado-publicado';

// "Maria da Silva Souza" → "M. S. S." (preposições ficam de fora)
export const iniciais = (nome: string) =>
  nome
    .split(/\s+/)
    .filter((p) => p && !/^(da|de|do|das|dos|e)$/i.test(p))
    .map((p) => `${p[0].toUpperCase()}.`)
    .join(' ');

const comparar = (a: Inscricao, b: Inscricao) =>
  (b.nota ?? 0) - (a.nota ?? 0) ||
  (b.nota_matematica ?? 0) - (a.nota_matematica ?? 0) ||
  // mais velho primeiro: nascimento mais antigo
  a.nascimento.localeCompare(b.nascimento) ||
  a.criado_em.localeCompare(b.criado_em);

const alcanca = (nota: number, percentual: number) => nota >= (notaMinimaBolsa[percentual] ?? Infinity);

export const calcularResultado = (inscricoes: Inscricao[]): Resultado => {
  const entregues = inscricoes.filter((i) => i.prova_entregue_em).sort(comparar);
  const aprovados = entregues.filter((i) => (i.nota ?? 0) >= notaAprovacao);
  const reprovados = entregues.filter((i) => (i.nota ?? 0) < notaAprovacao);

  const porOferta = new Map<string, Inscricao[]>();
  for (const i of aprovados) {
    porOferta.set(i.oferta_id, [...(porOferta.get(i.oferta_id) ?? []), i]);
  }

  const bolsas = new Map<number, number>();
  const primeiro = aprovados[0];
  const integral = primeiro && alcanca(primeiro.nota ?? 0, bolsaIntegral) ? primeiro.numero : undefined;
  if (integral) {
    bolsas.set(integral, bolsaIntegral);
  }
  for (const [ofertaId, lista] of porOferta) {
    const disponiveis = [...(bolsasPorOferta[ofertaId] ?? [])].sort((a, b) => b - a);
    for (const i of lista) {
      if (i.numero === integral) {
        continue; // o 1º geral já tem 100% e não ocupa bolsa parcial
      }
      const idx = disponiveis.findIndex((p) => alcanca(i.nota ?? 0, p));
      if (idx === -1) {
        continue; // sem faixa ao alcance da nota: fica com os 40% garantidos
      }
      bolsas.set(i.numero, disponiveis[idx]);
      if (limitarQuantidades) {
        disponiveis.splice(idx, 1);
      }
    }
  }

  const linha = (i: Inscricao, aprovado: boolean, posicao: number | null): LinhaResultado => {
    const oferta = ofertas.find((o) => o.id === i.oferta_id);
    return {
      numero: i.numero,
      iniciais: iniciais(i.nome),
      ofertaId: i.oferta_id,
      oferta: oferta ? nomeOferta(oferta) : i.oferta_id,
      nota: i.nota ?? 0,
      notaMatematica: i.nota_matematica ?? 0,
      aprovado,
      classificacaoGeral: posicao,
      classificacaoOferta: aprovado
        ? (porOferta.get(i.oferta_id) ?? []).findIndex((x) => x.numero === i.numero) + 1
        : null,
      bolsa: bolsas.get(i.numero) ?? null,
    };
  };

  return {
    publicadoEm: null,
    geradoEm: new Date().toISOString(),
    linhas: [...aprovados.map((i, idx) => linha(i, true, idx + 1)), ...reprovados.map((i) => linha(i, false, null))],
  };
};

// Prévia com as notas de agora (para o painel conferir antes de publicar)
export const previaResultado = async () => calcularResultado(await listarInscricoes());

// Publicar congela o resultado: mudanças posteriores nas inscrições não alteram o que foi divulgado
export const publicarResultado = async () => {
  const resultado = { ...(await previaResultado()), publicadoEm: new Date().toISOString() };
  await gravarConfig(chaveResultado, resultado);
  return resultado;
};

export const despublicarResultado = () => gravarConfig(chaveResultado, null);

export const resultadoPublicado = () => lerConfig<Resultado>(chaveResultado);

// O que o candidato vê em Minha inscrição
export const resultadoDoCandidato = async (i: Inscricao) => {
  const publicado = await resultadoPublicado();
  if (!publicado?.publicadoEm) {
    return null;
  }
  const linha = publicado.linhas.find((l) => l.numero === i.numero);
  return {
    publicado: true,
    classificado: !!linha?.aprovado,
    reprovado: linha ? !linha.aprovado : false,
    nota: linha?.nota ?? i.nota ?? null,
    classificacaoOferta: linha?.classificacaoOferta ?? null,
    totalOferta: publicado.linhas.filter((l) => l.aprovado && l.ofertaId === i.oferta_id).length,
    bolsa: linha?.bolsa ?? null,
  };
};

import 'server-only';

import { bolsaIntegral, bolsasPorOferta } from '@/data/bolsas';
import { nomeOferta, ofertas } from '@/data/inscricao';
import { gravarConfig, Inscricao, lerConfig, listarInscricoes } from './inscricoes';

// Resultado do Vestibular Conquista Vidal 2027.1 (regulamento, Arts. 15 a 24):
// - classificação pela nota total, da maior para a menor;
// - desempate: maior nota em Matemática, depois o candidato mais velho, depois a inscrição mais antiga;
// - bolsa de 100% para o 1º lugar geral; as parciais vão, em cada oferta (curso, modalidade e unidade),
//   para os mais bem classificados, na quantidade e nos percentuais da seção 8;
// - quem não fez a prova ou zerou não é classificado (caráter eliminatório) e mantém os 40% garantidos.

export type LinhaResultado = {
  numero: number;
  iniciais: string;
  ofertaId: string;
  oferta: string;
  nota: number;
  notaMatematica: number;
  classificacaoGeral: number;
  classificacaoOferta: number;
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

export const calcularResultado = (inscricoes: Inscricao[]): Resultado => {
  const classificados = inscricoes.filter((i) => i.prova_entregue_em && (i.nota ?? 0) > 0).sort(comparar);
  const integral = classificados[0]?.numero;
  const porOferta = new Map<string, Inscricao[]>();
  for (const i of classificados) {
    porOferta.set(i.oferta_id, [...(porOferta.get(i.oferta_id) ?? []), i]);
  }

  const bolsas = new Map<number, number>();
  if (integral) {
    bolsas.set(integral, bolsaIntegral);
  }
  for (const [ofertaId, lista] of porOferta) {
    const disponiveis = [...(bolsasPorOferta[ofertaId] ?? [])];
    for (const i of lista) {
      if (i.numero === integral) {
        continue; // o 1º geral já tem 100% e não ocupa bolsa parcial
      }
      const bolsa = disponiveis.shift();
      if (bolsa === undefined) {
        break;
      }
      bolsas.set(i.numero, bolsa);
    }
  }

  const linhas = classificados.map((i, idx) => {
    const oferta = ofertas.find((o) => o.id === i.oferta_id);
    return {
      numero: i.numero,
      iniciais: iniciais(i.nome),
      ofertaId: i.oferta_id,
      oferta: oferta ? nomeOferta(oferta) : i.oferta_id,
      nota: i.nota ?? 0,
      notaMatematica: i.nota_matematica ?? 0,
      classificacaoGeral: idx + 1,
      classificacaoOferta: (porOferta.get(i.oferta_id) ?? []).findIndex((x) => x.numero === i.numero) + 1,
      bolsa: bolsas.get(i.numero) ?? null,
    };
  });
  return { publicadoEm: null, geradoEm: new Date().toISOString(), linhas };
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
    classificado: !!linha,
    nota: linha?.nota ?? i.nota ?? null,
    classificacaoOferta: linha?.classificacaoOferta ?? null,
    totalOferta: publicado.linhas.filter((l) => l.ofertaId === i.oferta_id).length,
    bolsa: linha?.bolsa ?? null,
  };
};

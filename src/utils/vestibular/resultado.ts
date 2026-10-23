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
// - aprovado sem bolsa fica com os 40% garantidos; quem não fez a prova não aparece no resultado;
// - ajustes manuais do painel (só antes de publicar) vencem as regras acima: a situação forçada decide se a
//   pessoa entra na classificação, e a bolsa forçada é dada antes da distribuição automática, ocupando uma vaga
//   do curso daquela faixa, se houver.

export type Situacao = 'aprovado' | 'reprovado';

export type Ajuste = {
  situacao: Situacao | null; // null: pela nota
  bolsa: number | null; // null: pela nota; 0: sem bolsa (40% garantidos)
  obs: string;
  em: string;
};
export type Ajustes = Record<string, Ajuste>;

export type LinhaResultado = {
  numero: number;
  iniciais: string;
  ofertaId: string;
  oferta: string;
  nota: number;
  notaMatematica: number;
  aprovado: boolean;
  ajuste: Ajuste | null;
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
const chaveAjustes = 'ajustes-manuais';

export const lerAjustes = async () => (await lerConfig<Ajustes>(chaveAjustes)) ?? {};

// Sem situação, bolsa nem observação, o ajuste é apagado e a inscrição volta a seguir só a nota
export const ajustar = async (numero: number, ajuste: Omit<Ajuste, 'em'>) => {
  const ajustes = await lerAjustes();
  if (ajuste.situacao || ajuste.bolsa !== null || ajuste.obs) {
    ajustes[numero] = { ...ajuste, em: new Date().toISOString() };
  } else {
    delete ajustes[numero];
  }
  await gravarConfig(chaveAjustes, ajustes);
};

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

export const calcularResultado = (inscricoes: Inscricao[], ajustes: Ajustes = {}): Resultado => {
  const entregues = inscricoes.filter((i) => i.prova_entregue_em).sort(comparar);
  const aprova = (i: Inscricao) => {
    const situacao = ajustes[i.numero]?.situacao;
    return situacao ? situacao === 'aprovado' : (i.nota ?? 0) >= notaAprovacao;
  };
  const aprovados = entregues.filter(aprova);
  const reprovados = entregues.filter((i) => !aprova(i));

  const porOferta = new Map<string, Inscricao[]>();
  for (const i of aprovados) {
    porOferta.set(i.oferta_id, [...(porOferta.get(i.oferta_id) ?? []), i]);
  }
  const vagas = new Map(
    [...porOferta.keys()].map((id) => [id, [...(bolsasPorOferta[id] ?? [])].sort((a, b) => b - a)]),
  );

  // 1) bolsas forçadas no painel (ocupam uma vaga daquela faixa no curso, se houver)
  const bolsas = new Map<number, number>();
  const definidas = new Set<number>();
  for (const i of aprovados) {
    const bolsa = ajustes[i.numero]?.bolsa;
    if (bolsa === null || bolsa === undefined) {
      continue;
    }
    definidas.add(i.numero);
    if (bolsa > 0) {
      bolsas.set(i.numero, bolsa);
      const lista = vagas.get(i.oferta_id) ?? [];
      if (limitarQuantidades && lista.includes(bolsa)) {
        lista.splice(lista.indexOf(bolsa), 1);
      }
    }
  }

  // 2) 100% para o 1º geral, se ninguém recebeu 100% manualmente (não ocupa bolsa parcial do curso)
  const primeiro = aprovados[0];
  if (
    primeiro &&
    !definidas.has(primeiro.numero) &&
    ![...bolsas.values()].includes(bolsaIntegral) &&
    alcanca(primeiro.nota ?? 0, bolsaIntegral)
  ) {
    bolsas.set(primeiro.numero, bolsaIntegral);
    definidas.add(primeiro.numero);
  }

  // 3) parciais pela classificação em cada curso
  for (const [ofertaId, lista] of porOferta) {
    const disponiveis = vagas.get(ofertaId) ?? [];
    for (const i of lista) {
      if (definidas.has(i.numero)) {
        continue;
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
      ajuste: ajustes[i.numero] ?? null,
      classificacaoGeral: posicao,
      classificacaoOferta: aprovado
        ? (porOferta.get(i.oferta_id) ?? []).findIndex((x) => x.numero === i.numero) + 1
        : null,
      bolsa: aprovado ? (bolsas.get(i.numero) ?? null) : null,
    };
  };

  return {
    publicadoEm: null,
    geradoEm: new Date().toISOString(),
    linhas: [...aprovados.map((i, idx) => linha(i, true, idx + 1)), ...reprovados.map((i) => linha(i, false, null))],
  };
};

// Prévia com as notas de agora (para o painel conferir antes de publicar)
export const previaResultado = async () => calcularResultado(await listarInscricoes(), await lerAjustes());

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
    // reprovado pela nota, reprovado manualmente ou ausente (sem linha no resultado): sem bolsa e sem os 40%
    reprovado: !linha?.aprovado,
    classificacaoOferta: linha?.classificacaoOferta ?? null,
    totalOferta: publicado.linhas.filter((l) => l.aprovado && l.ofertaId === i.oferta_id).length,
    bolsa: linha?.bolsa ?? null,
  };
};

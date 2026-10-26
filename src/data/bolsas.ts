import { ofertasAtivas } from './inscricao';

// Regras de bolsas do Vestibular Conquista Vidal 2027.1 (regulamento revisado de 26/10/2026: Art. 22 a 25 e
// seção 8). Tudo o que pode mudar está neste arquivo.

// Abaixo desta nota (de 0 a 10) o candidato é reprovado
export const notaAprovacao = 5;

// Nota mínima para cada faixa de bolsa
export const notaMinimaBolsa: Record<number, number> = {
  50: 5,
  60: 6,
  65: 7,
  70: 8,
  100: 9,
};

// true: cada curso tem a quantidade de bolsas da lista abaixo, distribuídas pela classificação.
// false: a bolsa é só pela nota (cada um recebe a maior faixa do curso que alcançou, sem limite de vagas).
export const limitarQuantidades = true;

const repetir = (percentual: number, vezes: number) => Array<number>(vezes).fill(percentual);

const presencialPadrao = [...repetir(65, 1), ...repetir(60, 2), ...repetir(50, 2)];
// EAD e semipresencial: 10 de 70% e 10 de 60% por oferta (eram 5 + 5 no regulamento anterior)
const eadPadrao = [...repetir(70, 10), ...repetir(60, 10)];

// Bolsas por oferta, da maior para a menor. A de 100% vai para o 1º lugar geral (Art. 22), à parte destas.
export const bolsasPorOferta: Record<string, number[]> = {
  // Administração presencial: 5 de 65% e 5 de 60% (eram 5 de 65%)
  administracao: [...repetir(65, 5), ...repetir(60, 5)],
  direito: presencialPadrao,
  enfermagem: presencialPadrao,
  fisioterapia: presencialPadrao,
  psicologia: presencialPadrao,
  'terapia-ocupacional': presencialPadrao,
  biomedicina: presencialPadrao,
  odontologia: presencialPadrao,
  'administracao-ead': eadPadrao,
  'pedagogia-semi': eadPadrao,
  'recursos-humanos-ead': eadPadrao,
  'administracao-ead-fortaleza': eadPadrao,
  'pedagogia-semi-fortaleza': eadPadrao,
  'recursos-humanos-ead-fortaleza': eadPadrao,
};

export const bolsaIntegral = 100;

// Total anunciado: parciais das ofertas abertas nesta edição + a integral (o regulamento original previa 101, com RH)
export const totalBolsas = ofertasAtivas.reduce((total, o) => total + (bolsasPorOferta[o.id]?.length ?? 0), 0) + 1;

// Ingresso pelo Enem (regra da faculdade, 23/10/2026): média das 5 notas de pelo menos 450 e redação acima de 0.
// A equipe confere o boletim no painel e confirma as notas; o sistema aprova ou reprova sozinho.
export const enemMediaMinima = 450;
export const enemRedacaoMinima = 0; // a redação precisa ser MAIOR que este valor

export const areasEnem = [
  { id: 'linguagens', rotulo: 'Linguagens' },
  { id: 'humanas', rotulo: 'Ciências Humanas' },
  { id: 'natureza', rotulo: 'Ciências da Natureza' },
  { id: 'matematica', rotulo: 'Matemática' },
  { id: 'redacao', rotulo: 'Redação' },
] as const;

export type NotasEnem = Record<(typeof areasEnem)[number]['id'], number>;

export const mediaEnem = (notas: NotasEnem) =>
  Math.round((areasEnem.reduce((soma, a) => soma + notas[a.id], 0) / areasEnem.length) * 100) / 100;

export const enemAprovado = (notas: NotasEnem) =>
  mediaEnem(notas) >= enemMediaMinima && notas.redacao > enemRedacaoMinima;

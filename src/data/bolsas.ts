// Regras de bolsas do Vestibular Conquista Vidal 2027.1 (regulamento, seção 8, e notas mínimas passadas pela
// faculdade em 23/10/2026). Tudo o que pode mudar está neste arquivo.

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
const eadPadrao = [...repetir(70, 5), ...repetir(60, 5)];

// Bolsas por oferta, da maior para a menor. A de 100% vai para o 1º lugar geral (Art. 22), à parte destas.
export const bolsasPorOferta: Record<string, number[]> = {
  administracao: repetir(65, 5),
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

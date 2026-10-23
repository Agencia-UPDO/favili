// Bolsas do Vestibular Conquista Vidal 2027.1 por oferta (regulamento, seção 8 – Da distribuição das bolsas).
// Os percentuais vão do maior para o menor: o 1º classificado do curso recebe o primeiro da lista, e assim por diante.
// A bolsa de 100% vai para o 1º lugar da classificação geral (Art. 22), à parte destas.

const repetir = (percentual: number, vezes: number) => Array<number>(vezes).fill(percentual);

const presencialPadrao = [...repetir(65, 1), ...repetir(60, 2), ...repetir(50, 2)];
const eadPadrao = [...repetir(70, 5), ...repetir(60, 5)];

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

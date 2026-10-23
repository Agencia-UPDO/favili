// Dados de exemplo do vestibular, só no armazenamento local de desenvolvimento (.data/), para ver o resultado.
//   node scripts/vestibular-teste.mjs criar    → cria inscrições fictícias com prova entregue e nota
//   node scripts/vestibular-teste.mjs limpar   → apaga essas inscrições e despublica o resultado
// As inscrições fictícias têm origem "teste-simulacao", nome começando por "Teste" e CPF 000000000xx.
// Nada aqui toca o Supabase: com SUPABASE_URL definida o script se recusa a rodar.

import { promises as fs } from 'node:fs';
import path from 'node:path';

const origem = 'teste-simulacao';
const pasta = path.join(process.cwd(), '.data');
const arquivoInscricoes = path.join(pasta, 'vestibular-inscricoes.json');
const arquivoConfig = path.join(pasta, 'vestibular-config.json');

// nome, oferta, nota (0 a 10), nota de Matemática (0 a 5), nascimento, entregou a prova
const exemplos = [
  ['Teste Ana Beatriz Lima', 'direito', 9.5, 5, '2006-03-12', true],
  ['Teste Bruno Carvalho', 'direito', 8, 4, '2005-08-01', true],
  ['Teste Carla Mendes', 'direito', 6.5, 3, '2007-01-20', true],
  ['Teste Daniel Rocha', 'psicologia', 7.5, 4, '2004-11-05', true],
  ['Teste Elisa Nogueira', 'psicologia', 6, 3.5, '2006-06-30', true],
  ['Teste Fábio Araújo', 'psicologia', 3, 1.5, '2005-02-14', true],
  ['Teste Gabriela Sousa', 'psicologia', 2.5, 1, '2007-09-09', true],
  ['Teste Heitor Pinheiro', 'enfermagem', 8, 4.5, '2006-12-02', true],
  ['Teste Iara Freitas', 'enfermagem', 8, 4.5, '2003-04-18', true], // empate total: a mais velha fica à frente
  ['Teste João Pedro Costa', 'administracao-ead', 7, 3, '1998-07-22', true],
  ['Teste Karina Holanda', 'administracao-ead', 5.5, 2.5, '1995-10-10', true],
  ['Teste Lucas Moreira', 'pedagogia-semi', 6.5, 2, '2001-05-03', true],
  ['Teste Marina Bezerra', 'odontologia', 0, 0, '2006-02-27', true], // zerou: não é classificada
  ['Teste Nicolas Fernandes', 'fisioterapia', null, null, '2006-08-15', false], // faltou
];

const lerJson = async (arquivo, padrao) => {
  try {
    return JSON.parse(await fs.readFile(arquivo, 'utf8'));
  } catch {
    return padrao;
  }
};

const gravarJson = async (arquivo, valor) => {
  await fs.mkdir(pasta, { recursive: true });
  await fs.writeFile(arquivo, JSON.stringify(valor, null, 2));
};

const ofertaInfo = (id) =>
  id.includes('ead') || id.includes('semi')
    ? {
        curso: id.startsWith('pedagogia')
          ? 'Pedagogia'
          : id.startsWith('recursos')
            ? 'Recursos Humanos'
            : 'Administração',
        modalidade: id.includes('semi') ? 'Semipresencial' : 'EaD',
        unidade: id.endsWith('fortaleza') ? 'Fortaleza' : 'Limoeiro do Norte',
        turno: 'Livre',
      }
    : { curso: id, modalidade: 'Presencial', unidade: 'Limoeiro do Norte', turno: 'Noite' };

const criar = async () => {
  const lista = (await lerJson(arquivoInscricoes, [])).filter((i) => i.origem !== origem);
  let numero = lista.reduce((maior, i) => Math.max(maior, i.numero), 2027100000);
  const agora = Date.now();
  const novas = exemplos.map(([nome, ofertaId, nota, notaMatematica, nascimento, entregou], idx) => {
    numero += 1;
    const inicio = new Date(agora - (60 - idx) * 60_000).toISOString();
    return {
      cpf: `000000000${String(idx + 10).padStart(2, '0')}`,
      nome,
      email: `teste${idx + 1}@exemplo.invalid`,
      celular: '(88) 90000-0000',
      nascimento,
      forma: 'vestibular',
      oferta_id: ofertaId,
      ...ofertaInfo(ofertaId),
      processo_sei: 148,
      faz_prova: true,
      dia_prova: '2026-11-21',
      hora_prova: '18:00',
      instituicao_origem: null,
      curso_origem: null,
      periodo_atual: null,
      atendimento_especial: null,
      origem,
      numero,
      codigo: `TST${String(idx + 1).padStart(3, '0')}`,
      criado_em: new Date(agora - (120 - idx) * 60_000).toISOString(),
      prova_inicio: entregou ? inicio : null,
      prova_fim: null,
      prova_entregue_em: entregou ? new Date(agora - (30 - idx) * 60_000).toISOString() : null,
      questoes_sorteadas: null,
      respostas: null,
      acertos: nota === null ? null : nota / 0.5,
      nota,
      nota_matematica: notaMatematica,
    };
  });
  await gravarJson(arquivoInscricoes, [...lista, ...novas]);
  console.log(`${novas.length} inscrições de teste criadas (${novas[0].numero} a ${numero}).`);
};

const limpar = async () => {
  const lista = await lerJson(arquivoInscricoes, []);
  const restantes = lista.filter((i) => i.origem !== origem);
  await gravarJson(arquivoInscricoes, restantes);
  const config = await lerJson(arquivoConfig, {});
  delete config['resultado-publicado'];
  await gravarJson(arquivoConfig, config);
  console.log(`${lista.length - restantes.length} inscrições de teste apagadas; resultado despublicado.`);
};

if (process.env.SUPABASE_URL) {
  console.error('SUPABASE_URL está definida: este script só mexe nos dados locais de desenvolvimento.');
  process.exit(1);
}

const comando = process.argv[2];
if (comando === 'criar') {
  await criar();
} else if (comando === 'limpar') {
  await limpar();
} else {
  console.log('Use: node scripts/vestibular-teste.mjs criar | limpar');
}

// Carga fake no Supabase para ver o painel e o resultado com volume (só para teste, antes do vestibular).
//   npx tsx scripts/vestibular-carga-fake.mjs criar    → cria 40 inscrições fictícias, a maioria com prova entregue
//   npx tsx scripts/vestibular-carga-fake.mjs documentos → nas fictícias do Enem, segunda graduação e transferência,
//                                                       envia um PDF de exemplo e espalha as situações
//                                                       (falta enviar, para analisar, aprovado, pediu outro, reprovado)
//   npx tsx scripts/vestibular-carga-fake.mjs limpar   → apaga só essas inscrições, os ajustes manuais delas e
//                                                       o resultado publicado
// As fictícias têm nome começando por "TESTE", e-mail @exemplo.com e origem "carga-fake"; o CPF é aleatório
// (válido só no formato). Lê SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY do .env.local.
// Depois de limpar, rode no SQL Editor: alter sequence vestibular_inscricao_numero restart with 2027100001;

import { randomInt } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import { diasProva, horariosProva, itensDocumento, ofertas } from '../src/data/inscricao.ts';

const origem = 'carga-fake';

const env = Object.fromEntries(
  readFileSync('.env.local', 'utf8')
    .split(/\r?\n/)
    .filter((l) => /^[A-Z_]+=/.test(l))
    .map((l) => [l.slice(0, l.indexOf('=')), l.slice(l.indexOf('=') + 1).trim()]),
);
if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Defina SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no .env.local.');
  process.exit(1);
}
const chave = env.SUPABASE_SERVICE_ROLE_KEY;
const headers = { apikey: chave, Authorization: `Bearer ${chave}`, 'Content-Type': 'application/json' };
const rest = `${env.SUPABASE_URL.replace(/\/$/, '')}/rest/v1`;

const pedir = async (caminho, opcoes = {}) => {
  const res = await fetch(`${rest}/${caminho}`, { ...opcoes, headers: { ...headers, ...opcoes.headers } });
  if (!res.ok) {
    throw new Error(`Supabase respondeu ${res.status}: ${await res.text()}`);
  }
  return res.status === 204 ? null : res.json();
};

const sortear = (lista) => lista[randomInt(lista.length)];

const cpfAleatorio = () => {
  const d = Array.from({ length: 9 }, () => randomInt(10));
  for (const n of [9, 10]) {
    const soma = d.slice(0, n).reduce((t, x, i) => t + x * (n + 1 - i), 0);
    d.push(((soma * 10) % 11) % 10);
  }
  return d.join('');
};

const alfabeto = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
const codigo = () => Array.from({ length: 6 }, () => sortear(alfabeto)).join('');

const nomes = [
  'Ana',
  'Bruno',
  'Carla',
  'Diego',
  'Elisa',
  'Fábio',
  'Gabriela',
  'Heitor',
  'Iara',
  'João',
  'Karina',
  'Lucas',
  'Marina',
  'Nicolas',
  'Otávio',
  'Paula',
  'Rafael',
  'Sofia',
  'Tiago',
  'Vitória',
];
const sobrenomes = [
  'Lima',
  'Carvalho',
  'Mendes',
  'Rocha',
  'Nogueira',
  'Araújo',
  'Sousa',
  'Pinheiro',
  'Freitas',
  'Costa',
  'Holanda',
  'Moreira',
  'Bezerra',
  'Lemos',
  'Maia',
];

// Notas de 0 a 10 em passos de 0,5, com alguns casos garantidos nas pontas
const notasFixas = [9.5, 9, 9, 8.5, 8, 4.5, 3, 0];
const notaAleatoria = () => randomInt(6, 19) / 2; // 3,0 a 9,0

const criar = async () => {
  const agora = Date.now();
  const linhas = Array.from({ length: 40 }, (_, idx) => {
    // 30 pelo vestibular (com prova), 5 pelo Enem (2 com prova), 3 de segunda graduação e 2 de transferência
    const forma = idx < 30 ? 'vestibular' : idx < 35 ? 'enem' : idx < 38 ? 'segunda-graduacao' : 'transferencia';
    const fazProva = forma === 'vestibular' || (forma === 'enem' && idx < 32);
    const faltou = idx === 28 || idx === 29; // inscritos que não fizeram a prova
    const oferta = sortear(ofertas.filter((o) => o.formas.includes(forma)));
    const nota = fazProva && !faltou ? (notasFixas[idx] ?? notaAleatoria()) : null;
    const matematica = nota === null ? null : Math.max(0, Math.min(5, nota - randomInt(0, 11) / 2));
    const inicio = new Date(agora - randomInt(60, 600) * 60_000);
    return {
      cpf: cpfAleatorio(),
      codigo: codigo(),
      criado_em: new Date(agora - (60 - idx) * 3_600_000).toISOString(),
      nome: `TESTE ${sortear(nomes)} ${sortear(sobrenomes)} ${sortear(sobrenomes)}`,
      email: `teste${idx + 1}@exemplo.com`,
      celular: `889${String(randomInt(10_000_000, 99_999_999))}`,
      nascimento: `${randomInt(1990, 2009)}-${String(randomInt(1, 13)).padStart(2, '0')}-${String(randomInt(1, 29)).padStart(2, '0')}`,
      forma,
      oferta_id: oferta.id,
      curso: oferta.curso,
      modalidade: oferta.modalidade,
      unidade: oferta.unidade,
      turno: oferta.turno,
      processo_sei: oferta.processoSei,
      faz_prova: fazProva,
      dia_prova: fazProva ? sortear(diasProva).id : null,
      hora_prova: fazProva ? sortear(horariosProva) : null,
      instituicao_origem: forma === 'segunda-graduacao' || forma === 'transferencia' ? 'Faculdade Exemplo' : null,
      curso_origem: forma === 'segunda-graduacao' || forma === 'transferencia' ? 'Curso Exemplo' : null,
      periodo_atual: forma === 'transferencia' ? '3º' : null,
      atendimento_especial: idx === 5 ? 'TESTE: ledor de tela' : null,
      origem,
      prova_inicio: nota === null ? null : inicio.toISOString(),
      prova_fim: nota === null ? null : new Date(inicio.getTime() + 2 * 3_600_000).toISOString(),
      prova_entregue_em: nota === null ? null : new Date(inicio.getTime() + randomInt(30, 115) * 60_000).toISOString(),
      acertos: nota === null ? null : nota * 2,
      nota,
      nota_matematica: matematica,
    };
  });
  const criadas = await pedir('vestibular_inscricoes', {
    method: 'POST',
    headers: { Prefer: 'return=representation' },
    body: JSON.stringify(linhas),
  });
  console.log(`${criadas.length} inscrições fictícias criadas (${criadas[0].numero} a ${criadas.at(-1).numero}).`);
};

const storage = `${env.SUPABASE_URL.replace(/\/$/, '')}/storage/v1`;
const pasta = 'vestibular-documentos';
const pdfExemplo = Buffer.from(
  '%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj 2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj ' +
    '3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 300 120]/Contents 4 0 R/Resources<</Font<</F1 5 0 R>>>>>>endobj ' +
    '4 0 obj<</Length 52>>stream\nBT /F1 18 Tf 20 60 Td (TESTE - documento ficticio) Tj ET\nendstream endobj ' +
    '5 0 obj<</Type/Font/Subtype/Type1/BaseFont/Helvetica>>endobj trailer<</Root 1 0 R>>\n%%EOF',
);

const documentos = async () => {
  const lista = await pedir(`vestibular_inscricoes?origem=eq.${origem}&forma=neq.vestibular&order=numero.asc`);
  const situacoes = ['enviado', 'enviado', 'aprovado', 'recusado', 'pendente', 'enviado', 'reprovado'];
  for (const [idx, i] of lista.entries()) {
    if ((i.documentos ?? []).length) {
      continue; // já tem documentos (de um teste anterior): não mexe
    }
    let situacao = situacoes[idx % situacoes.length];
    if (situacao === 'reprovado' && i.forma !== 'enem') {
      situacao = 'enviado';
    }
    const docs = [];
    if (situacao !== 'pendente') {
      for (const item of itensDocumento[i.forma] ?? []) {
        const id = randomUUID();
        const caminho = `${i.numero}/${item.id}-${id}.pdf`;
        const res = await fetch(`${storage}/object/${pasta}/${caminho}`, {
          method: 'POST',
          headers: { ...headers, 'Content-Type': 'application/pdf' },
          body: pdfExemplo,
        });
        if (!res.ok) {
          throw new Error(`Storage respondeu ${res.status}: ${await res.text()}`);
        }
        docs.push({
          id: id.slice(0, 8),
          item: item.id,
          nome: `TESTE ${item.rotulo}.pdf`,
          caminho,
          tipo: 'application/pdf',
          tamanho: pdfExemplo.length,
          enviadoEm: new Date(Date.now() - (lista.length - idx) * 3_600_000).toISOString(),
        });
      }
    }
    const notas =
      i.forma === 'enem' && situacao !== 'pendente'
        ? situacao === 'reprovado'
          ? { linguagens: 420, humanas: 410, natureza: 390, matematica: 400, redacao: 480 }
          : { linguagens: 560, humanas: 590, natureza: 520, matematica: 610, redacao: 720 }
        : null;
    const revisado = situacao === 'aprovado' || situacao === 'recusado' || situacao === 'reprovado';
    await pedir(`vestibular_inscricoes?numero=eq.${i.numero}`, {
      method: 'PATCH',
      body: JSON.stringify({
        documentos: docs,
        documento_status: situacao,
        documento_obs: situacao === 'recusado' ? 'TESTE: o documento está cortado, mande a página inteira' : null,
        documento_revisado_em: revisado ? new Date().toISOString() : null,
        documento_revisado_por: revisado ? 'TESTE Secretaria' : null,
        enem_ano: notas ? 2024 : null,
        enem_notas: notas,
        enem_media: notas && revisado ? Object.values(notas).reduce((a, b) => a + b, 0) / 5 : null,
      }),
    });
    console.log(`${i.numero} (${i.forma}): ${situacao}, ${docs.length} arquivo(s)`);
  }
};

const limpar = async () => {
  const apagadas = await pedir(`vestibular_inscricoes?origem=eq.${origem}`, {
    method: 'DELETE',
    headers: { Prefer: 'return=representation' },
  });
  const numeros = new Set(apagadas.map((i) => String(i.numero)));
  // Apaga tudo o que estiver na pasta de cada inscrição fictícia (inclusive arquivos de testes interrompidos)
  const caminhos = [];
  for (const numero of numeros) {
    const res = await fetch(`${storage}/object/list/${pasta}`, {
      method: 'POST',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ prefix: numero, limit: 1000 }),
    });
    const arquivos = res.ok ? await res.json() : [];
    caminhos.push(...arquivos.map((a) => `${numero}/${a.name}`));
  }
  if (caminhos.length) {
    await fetch(`${storage}/object/${pasta}`, {
      method: 'DELETE',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ prefixes: caminhos }),
    });
  }
  const [linha] = await pedir('vestibular_config?chave=eq.ajustes-manuais&limit=1');
  if (linha) {
    const ajustes = Object.fromEntries(Object.entries(linha.valor ?? {}).filter(([n]) => !numeros.has(n)));
    await pedir('vestibular_config?chave=eq.ajustes-manuais', {
      method: 'PATCH',
      body: JSON.stringify({ valor: ajustes }),
    });
  }
  await pedir('vestibular_config?chave=eq.resultado-publicado', { method: 'DELETE' });
  console.log(`${apagadas.length} inscrições fictícias apagadas; resultado despublicado.`);
  console.log('Para os números voltarem a começar em 2027100001, rode no SQL Editor do Supabase:');
  console.log('  alter sequence vestibular_inscricao_numero restart with 2027100001;');
};

const comando = process.argv[2];
if (comando === 'criar') {
  await criar();
} else if (comando === 'documentos') {
  await documentos();
} else if (comando === 'limpar') {
  await limpar();
} else {
  console.log('Use: npx tsx scripts/vestibular-carga-fake.mjs criar | documentos | limpar');
}

import 'server-only';

import bancoMatematica from '@/data/prova/banco-matematica.json';
import bancoPortugues from '@/data/prova/banco-portugues.json';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { atualizar, Inscricao } from './inscricoes';

// Motor da prova on-line. O banco de questões e o gabarito só existem no servidor: o navegador recebe as
// questões sorteadas para o candidato, sem a resposta certa, e cada resposta é gravada aqui.

type Alternativa = { letra: string; texto: string; imagem?: string };
type Questao = {
  id: string;
  area: 'linguagens' | 'matematica';
  nivel: 'facil' | 'medio';
  fonte?: string;
  textoBase?: string;
  enunciado: string;
  imagem?: string;
  alternativas: Alternativa[];
  correta: string;
};

const banco = [...(bancoPortugues as Questao[]), ...(bancoMatematica as Questao[])];
const porId = new Map(banco.map((q) => [q.id, q]));

// Composição de cada prova (regra da faculdade: 10 de Linguagens e 10 de Matemática, sorteadas por candidato).
// Linguagens: 5 fáceis + 5 médias. Matemática: proporção fixa para todos terem provas de dificuldade parecida.
const composicao = [
  { area: 'linguagens', nivel: 'facil', quantidade: 5 },
  { area: 'linguagens', nivel: 'medio', quantidade: 5 },
  { area: 'matematica', nivel: 'facil', quantidade: 3 },
  { area: 'matematica', nivel: 'medio', quantidade: 7 },
] as const;

export const totalQuestoes = composicao.reduce((total, c) => total + c.quantidade, 0);
const pontosPorQuestao = 0.5;
const duracaoMs = 2 * 60 * 60 * 1000;

// Modo de teste: libera a prova a qualquer hora, só fora de produção
export const modoTeste = process.env.VESTIBULAR_MODO_TESTE === '1' && process.env.NODE_ENV !== 'production';

const inicioHorario = (i: Inscricao) => new Date(`${i.dia_prova}T${i.hora_prova?.slice(0, 5)}:00-03:00`);
// Ninguém faz prova depois das 20h do dia escolhido
const limiteDoDia = (i: Inscricao) => new Date(`${i.dia_prova}T20:00:00-03:00`);

// Embaralhamento com semente fixa: o mesmo resultado sempre que for refeito com a mesma semente
const embaralhar = <T>(lista: T[], semente: string) => {
  let estado = createHash('sha256').update(semente).digest().readUInt32LE(0);
  const aleatorio = () => {
    estado = (estado * 1664525 + 1013904223) >>> 0;
    return estado / 2 ** 32;
  };
  const copia = [...lista];
  for (let i = copia.length - 1; i > 0; i--) {
    const j = Math.floor(aleatorio() * (i + 1));
    [copia[i], copia[j]] = [copia[j], copia[i]];
  }
  return copia;
};

// Sorteio das 20 questões do candidato (feito uma vez, ao começar, e gravado na inscrição).
// Linguagens vêm antes de Matemática; dentro de cada área, a ordem também é sorteada.
const sortear = (i: Inscricao) => {
  const semente = `${i.numero}-${i.codigo}-${Date.now()}`;
  return (['linguagens', 'matematica'] as const).flatMap((area) =>
    embaralhar(
      composicao
        .filter((c) => c.area === area)
        .flatMap((c) =>
          embaralhar(
            banco.filter((q) => q.area === c.area && q.nivel === c.nivel),
            `${semente}-${c.area}-${c.nivel}`,
          ).slice(0, c.quantidade),
        ),
      `${semente}-${area}-ordem`,
    ).map((q) => q.id),
  );
};

const questoesDe = (i: Inscricao) =>
  (i.questoes_sorteadas ?? []).map((id) => porId.get(id)).filter((q): q is Questao => !!q);

// As letras A–E são da posição na tela; o servidor traduz de volta para a letra original do banco.
// Questões com alternativas em figura (gráficos) mantêm a ordem original, como no enunciado.
const montarProva = (i: Inscricao) =>
  questoesDe(i).map((q) => {
    const ordem = q.alternativas.some((a) => a.imagem)
      ? q.alternativas
      : embaralhar(q.alternativas, `${i.numero}-${q.id}`);
    return {
      questao: q,
      alternativas: ordem.map((a, idx) => ({
        letra: 'ABCDE'[idx],
        original: a.letra,
        texto: a.texto,
        imagem: a.imagem,
      })),
    };
  });

export type Situacao = 'sem-prova' | 'aguardando' | 'liberada' | 'em-andamento' | 'entregue' | 'perdida';

export const situacao = (i: Inscricao, agora = Date.now()): Situacao => {
  if (!i.faz_prova || !i.dia_prova || !i.hora_prova) {
    return 'sem-prova';
  }
  if (i.prova_entregue_em) {
    return 'entregue';
  }
  if (i.prova_inicio) {
    return 'em-andamento';
  }
  if (modoTeste) {
    return 'liberada';
  }
  if (agora < inicioHorario(i).getTime()) {
    return 'aguardando';
  }
  return agora < limiteDoDia(i).getTime() ? 'liberada' : 'perdida';
};

const corrigir = (i: Inscricao) => {
  const respostas = i.respostas ?? {};
  let acertos = 0;
  let acertosMatematica = 0;
  for (const q of questoesDe(i)) {
    if (respostas[q.id] === q.correta) {
      acertos++;
      if (q.area === 'matematica') {
        acertosMatematica++;
      }
    }
  }
  return {
    acertos,
    nota: acertos * pontosPorQuestao,
    nota_matematica: acertosMatematica * pontosPorQuestao,
  };
};

export const entregar = async (i: Inscricao, quando = new Date()) =>
  atualizar(i, { prova_entregue_em: quando.toISOString(), ...corrigir(i) });

// Se o tempo acabou e o candidato não entregou (fechou o navegador, caiu a internet), entrega sozinha
export const entregarSeVenceu = async (i: Inscricao, agora = Date.now()) => {
  if (i.prova_inicio && !i.prova_entregue_em && i.prova_fim && agora >= new Date(i.prova_fim).getTime()) {
    return entregar(i, new Date(i.prova_fim));
  }
  return i;
};

export const iniciar = async (i: Inscricao, agora = Date.now()) => {
  const fim = Math.min(agora + duracaoMs, modoTeste ? Infinity : limiteDoDia(i).getTime());
  return atualizar(i, {
    prova_inicio: new Date(agora).toISOString(),
    prova_fim: new Date(fim).toISOString(),
    questoes_sorteadas: sortear(i),
    respostas: {},
  });
};

export const responder = async (i: Inscricao, questaoId: string, letraNaTela: string | null) => {
  const montada = montarProva(i).find((m) => m.questao.id === questaoId);
  if (!montada) {
    return null;
  }
  const respostas = { ...(i.respostas ?? {}) };
  if (letraNaTela) {
    const alternativa = montada.alternativas.find((a) => a.letra === letraNaTela);
    if (!alternativa) {
      return null;
    }
    respostas[questaoId] = alternativa.original;
  } else {
    delete respostas[questaoId];
  }
  return atualizar(i, { respostas });
};

// Figuras saem embutidas na resposta (data URI): não ficam num endereço público antes da prova
const pastaImagens = path.join(process.cwd(), 'src', 'data', 'prova', 'img');
const cacheImagens = new Map<string, string>();
const imagem = (nome?: string) => {
  if (!nome) {
    return null;
  }
  if (!cacheImagens.has(nome)) {
    const tipo = nome.endsWith('.png') ? 'image/png' : 'image/jpeg';
    cacheImagens.set(nome, `data:${tipo};base64,${readFileSync(path.join(pastaImagens, nome)).toString('base64')}`);
  }
  return cacheImagens.get(nome)!;
};

// O que vai para o navegador: questões sem gabarito, letras da tela e respostas já marcadas (nas letras da tela)
export const visaoProva = (i: Inscricao) => {
  const respostas = i.respostas ?? {};
  return montarProva(i).map(({ questao, alternativas }, idx) => {
    const marcada = alternativas.find((a) => a.original === respostas[questao.id]);
    return {
      numero: idx + 1,
      id: questao.id,
      area: questao.area === 'matematica' ? 'Matemática' : 'Linguagens e Códigos',
      fonte: questao.fonte ?? null,
      textoBase: questao.textoBase ?? null,
      enunciado: questao.enunciado,
      imagem: imagem(questao.imagem),
      alternativas: alternativas.map(({ letra, texto, imagem: img }) => ({ letra, texto, imagem: imagem(img) })),
      resposta: marcada?.letra ?? null,
    };
  });
};

import 'server-only';

import prova from '@/data/prova/prova.json';
import banco from '@/data/prova/questoes.json';
import { createHash } from 'node:crypto';
import { atualizar, Inscricao } from './inscricoes';

// Motor da prova on-line. O banco de questões e o gabarito só existem no servidor: o navegador recebe as
// questões sem a resposta certa, na ordem embaralhada daquele candidato, e cada resposta é gravada aqui.

type Alternativa = { letra: string; texto: string };
type Questao = {
  id: string;
  area: 'linguagens' | 'matematica';
  nivel: string;
  textoBase?: string;
  enunciado: string;
  imagem?: string;
  alternativas: Alternativa[];
  correta: string;
};

const questoes = (prova.questoes as string[]).map((id) => {
  const q = (banco as Questao[]).find((b) => b.id === id);
  if (!q) {
    throw new Error(`Questão ${id} da prova não está no banco`);
  }
  return q;
});

export const totalQuestoes = questoes.length;
const pontosPorQuestao = 0.5;
const duracaoMs = 2 * 60 * 60 * 1000;

// Modo de teste: libera a prova a qualquer hora, só fora de produção
export const modoTeste = process.env.VESTIBULAR_MODO_TESTE === '1' && process.env.NODE_ENV !== 'production';

const inicioHorario = (i: Inscricao) => new Date(`${i.dia_prova}T${i.hora_prova?.slice(0, 5)}:00-03:00`);
// Ninguém faz prova depois das 20h do dia escolhido
const limiteDoDia = (i: Inscricao) => new Date(`${i.dia_prova}T20:00:00-03:00`);

// Embaralhamento com semente fixa por inscrição: a mesma ordem a cada recarregar
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

// As letras A–E são da posição na tela; o servidor traduz de volta para a letra original do banco
const montarProva = (i: Inscricao) =>
  embaralhar(questoes, `${i.numero}-${i.codigo}-ordem`).map((q) => {
    const ordem = embaralhar(q.alternativas, `${i.numero}-${q.id}`);
    return {
      questao: q,
      alternativas: ordem.map((a, idx) => ({ letra: 'ABCDE'[idx], original: a.letra, texto: a.texto })),
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

const corrigir = (i: Inscricao, respostas: Record<string, string>) => {
  let acertos = 0;
  let acertosMatematica = 0;
  for (const q of questoes) {
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

export const entregar = async (i: Inscricao, quando = new Date()) => {
  const respostas = i.respostas ?? {};
  return atualizar(i, {
    prova_entregue_em: quando.toISOString(),
    ...corrigir(i, respostas),
  });
};

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
    respostas: i.respostas ?? {},
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

// O que vai para o navegador: questões sem gabarito, letras da tela e respostas já marcadas (também nas letras da tela)
export const visaoProva = (i: Inscricao) => {
  const respostas = i.respostas ?? {};
  return montarProva(i).map(({ questao, alternativas }, idx) => {
    const marcada = alternativas.find((a) => a.original === respostas[questao.id]);
    return {
      numero: idx + 1,
      id: questao.id,
      area: questao.area === 'matematica' ? 'Matemática' : 'Linguagens e Códigos',
      textoBase: questao.textoBase ?? null,
      enunciado: questao.enunciado,
      imagem: questao.imagem ?? null,
      alternativas: alternativas.map(({ letra, texto }) => ({ letra, texto })),
      resposta: marcada?.letra ?? null,
    };
  });
};

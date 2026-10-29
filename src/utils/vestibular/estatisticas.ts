import 'server-only';

import { Inscricao } from './inscricoes';

// Aba "Resumo" do painel: só contagens, sem dado pessoal. Cada grupo junta as inscrições do mesmo dia (horário de
// Brasília), forma de ingresso e oferta; o painel soma os grupos para os cartões, gráficos e filtros.

export type GrupoInscricoes = {
  dia: string;
  forma: string;
  curso: string;
  modalidade: string;
  unidade: string;
  total: number;
};

export type Estatisticas = {
  hoje: string;
  // Primeiro dia do gráfico por dia: abertura das inscrições ou a primeira inscrição, o que vier antes
  inicio: string;
  grupos: GrupoInscricoes[];
};

// Abertura das inscrições (14/10/2026)
const abertura = '2026-10-14';

// AAAA-MM-DD no horário de Brasília
const diaBrasilia = (data: Date) => data.toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' });

export const estatisticas = (inscricoes: Inscricao[]): Estatisticas => {
  const grupos = new Map<string, GrupoInscricoes>();
  for (const i of inscricoes) {
    const grupo = {
      dia: diaBrasilia(new Date(i.criado_em)),
      forma: i.forma,
      curso: i.curso,
      modalidade: i.modalidade,
      unidade: i.unidade,
    };
    const chave = Object.values(grupo).join('|');
    const atual = grupos.get(chave);
    if (atual) {
      atual.total++;
    } else {
      grupos.set(chave, { ...grupo, total: 1 });
    }
  }
  const lista = [...grupos.values()];
  const primeiro = lista.reduce((min, g) => (g.dia < min ? g.dia : min), abertura);
  return { hoje: diaBrasilia(new Date()), inicio: primeiro, grupos: lista };
};

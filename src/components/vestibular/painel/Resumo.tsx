'use client';

import { formas } from '@/data/vestibular';
import type { EChartsCoreOption } from 'echarts/core';
import { useEffect, useMemo, useState } from 'react';
import Grafico from './Grafico';

// Aba "Resumo" do painel: inscrições por curso, forma de ingresso e dia. Só recebe contagens agrupadas (ver
// utils/vestibular/estatisticas.ts); os filtros de unidade e modalidade somam os grupos aqui mesmo.

export type DadosResumo = {
  hoje: string;
  inicio: string;
  grupos: { dia: string; forma: string; curso: string; modalidade: string; unidade: string; total: number }[];
};

type Grupo = DadosResumo['grupos'][number];

// Combinações de modalidade e unidade das ofertas, cada uma com a sua cor (fixa, não muda com o filtro)
const combinacoes = [
  { modalidade: 'Presencial', unidade: 'Limoeiro do Norte', rotulo: 'Presencial · Limoeiro', cor: '#2a78d6' },
  { modalidade: 'EAD', unidade: 'Limoeiro do Norte', rotulo: 'EAD · Limoeiro', cor: '#eb6834' },
  { modalidade: 'Semipresencial', unidade: 'Limoeiro do Norte', rotulo: 'Semipresencial · Limoeiro', cor: '#1baf7a' },
  { modalidade: 'EAD', unidade: 'Fortaleza (Tauape)', rotulo: 'EAD · Fortaleza', cor: '#eda100' },
  { modalidade: 'Semipresencial', unidade: 'Fortaleza (Tauape)', rotulo: 'Semipresencial · Fortaleza', cor: '#e87ba4' },
];
const unidades = ['Limoeiro do Norte', 'Fortaleza (Tauape)'];
const modalidades = ['Presencial', 'EAD', 'Semipresencial'];

const soma = (grupos: Grupo[]) => grupos.reduce((t, g) => t + g.total, 0);
const somarDias = (dia: string, dias: number) => {
  const d = new Date(`${dia}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + dias);
  return d.toISOString().slice(0, 10);
};
const diaMes = (dia: string) => dia.slice(5).split('-').reverse().join('/');
const numero = (n: number) => n.toLocaleString('pt-BR');

// ---------- Gráficos (Apache ECharts, cores da identidade do site) ----------
const azul = '#0d5fd1';
const marinho = '#062e72';
const tinta = '#1f2937';
const tintaFraca = '#6b7280';
const linhaGrade = '#eceef3';
const fonte = "Montserrat, 'Inter Tight', sans-serif";

const diaPorExtenso = (dia: string) =>
  new Date(`${dia}T12:00:00Z`).toLocaleDateString('pt-BR', {
    timeZone: 'UTC',
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
const inscricoes = (n: number) => `${numero(n)} inscriç${n === 1 ? 'ão' : 'ões'}`;

const dica = {
  backgroundColor: '#fff',
  borderColor: linhaGrade,
  textStyle: { color: tinta, fontFamily: fonte, fontSize: 13 },
  extraCssText: 'border-radius:12px;box-shadow:0 4px 16px rgba(6,46,114,.12);',
};
const sombra = { type: 'shadow', shadowStyle: { color: 'rgba(13,95,209,.06)' } };

// Barras por dia com todos os dias numerados; hoje em azul-marinho; número em cima das barras com inscrição
const opcaoPorDia = (dias: { dia: string; total: number }[], hoje: string, estreito: boolean): EChartsCoreOption => {
  // No celular só o número do dia (o mês aparece quando ele muda: 1/11)
  const rotulos = dias.map((d, n) =>
    !estreito || (n > 0 && d.dia.slice(5, 7) !== dias[n - 1].dia.slice(5, 7))
      ? diaMes(d.dia)
      : String(Number(d.dia.slice(8))),
  );
  // Inclinados quando não cabem lado a lado
  const inclinar = estreito ? (dias.length > 16 ? 90 : 0) : dias.length > 24 ? 45 : 0;
  return {
    textStyle: { fontFamily: fonte },
    animationDuration: 400,
    grid: { left: 4, right: 8, top: 28, bottom: 4, outerBoundsMode: 'same', outerBoundsContain: 'axisLabel' },
    tooltip: {
      trigger: 'axis',
      axisPointer: sombra,
      ...dica,
      formatter: (itens: { dataIndex: number }[]) => {
        const d = dias[itens[0].dataIndex];
        return `<div style="font-size:12px;color:${tintaFraca}">${diaPorExtenso(d.dia)}${d.dia === hoje ? ' (hoje)' : ''}</div><b style="font-size:15px">${inscricoes(d.total)}</b>`;
      },
    },
    xAxis: {
      type: 'category',
      data: rotulos,
      axisTick: { show: false },
      axisLine: { lineStyle: { color: '#d5d9e2' } },
      axisLabel: {
        interval: 0,
        rotate: inclinar,
        color: tintaFraca,
        fontSize: estreito ? 10 : 11,
        formatter: (valor: string, n: number) => (dias[n]?.dia === hoje ? `{hoje|${valor}}` : valor),
        rich: { hoje: { color: marinho, fontWeight: 'bold', fontSize: estreito ? 10 : 11 } },
      },
    },
    yAxis: {
      type: 'value',
      minInterval: 1,
      splitNumber: 4,
      axisLabel: { color: tintaFraca, fontSize: 11 },
      splitLine: { lineStyle: { color: linhaGrade, type: 'dashed' } },
    },
    series: [
      {
        type: 'bar',
        barMaxWidth: 36,
        data: dias.map((d) => ({
          value: d.total,
          itemStyle: { color: d.dia === hoje ? marinho : azul, borderRadius: [4, 4, 0, 0] },
        })),
        label: {
          show: true,
          position: 'top',
          color: tinta,
          fontWeight: 'bold',
          fontSize: estreito ? 10 : 12,
          formatter: ({ value }: { value: number }) => (value ? numero(value) : ''),
        },
        emphasis: { itemStyle: { opacity: 0.85 } },
      },
    ],
  };
};

type CursoResumo = { curso: string; total: number; partes: { rotulo: string; total: number }[] };

// Barras horizontais por curso (maior em cima), empilhadas por modalidade e unidade, com o total no fim da linha
const opcaoPorCurso = (cursos: CursoResumo[], visiveis: typeof combinacoes, estreito: boolean): EChartsCoreOption => {
  const valor = (c: CursoResumo, rotulo: string) => c.partes.find((p) => p.rotulo === rotulo)?.total ?? 0;
  const comDados = visiveis.filter((v) => cursos.some((c) => valor(c, v.rotulo)));
  return {
    textStyle: { fontFamily: fonte },
    animationDuration: 400,
    legend: {
      top: 0,
      left: 0,
      icon: 'roundRect',
      itemWidth: 12,
      itemHeight: 12,
      itemGap: 14,
      textStyle: { color: tinta, fontSize: 12 },
      data: comDados.map((c) => c.rotulo),
    },
    grid: {
      left: 4,
      right: 8,
      top: estreito && comDados.length > 2 ? 64 : 40,
      bottom: 4,
      outerBoundsMode: 'same',
      outerBoundsContain: 'axisLabel',
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: sombra,
      ...dica,
      formatter: (itens: { dataIndex: number }[]) => {
        const c = cursos[itens[0].dataIndex];
        const linhas = c.partes
          .map((p) => {
            const cor = combinacoes.find((x) => x.rotulo === p.rotulo)?.cor;
            return `<div style="display:flex;gap:12px;justify-content:space-between"><span><span style="display:inline-block;width:10px;height:10px;border-radius:2px;background:${cor};margin-right:6px"></span>${p.rotulo}</span><b>${numero(p.total)}</b></div>`;
          })
          .join('');
        return `<div style="font-weight:bold;margin-bottom:4px">${c.curso} · ${inscricoes(c.total)}</div>${linhas}`;
      },
    },
    xAxis: {
      type: 'value',
      minInterval: 1,
      splitNumber: 4,
      axisLabel: { color: tintaFraca, fontSize: 11 },
      splitLine: { lineStyle: { color: linhaGrade, type: 'dashed' } },
    },
    yAxis: [
      {
        type: 'category',
        inverse: true,
        data: cursos.map((c) => c.curso),
        axisTick: { show: false },
        axisLine: { show: false },
        axisLabel: {
          color: tinta,
          fontSize: estreito ? 11.5 : 13,
          fontWeight: 600,
          width: estreito ? 132 : 190,
          overflow: 'truncate',
        },
      },
      // Total do curso à direita (mesmas categorias, só o rótulo)
      {
        type: 'category',
        inverse: true,
        position: 'right',
        data: cursos.map((c) => numero(c.total)),
        axisTick: { show: false },
        axisLine: { show: false },
        axisLabel: { color: tinta, fontSize: 13, fontWeight: 'bold' },
      },
    ],
    series: comDados.map((v) => ({
      name: v.rotulo,
      type: 'bar',
      stack: 'curso',
      barMaxWidth: 18,
      itemStyle: { color: v.cor, borderColor: '#fff', borderWidth: 1 },
      emphasis: { focus: 'series' },
      data: cursos.map((c) => {
        // Cantos arredondados só na ponta da barra (última parte com valor)
        const ponta = [...comDados].reverse().find((x) => valor(c, x.rotulo))?.rotulo;
        return {
          value: valor(c, v.rotulo) || null,
          itemStyle: ponta === v.rotulo ? { borderRadius: [0, 4, 4, 0] } : undefined,
        };
      }),
    })),
  };
};

const Cartao = ({ titulo, valor, detalhe }: { titulo: string; valor: number; detalhe?: string }) => (
  <div className="rounded-2xl bg-white p-4">
    <p className="text-secondary/60 text-[13px]">{titulo}</p>
    <p className="font-chamada text-vest-navy text-[34px] leading-none">{numero(valor)}</p>
    {detalhe && <p className="text-secondary/70 mt-1.5 text-[12px]">{detalhe}</p>}
  </div>
);

const Bloco = ({ titulo, children }: { titulo: string; children: React.ReactNode }) => (
  <section className="space-y-4 rounded-[24px] bg-white p-4 md:p-6">
    <h2 className="text-vest-navy text-[18px] font-bold">{titulo}</h2>
    {children}
  </section>
);

// Barra horizontal simples: rótulo e número em cima, barra embaixo (cabe no celular sem cortar o nome)
const Barra = ({ rotulo, total, maximo }: { rotulo: string; total: number; maximo: number }) => (
  <li className="space-y-1" title={`${rotulo}: ${numero(total)}`}>
    <div className="flex justify-between gap-3 text-[14px]">
      <span>{rotulo}</span>
      <span className="font-bold tabular-nums">{numero(total)}</span>
    </div>
    <div className="bg-background-3 h-3 rounded-full">
      <div
        className="bg-vest-blue h-full rounded-full"
        style={{ width: `${maximo ? (total / maximo) * 100 : 0}%`, minWidth: total ? 4 : 0 }}
      />
    </div>
  </li>
);

// Soma os grupos que passam no filtro: por curso (com a quebra por modalidade e unidade) e por dia
const agregar = (dados: DadosResumo, unidade: string, modalidade: string) => {
  const grupos = dados.grupos.filter(
    (g) => (!unidade || g.unidade === unidade) && (!modalidade || g.modalidade === modalidade),
  );
  const cursos = [...new Set(grupos.map((g) => g.curso))]
    .map((curso) => {
      const doCurso = grupos.filter((g) => g.curso === curso);
      return {
        curso,
        total: soma(doCurso),
        partes: combinacoes
          .map((c) => ({
            ...c,
            total: soma(doCurso.filter((g) => g.modalidade === c.modalidade && g.unidade === c.unidade)),
          }))
          .filter((p) => p.total),
      };
    })
    .sort((a, b) => b.total - a.total || a.curso.localeCompare(b.curso));
  const combinacoesVisiveis = combinacoes.filter(
    (c) => (!unidade || c.unidade === unidade) && (!modalidade || c.modalidade === modalidade),
  );

  const dias: { dia: string; total: number }[] = [];
  for (let d = dados.inicio; d <= dados.hoje; d = somarDias(d, 1)) {
    dias.push({ dia: d, total: soma(grupos.filter((g) => g.dia === d)) });
  }
  return { grupos, cursos, dias, combinacoesVisiveis };
};

const Resumo = ({ dados }: { dados: DadosResumo }) => {
  const [unidade, setUnidade] = useState('');
  const [modalidade, setModalidade] = useState('');
  // Celular: rótulos mais curtos nos gráficos
  const [estreito, setEstreito] = useState(false);
  useEffect(() => {
    const consulta = window.matchMedia('(max-width: 640px)');
    const atualizar = () => setEstreito(consulta.matches);
    atualizar();
    consulta.addEventListener('change', atualizar);
    return () => consulta.removeEventListener('change', atualizar);
  }, []);

  const { grupos, cursos, dias, combinacoesVisiveis } = useMemo(
    () => agregar(dados, unidade, modalidade),
    [dados, unidade, modalidade],
  );
  const opcaoDias = useMemo(() => opcaoPorDia(dias, dados.hoje, estreito), [dias, dados.hoje, estreito]);
  const opcaoCursos = useMemo(
    () => opcaoPorCurso(cursos, combinacoesVisiveis, estreito),
    [cursos, combinacoesVisiveis, estreito],
  );
  const total = soma(grupos);
  const semana = somarDias(dados.hoje, -6);
  const porForma = formas.map((f) => ({ ...f, total: soma(grupos.filter((g) => g.forma === f.id)) }));
  const daForma = (id: string) => porForma.find((f) => f.id === id)?.total ?? 0;

  const campo = 'border-stroke-3 h-10 rounded-full border bg-white px-4 text-[14px]';

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <select value={unidade} onChange={(e) => setUnidade(e.target.value)} aria-label="Unidade" className={campo}>
          <option value="">Todas as unidades</option>
          {unidades.map((u) => (
            <option key={u}>{u}</option>
          ))}
        </select>
        <select
          value={modalidade}
          onChange={(e) => setModalidade(e.target.value)}
          aria-label="Modalidade"
          className={campo}>
          <option value="">Todas as modalidades</option>
          {modalidades.map((m) => (
            <option key={m}>{m}</option>
          ))}
        </select>
        {(unidade || modalidade) && (
          <button
            type="button"
            onClick={() => {
              setUnidade('');
              setModalidade('');
            }}
            className="text-vest-blue cursor-pointer text-[14px] font-semibold hover:underline">
            Limpar filtros
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Cartao titulo="Total de inscrições" valor={total} />
        <Cartao titulo={`Hoje (${diaMes(dados.hoje)})`} valor={soma(grupos.filter((g) => g.dia === dados.hoje))} />
        <Cartao titulo="Últimos 7 dias" valor={soma(grupos.filter((g) => g.dia >= semana))} />
        <Cartao
          titulo="Pelo vestibular (prova)"
          valor={daForma('vestibular')}
          detalhe={`Enem ${numero(daForma('enem'))} · Transferência ${numero(daForma('transferencia'))} · 2ª graduação ${numero(daForma('segunda-graduacao'))}`}
        />
      </div>

      <Bloco titulo="Inscrições por curso">
        {cursos.length ? (
          <Grafico
            opcao={opcaoCursos}
            altura={cursos.length * 38 + 90}
            rotulo={`Inscrições por curso: ${cursos.map((c) => `${c.curso} ${c.total}`).join(', ')}`}
          />
        ) : (
          <p className="text-secondary/60 py-4 text-center">Nenhuma inscrição com esses filtros.</p>
        )}
      </Bloco>

      <div className="grid gap-4 md:grid-cols-2">
        <Bloco titulo="Por forma de ingresso">
          <ul className="space-y-3">
            {[...porForma]
              .sort((a, b) => b.total - a.total)
              .map((f) => (
                <Barra
                  key={f.id}
                  rotulo={f.rotulo}
                  total={f.total}
                  maximo={Math.max(...porForma.map((x) => x.total))}
                />
              ))}
          </ul>
        </Bloco>

        <Bloco titulo="Por unidade e modalidade">
          <ul className="space-y-3">
            {combinacoesVisiveis
              .map((c) => ({
                ...c,
                total: soma(grupos.filter((g) => g.modalidade === c.modalidade && g.unidade === c.unidade)),
              }))
              .sort((a, b) => b.total - a.total)
              .map((c, _, lista) => (
                <Barra key={c.rotulo} rotulo={c.rotulo} total={c.total} maximo={lista[0].total} />
              ))}
          </ul>
        </Bloco>
      </div>

      <Bloco titulo={`Inscrições por dia desde ${diaMes(dados.inicio)}`}>
        <Grafico
          opcao={opcaoDias}
          altura={estreito ? 260 : 300}
          rotulo={`Inscrições por dia: ${dias.map((d) => `${diaMes(d.dia)} ${d.total}`).join(', ')}`}
        />
      </Bloco>
    </div>
  );
};

export default Resumo;

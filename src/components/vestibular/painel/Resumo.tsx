'use client';

import { formas } from '@/data/vestibular';
import { cn } from '@/utils/cn';
import { useState } from 'react';

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

const Resumo = ({ dados }: { dados: DadosResumo }) => {
  const [unidade, setUnidade] = useState('');
  const [modalidade, setModalidade] = useState('');

  const grupos = dados.grupos.filter(
    (g) => (!unidade || g.unidade === unidade) && (!modalidade || g.modalidade === modalidade),
  );
  const total = soma(grupos);
  const semana = somarDias(dados.hoje, -6);
  const porForma = formas.map((f) => ({ ...f, total: soma(grupos.filter((g) => g.forma === f.id)) }));
  const daForma = (id: string) => porForma.find((f) => f.id === id)?.total ?? 0;

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
  const maiorCurso = cursos[0]?.total ?? 0;
  const combinacoesVisiveis = combinacoes.filter(
    (c) => (!unidade || c.unidade === unidade) && (!modalidade || c.modalidade === modalidade),
  );

  const dias: { dia: string; total: number }[] = [];
  for (let d = dados.inicio; d <= dados.hoje; d = somarDias(d, 1)) {
    dias.push({ dia: d, total: soma(grupos.filter((g) => g.dia === d)) });
  }
  const maiorDia = Math.max(1, ...dias.map((d) => d.total));
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
        <ul className="flex flex-wrap gap-x-4 gap-y-1.5 text-[13px]" aria-label="Legenda">
          {combinacoesVisiveis.map((c) => (
            <li key={c.rotulo} className="flex items-center gap-1.5">
              <span className="size-3 rounded-sm" style={{ background: c.cor }} />
              {c.rotulo}
            </li>
          ))}
        </ul>
        {cursos.length ? (
          <ul className="space-y-3">
            {cursos.map((c) => (
              <li key={c.curso} className="space-y-1">
                <div className="flex justify-between gap-3 text-[14px]">
                  <span className="font-semibold">{c.curso}</span>
                  <span className="font-bold tabular-nums">{numero(c.total)}</span>
                </div>
                <div
                  className="flex h-3.5 gap-[2px]"
                  style={{ width: `${(c.total / maiorCurso) * 100}%`, minWidth: 4 }}>
                  {c.partes.map((p, n) => (
                    <div
                      key={p.rotulo}
                      title={`${c.curso} · ${p.rotulo}: ${numero(p.total)}`}
                      className={cn(
                        'h-full',
                        n === 0 && 'rounded-l-[4px]',
                        n === c.partes.length - 1 && 'rounded-r-[4px]',
                      )}
                      style={{ flexGrow: p.total, flexBasis: 0, minWidth: 3, background: p.cor }}
                    />
                  ))}
                </div>
                {/* Números de cada combinação por escrito: a cor nunca é a única pista */}
                {c.partes.length > 1 && (
                  <p className="text-secondary/70 text-[12px]">
                    {c.partes.map((p) => `${p.rotulo} ${numero(p.total)}`).join(' · ')}
                  </p>
                )}
                {c.partes.length === 1 && combinacoesVisiveis.length > 1 && (
                  <p className="text-secondary/70 text-[12px]">{c.partes[0].rotulo}</p>
                )}
              </li>
            ))}
          </ul>
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
        <div className="flex gap-2">
          {/* Escala: maior dia em cima, zero embaixo */}
          <div className="text-secondary/60 flex h-40 flex-col justify-between text-right text-[11px] tabular-nums">
            <span>{numero(maiorDia)}</span>
            <span>0</span>
          </div>
          <div className="min-w-0 flex-1">
            <div className="border-stroke-3 flex h-40 items-end gap-[2px] border-b">
              {dias.map((d) => (
                <div
                  key={d.dia}
                  title={`${diaMes(d.dia)}: ${numero(d.total)} inscriç${d.total === 1 ? 'ão' : 'ões'}`}
                  className="group flex h-full min-w-0 flex-1 items-end">
                  <div
                    className={cn(
                      'w-full rounded-t-[4px] group-hover:opacity-80',
                      d.dia === dados.hoje ? 'bg-vest-navy' : 'bg-vest-blue',
                    )}
                    style={{ height: `${(d.total / maiorDia) * 100}%`, minHeight: d.total ? 2 : 0 }}
                  />
                </div>
              ))}
            </div>
            <div className="text-secondary/60 mt-1 flex justify-between text-[11px]">
              <span>{diaMes(dados.inicio)}</span>
              <span>hoje, {diaMes(dados.hoje)}</span>
            </div>
          </div>
        </div>
        {/* Os dias com inscrição por escrito (toque no celular não mostra o título da barra) */}
        <details className="text-[13px]">
          <summary className="text-vest-blue cursor-pointer font-semibold">Ver os números por dia</summary>
          <ul className="mt-2 grid grid-cols-3 gap-x-4 gap-y-0.5 sm:grid-cols-5">
            {dias
              .filter((d) => d.total)
              .reverse()
              .map((d) => (
                <li key={d.dia} className="flex justify-between gap-2 tabular-nums">
                  <span className="text-secondary/70">{diaMes(d.dia)}</span>
                  <span className="font-bold">{numero(d.total)}</span>
                </li>
              ))}
          </ul>
        </details>
      </Bloco>
    </div>
  );
};

export default Resumo;

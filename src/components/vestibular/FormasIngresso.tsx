'use client';

import { FormaId, formas } from '@/data/vestibular';
import { cn } from '@/utils/cn';
import { useEffect, useState } from 'react';
import IconeForma from './Icones';
import { useIngresso } from './IngressoContext';
import { BotaoInscricao, Rotulo } from './ui';

// Acordeon com o passo a passo de cada forma de ingresso. O conteúdo de todas sai do servidor
// (os itens fechados ficam só ocultos), então o texto todo é indexável.
const FormasIngresso = () => {
  const { escolher } = useIngresso();
  // Começa tudo fechado para a seção ficar curta no celular; um link com #enem, #transferencia etc. abre o item certo
  const [aberta, setAberta] = useState<FormaId | null>(null);

  useEffect(() => {
    const abrirDoHash = () => {
      const hash = window.location.hash.slice(1);
      if (formas.some((f) => f.id === hash)) setAberta(hash as FormaId);
    };
    abrirDoHash();
    window.addEventListener('hashchange', abrirDoHash);
    return () => window.removeEventListener('hashchange', abrirDoHash);
  }, []);

  const alternar = (id: FormaId) => {
    if (aberta === id) return setAberta(null);
    setAberta(id);
    escolher(id);
  };

  return (
    <section id="ingresso" className="scroll-mt-20 py-16 md:py-20 lg:py-24" aria-labelledby="ingresso-titulo">
      <div className="main-container space-y-8 md:space-y-10">
        <div className="mx-auto max-w-[720px] space-y-4 text-center">
          <Rotulo>Formas de ingresso</Rotulo>
          <h2 id="ingresso-titulo" className="font-chamada text-vest-navy">
            Escolha como você quer entrar e veja o passo a passo
          </h2>
        </div>

        <ul className="mx-auto max-w-[960px] space-y-3">
          {formas.map((f) => {
            const ativa = aberta === f.id;
            return (
              <li
                key={f.id}
                className={cn(
                  'overflow-hidden rounded-[24px] border bg-white transition-colors',
                  ativa ? 'border-vest-blue' : 'border-stroke-2',
                )}>
                <h3>
                  <button
                    type="button"
                    id={`aba-${f.id}`}
                    aria-expanded={ativa}
                    aria-controls={`painel-${f.id}`}
                    onClick={() => alternar(f.id)}
                    className="flex w-full cursor-pointer items-center gap-3 p-4 text-left md:gap-4 md:p-6">
                    <span
                      className={cn(
                        'flex size-11 shrink-0 items-center justify-center rounded-xl transition-colors md:size-12',
                        ativa ? 'bg-vest-blue text-white' : 'bg-primary-50 text-vest-blue',
                      )}>
                      <IconeForma id={f.id} className="size-6" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="font-chamada text-vest-navy block text-[24px] leading-tight md:text-[30px]">
                        {f.titulo}
                      </span>
                      <span className="text-vest-blue mt-0.5 block text-[13px] font-bold md:hidden">{f.destaque}</span>
                    </span>
                    <span className="bg-vest-yellow text-vest-navy hidden shrink-0 rounded-full px-4 py-1.5 text-[14px] font-bold md:block">
                      {f.destaque}
                    </span>
                    <span
                      aria-hidden
                      className={cn(
                        'text-vest-navy flex size-9 shrink-0 items-center justify-center rounded-full border text-[22px] leading-none transition-transform',
                        ativa ? 'border-vest-blue rotate-45' : 'border-stroke-3',
                      )}>
                      +
                    </span>
                  </button>
                </h3>

                <div
                  id={`painel-${f.id}`}
                  role="region"
                  aria-labelledby={`aba-${f.id}`}
                  hidden={!ativa}
                  className="px-4 pb-6 md:px-6 md:pb-8">
                  <div className="border-stroke-2 space-y-2 border-t pt-5 md:pl-16">
                    <p className="md:text-lg">{f.paraQuem}</p>
                    <p className="text-vest-navy text-[14px] font-semibold">
                      {f.destaque}: <span className="font-normal">{f.destaqueDetalhe}</span>
                    </p>
                  </div>

                  <ol className="mt-6 space-y-0 md:pl-16">
                    {f.passos.map((p, i) => (
                      <li key={p.titulo} className="relative flex gap-4 pb-6 last:pb-0">
                        {i < f.passos.length - 1 && (
                          <span aria-hidden className="bg-primary-100 absolute top-10 bottom-1 left-[19px] w-0.5" />
                        )}
                        <span className="font-chamada bg-vest-blue relative flex size-10 shrink-0 items-center justify-center rounded-xl text-[20px] text-white">
                          {i + 1}
                        </span>
                        <div className="pt-1">
                          <p className="text-vest-navy text-[16px] font-bold md:text-[17px]">{p.titulo}</p>
                          <p className="mt-1 text-[15px] md:text-base">{p.texto}</p>
                        </div>
                      </li>
                    ))}
                  </ol>

                  <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-between md:pl-16">
                    <BotaoInscricao>{f.cta}</BotaoInscricao>
                    {f.id === 'vestibular' && (
                      <a href="#bolsas" className="text-vest-blue text-[15px] font-semibold underline-offset-4 hover:underline">
                        Ver as bolsas
                      </a>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
};

export default FormasIngresso;

'use client';

import { evento } from '@/data/empreend';
import { useEffect, useState } from 'react';

const inicio = new Date(evento.inicio).getTime();

const restante = () => {
  const ms = Math.max(inicio - Date.now(), 0);
  return {
    dias: Math.floor(ms / 86_400_000),
    horas: Math.floor(ms / 3_600_000) % 24,
    min: Math.floor(ms / 60_000) % 60,
    seg: Math.floor(ms / 1000) % 60,
  };
};

// Contagem regressiva até a abertura da feira (renderiza só no navegador, para não divergir do servidor)
const Contagem = () => {
  const [tempo, setTempo] = useState<ReturnType<typeof restante> | null>(null);

  useEffect(() => {
    setTempo(restante());
    const id = window.setInterval(() => setTempo(restante()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const blocos = [
    { valor: tempo?.dias, rotulo: 'dias' },
    { valor: tempo?.horas, rotulo: 'horas' },
    { valor: tempo?.min, rotulo: 'min' },
    { valor: tempo?.seg, rotulo: 'seg' },
  ];

  return (
    <div className="flex gap-2 md:gap-3" aria-label="Contagem regressiva para o Empreend 2026">
      {blocos.map((b) => (
        <div
          key={b.rotulo}
          className="flex w-[68px] flex-col items-center rounded-2xl border border-white/15 bg-white/5 py-2.5 backdrop-blur-sm md:w-[78px]">
          <span className="font-letreiro text-[26px] text-white tabular-nums md:text-[30px]">
            {b.valor === undefined ? '--' : String(b.valor).padStart(2, '0')}
          </span>
          <span className="text-emp-cyan text-[11px] font-semibold tracking-[0.18em] uppercase">{b.rotulo}</span>
        </div>
      ))}
    </div>
  );
};

export default Contagem;

'use client';

import { vestibular } from '@/data/vestibular';
import { useEffect, useState } from 'react';

const fim = new Date(vestibular.fimInscricoes).getTime();

const restante = () => {
  const ms = Math.max(fim - Date.now(), 0);
  return {
    dias: Math.floor(ms / 86_400_000),
    horas: Math.floor(ms / 3_600_000) % 24,
    min: Math.floor(ms / 60_000) % 60,
    seg: Math.floor(ms / 1000) % 60,
  };
};

// Contagem até o fim das inscrições (20/11, 18h). Renderiza só no navegador, para não divergir do servidor.
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
    <div className="flex gap-2" aria-label="Tempo restante para o fim das inscrições">
      {blocos.map((b) => (
        <div
          key={b.rotulo}
          className="flex w-[62px] flex-col items-center rounded-xl border border-white/20 bg-white/10 py-2 backdrop-blur-sm md:w-[70px]">
          <span className="font-chamada text-[28px] text-white tabular-nums md:text-[32px]">
            {b.valor === undefined ? '--' : String(b.valor).padStart(2, '0')}
          </span>
          <span className="text-vest-cyan text-[10px] font-bold tracking-[0.18em] uppercase">{b.rotulo}</span>
        </div>
      ))}
    </div>
  );
};

export default Contagem;

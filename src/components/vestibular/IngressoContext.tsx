'use client';

import { FormaId, formas } from '@/data/vestibular';
import { createContext, ReactNode, useCallback, useContext, useEffect, useState } from 'react';

// Forma de ingresso escolhida pelo visitante, compartilhada entre os cards do topo e as abas do passo a passo.
// O endereço com #enem, #segunda-graduacao, #transferencia ou #vestibular já abre na entrada certa:
// dá para apontar cada anúncio para o seu público.
type Ctx = { forma: FormaId; escolher: (id: FormaId, rolarAteAbas?: boolean) => void };

const IngressoContext = createContext<Ctx | null>(null);

const ids = formas.map((f) => f.id) as string[];

const rolar = () => document.getElementById('ingresso')?.scrollIntoView({ behavior: 'smooth', block: 'start' });

export const IngressoProvider = ({ children }: { children: ReactNode }) => {
  const [forma, setForma] = useState<FormaId>('vestibular');

  const escolher = useCallback<Ctx['escolher']>((id, rolarAteAbas) => {
    setForma(id);
    history.replaceState(null, '', `#${id}`);
    if (rolarAteAbas) rolar();
  }, []);

  useEffect(() => {
    const doHash = () => {
      const hash = window.location.hash.slice(1);
      if (ids.includes(hash)) {
        setForma(hash as FormaId);
        rolar();
      }
    };
    doHash();
    window.addEventListener('hashchange', doHash);
    return () => window.removeEventListener('hashchange', doHash);
  }, []);

  return <IngressoContext.Provider value={{ forma, escolher }}>{children}</IngressoContext.Provider>;
};

export const useIngresso = () => {
  const ctx = useContext(IngressoContext);
  if (!ctx) throw new Error('useIngresso precisa do IngressoProvider');
  return ctx;
};

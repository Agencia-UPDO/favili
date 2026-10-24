'use client';

import SmoothScrollProvider from '@/components/shared/SmoothScroll';
import { ThemeProvider } from '@/components/shared/ThemeProvider';
import { AppContextProvider } from '@/context/AppContext';
import { ReactNode } from 'react';

// Provedores das páginas do template (contexto, tema e rolagem amaciada). As páginas de campanha não usam nada
// disso: o Provedores só carrega este arquivo fora delas.
const ProvedoresDoTemplate = ({ children }: { children: ReactNode }) => (
  <AppContextProvider>
    <ThemeProvider attribute="class" defaultTheme="light" forcedTheme="light" disableTransitionOnChange>
      <SmoothScrollProvider>{children}</SmoothScrollProvider>
    </ThemeProvider>
  </AppContextProvider>
);

export default ProvedoresDoTemplate;

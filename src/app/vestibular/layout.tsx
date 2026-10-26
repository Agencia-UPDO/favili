import { Barlow_Condensed, Cinzel } from 'next/font/google';
import { Metadata } from 'next';
import { ReactNode } from 'react';

// Fontes das artes do Vestibular Vidal: condensada pesada nas chamadas e serifada no "VIDAL"
const barlowCondensed = Barlow_Condensed({
  subsets: ['latin'],
  variable: '--font-barlow-condensed',
  display: 'swap',
  weight: ['600', '700', '800'],
});

const cinzel = Cinzel({
  subsets: ['latin'],
  variable: '--font-cinzel',
  display: 'swap',
  weight: ['700'],
});

// O iPhone transformava o nº de inscrição (10 dígitos) em link de telefone: telefones da página são links explícitos
export const metadata: Metadata = {
  formatDetection: { telephone: false, date: false, address: false, email: false },
};

const VestibularLayout = ({ children }: { children: ReactNode }) => (
  <div className={`${barlowCondensed.variable} ${cinzel.variable}`}>{children}</div>
);

export default VestibularLayout;

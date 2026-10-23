import { Barlow_Condensed, Cinzel } from 'next/font/google';
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

const VestibularLayout = ({ children }: { children: ReactNode }) => (
  <div className={`${barlowCondensed.variable} ${cinzel.variable}`}>{children}</div>
);

export default VestibularLayout;

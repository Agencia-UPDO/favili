import { Inter_Tight, Montserrat } from 'next/font/google';

const interTight = Inter_Tight({
  subsets: ['latin'],
  variable: '--font-interTight',
  display: 'swap',
  weight: ['300', '400', '500', '600', '700', '800'],
});

// Títulos largos e pesados, na linha do letreiro EMPREEND/ do logo
const montserrat = Montserrat({
  subsets: ['latin'],
  variable: '--font-montserrat',
  display: 'swap',
  weight: ['500', '600', '700', '800', '900'],
  style: ['normal', 'italic'],
});

export { interTight, montserrat };

import { totalBolsas } from '@/data/bolsas';
import Bolsas from '@/components/vestibular/Bolsas';
import ChamadaFinal from '@/components/vestibular/ChamadaFinal';
import ComoFunciona from '@/components/vestibular/ComoFunciona';
import Cursos from '@/components/vestibular/Cursos';
import Duvidas from '@/components/vestibular/Duvidas';
import Footer from '@/components/vestibular/Footer';
import FormasIngresso from '@/components/vestibular/FormasIngresso';
import Header from '@/components/vestibular/Header';
import Hero from '@/components/vestibular/Hero';
import { IngressoProvider } from '@/components/vestibular/IngressoContext';
import { Metadata } from 'next';

const titulo = 'Vestibular Vidal 2027.1 · 40% garantido e bolsas de até 100% | Faculdade Vidal';
const descricao = `Vestibular Conquista Vidal 2027.1: prova on-line em 21 ou 22 de novembro, no dia e horário que você escolher, inscrição gratuita, 40% de desconto garantido para os aprovados e ${totalBolsas} bolsas de até 100%. Também é possível entrar com a nota do Enem, por segunda graduação ou transferência.`;

export const metadata: Metadata = {
  title: titulo,
  description: descricao,
  alternates: { canonical: '/vestibular' },
  openGraph: {
    type: 'website',
    locale: 'pt_BR',
    siteName: 'Faculdade Vidal',
    title: 'Vestibular Vidal 2027.1 · Faculdade Vidal',
    description: descricao,
    images: ['/images/vestibular/hero-aluna.jpg'],
  },
};

const page = () => (
  <IngressoProvider>
    <Header />
    <main className="overflow-x-clip bg-white">
      <Hero />
      <FormasIngresso />
      <ComoFunciona />
      <Bolsas />
      <Cursos />
      <Duvidas />
      <ChamadaFinal />
    </main>
    <Footer />
  </IngressoProvider>
);

export default page;

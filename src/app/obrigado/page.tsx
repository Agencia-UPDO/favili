import BlocoAgenda from '@/components/empreend/BlocoAgenda';
import Footer from '@/components/empreend/Footer';
import Header from '@/components/empreend/Header';
import Kicker from '@/components/empreend/Kicker';
import LinhasCrescimento from '@/components/empreend/LinhasCrescimento';
import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Presença confirmada | Empreend 2026 · Faculdade Vidal',
  robots: { index: false, follow: false },
};

const page = () => (
  <>
    <Header />
    <main className="px-3 pt-[96px] pb-20 md:px-5 lg:pt-[110px] lg:pb-28">
      <div className="bg-grafico relative overflow-hidden rounded-[28px] px-6 py-14 text-center md:rounded-[40px] md:py-20">
        <LinhasCrescimento />
        <div className="relative mx-auto max-w-[680px] space-y-6">
          <span className="bg-emp-cyan text-secondary mx-auto flex size-20 items-center justify-center rounded-full">
            <svg xmlns="http://www.w3.org/2000/svg" width={36} height={36} viewBox="0 0 24 24" fill="none">
              <path d="M20 6 9 17l-5-5" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
          <Kicker claro>Presença confirmada</Kicker>
          <h1 className="font-letreiro text-[40px] text-white md:text-[64px]">
            Te vejo no <span className="text-emp-cyan">Empreend/</span>
          </h1>
          <p className="text-accent/80 mx-auto max-w-[520px] md:text-lg">
            Recebemos sua confirmação. Agora chama mais gente: compartilhe seu convite no WhatsApp.
          </p>
          <div className="flex justify-center pt-6 pb-4">
            <BlocoAgenda />
          </div>
          <Link
            href="/"
            className="bg-emp-cyan text-secondary mt-4 inline-block rounded-full px-9 py-4 text-lg font-extrabold transition-colors duration-300 hover:bg-white">
            Voltar para a página do evento
          </Link>
        </div>
      </div>
    </main>
    <Footer />
  </>
);

export default page;

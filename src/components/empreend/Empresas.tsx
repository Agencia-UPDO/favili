import { empresas } from '@/data/empreend';
import Image from 'next/image';
import Kicker from './Kicker';

const Empresas = () => {
  return (
    <section className="overflow-hidden py-16 md:py-20 lg:py-[110px]" aria-label="Empresas confirmadas">
      <div className="space-y-10 md:space-y-14">
        <div className="main-container">
          <div className="mx-auto max-w-[680px] space-y-4 text-center">
            <Kicker>Empresas confirmadas</Kicker>
            <h2 className="font-letreiro">
              Quem vai estar <span className="text-emp-blue">na feira</span>
            </h2>
            <p className="md:text-lg">
              Conheça as {empresas.length} empresas que estarão presentes na Feira de Negócios do Empreend 2026.
            </p>
          </div>
        </div>

        {/* carrossel contínuo de logos só com CSS (sai pronto do servidor); pausa ao passar o mouse.
            A lista aparece duas vezes e a faixa anda metade, para o laço não ter emenda. */}
        <div className="relative overflow-hidden">
          <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-white to-transparent md:w-40" />
          <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-white to-transparent md:w-40" />
          <div className="flex w-max">
            <ul className="animate-esteira flex w-max py-4 hover:[animation-play-state:paused]">
              {[...empresas, ...empresas].map((e, i) => (
                <li
                  key={`${e.nome}-${i}`}
                  aria-hidden={i >= empresas.length || undefined}
                  className="border-stroke-2 hover:border-emp-blue mx-2 flex w-[180px] flex-col overflow-hidden rounded-[22px] border bg-white transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_24px_40px_-28px_rgba(2,31,92,0.6)] md:mx-3 md:w-[240px]">
                  <div className="relative aspect-[4/3] bg-white">
                    <Image
                      src={e.logo}
                      alt={`Logo ${e.nome}`}
                      fill
                      sizes="240px"
                      className="object-contain p-4 md:p-5"
                    />
                  </div>
                  <p className="text-tagline-2 text-secondary border-stroke-2 border-t px-3 py-3 text-center font-semibold">
                    {e.nome}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Empresas;

import { pilares, publico, sobre } from '@/data/empreend';
import estandes from '@public/images/empreend/fotos/estandes.jpg';
import otica from '@public/images/empreend/fotos/otica-silva.jpg';
import Image from 'next/image';
import Kicker from './Kicker';
import LinhasCrescimento from './LinhasCrescimento';

const Sobre = () => {
  return (
    <section
      className="bg-grafico-claro relative overflow-hidden py-16 md:py-20 lg:py-[110px]"
      aria-label="Sobre o evento">
      <LinhasCrescimento tom="claro" />
      <div className="main-container relative space-y-14 lg:space-y-20">
        <div className="grid grid-cols-12 items-center gap-y-10 lg:gap-x-16">
          <div className="col-span-12 space-y-5 text-center lg:col-span-6 lg:text-left">
            <Kicker>Sobre o evento</Kicker>
            <h2 className="font-letreiro">
              Uma noite de <span className="text-emp-blue">negócios</span> e conexões
            </h2>
            <p className="mx-auto max-w-[560px] md:text-lg lg:mx-0">{sobre}</p>
            <div className="space-y-3">
              <p className="text-secondary text-tagline-2 font-semibold">Para quem é</p>
              <ul className="flex flex-wrap justify-center gap-2 lg:justify-start">
                {publico.map((p) => (
                  <li
                    key={p}
                    className="text-tagline-2 text-secondary border-primary-200 rounded-full border bg-white px-4 py-2 font-medium">
                    {p}
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className="col-span-12 lg:col-span-6">
            <div className="relative mx-auto grid max-w-[560px] grid-cols-5 gap-3 md:gap-4">
              <div className="col-span-3 overflow-hidden rounded-[24px] shadow-[0_24px_50px_-28px_rgba(2,31,92,0.7)]">
                <Image
                  src={estandes}
                  alt="Público circulando entre os estandes do Empreend 2025"
                  className="h-full w-full object-cover"
                  sizes="(min-width: 1024px) 340px, 60vw"
                  placeholder="blur"
                />
              </div>
              <div className="col-span-2 mt-10 overflow-hidden rounded-[24px] shadow-[0_24px_50px_-28px_rgba(2,31,92,0.7)]">
                <Image
                  src={otica}
                  alt="Equipe da Ótica Silva no estande do Empreend 2025"
                  className="h-full w-full object-cover"
                  sizes="(min-width: 1024px) 220px, 40vw"
                  placeholder="blur"
                />
              </div>
              <span className="bg-emp-cyan text-secondary font-espacada absolute -top-4 -left-2 rounded-full px-4 py-2 text-[11px] shadow-lg md:-left-6">
                Edição 2025
              </span>
            </div>
          </div>
        </div>

        <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {pilares.map((p, i) => (
            <li
              key={p.titulo}
              className="border-stroke-2 group relative overflow-hidden rounded-[24px] border bg-white p-6 md:p-7">
              <span className="font-letreiro text-primary-100 absolute -top-2 right-4 text-[64px]">0{i + 1}</span>
              <span aria-hidden className="bg-emp-cyan block h-6 w-2 skew-x-[-20deg]" />
              <h3 className="font-letreiro text-secondary relative mt-5 text-[18px] md:text-[19px]">{p.titulo}</h3>
              <p className="text-tagline-2 relative mt-2">{p.texto}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
};

export default Sobre;

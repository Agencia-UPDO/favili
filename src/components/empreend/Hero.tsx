import { evento } from '@/data/empreend';
import portico from '@public/images/empreend/fotos/portico.jpg';
import Image from 'next/image';
import Contagem from './Contagem';
import InscricaoForm from './InscricaoForm';
import Kicker from './Kicker';
import LinhasCrescimento from './LinhasCrescimento';

const infos: { rotulo: string; valor: string; extra?: string; mapa?: boolean }[] = [
  { rotulo: 'Data', valor: `${evento.data}`, extra: evento.diaSemana },
  { rotulo: 'Horário', valor: evento.horario, extra: 'à noite' },
  { rotulo: 'Local', valor: 'Pátio da Faculdade Vidal', mapa: true },
];

const Hero = () => {
  return (
    <section id="presenca" className="scroll-mt-24 px-3 pt-[84px] md:px-5 lg:pt-[96px]">
      <div className="bg-grafico relative overflow-hidden rounded-[28px] md:rounded-[40px]">
        {/* foto do pórtico da edição 2025, bem apagada ao fundo */}
        <Image
          src={portico}
          alt=""
          fill
          priority
          // Fica a 16% de opacidade: qualidade 50 é indistinguível e o arquivo cai pela metade
          quality={50}
          sizes="100vw"
          className="object-cover opacity-[0.16] mix-blend-luminosity"
        />
        <div className="from-emp-navy-dark via-emp-navy/80 absolute inset-0 bg-gradient-to-r to-transparent" />
        <LinhasCrescimento />

        <div className="main-container relative grid grid-cols-12 gap-y-10 py-10 md:py-16 lg:gap-x-10 lg:py-20 xl:gap-x-16">
          <div className="col-span-12 space-y-7 text-center lg:col-span-6 lg:self-center lg:text-left xl:col-span-7">
            <Kicker claro>
              {evento.edicao} · {evento.curso}
            </Kicker>
            <h1 className="text-accent">
              <span className="font-espacada text-emp-cyan block text-[13px] md:text-[16px]">Feira de Negócios</span>
              <span className="font-letreiro mt-3 block text-[46px] text-white sm:text-[76px] xl:text-[104px]">
                Empreend<span className="text-emp-cyan">/</span>
              </span>
              <span className="font-letreiro text-emp-cyan block text-[40px] sm:text-[52px] xl:text-[64px]">2026</span>
            </h1>
            <p className="text-accent/80 mx-auto max-w-[540px] md:text-lg lg:mx-0">
              Empreendedores, marcas locais, networking e música ao vivo numa noite no pátio da Faculdade Vidal. Venha
              prestigiar quem faz o comércio da nossa região acontecer.
            </p>
            <ul className="mx-auto grid max-w-[560px] grid-cols-3 gap-2 text-left md:gap-3 lg:mx-0">
              {infos.map((i) => (
                <li
                  key={i.rotulo}
                  className="rounded-2xl border border-white/15 bg-white/5 p-3 backdrop-blur-sm md:p-4">
                  <span className="text-emp-cyan text-[10px] font-semibold tracking-[0.14em] uppercase md:text-[11px] md:tracking-[0.18em]">
                    {i.rotulo}
                  </span>
                  <span className="mt-1 block text-[13px] leading-tight font-bold text-white md:text-base">
                    {i.valor}
                  </span>
                  {i.extra && <span className="text-tagline-3 hidden text-white/60 sm:block">{i.extra}</span>}
                  {i.mapa && (
                    <a
                      href={evento.mapa}
                      target="_blank"
                      rel="noopener"
                      className="text-emp-cyan mt-1 inline-flex items-center gap-1 text-[12px] font-semibold underline-offset-4 hover:underline md:text-[13px]">
                      Ver no mapa
                      <svg aria-hidden width={12} height={12} viewBox="0 0 24 24" fill="none">
                        <path
                          d="M7 17 17 7M9 7h8v8"
                          stroke="currentColor"
                          strokeWidth={2.4}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </a>
                  )}
                </li>
              ))}
            </ul>
            <div className="flex flex-col items-center gap-3 lg:items-start">
              <span className="text-tagline-3 font-semibold tracking-[0.18em] text-white/60 uppercase">Faltam</span>
              <Contagem />
            </div>
          </div>
          <div className="col-span-12 lg:col-span-6 lg:self-center xl:col-span-5">
            <div>
              <InscricaoForm className="mx-auto max-w-[520px] lg:max-w-none" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;

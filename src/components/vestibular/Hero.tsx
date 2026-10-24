import { vestibular } from '@/data/vestibular';
import aluno from '@public/images/vestibular/hero-aluno-odonto.webp';
import Image from 'next/image';
import { preload } from 'react-dom';
import RevealAnimation from '../animation/Revelar';
import Contagem from './Contagem';
import { BotaoInscricao, Marca, Pilula } from './ui';

// A retícula do fundo é o maior elemento da primeira dobra: o navegador começa a baixar junto com o HTML
const Hero = () => {
  preload('/images/vestibular/reticula.webp', { as: 'image', fetchPriority: 'high' });
  return (
    <section id="topo" className="px-3 pt-[76px] md:px-5 lg:pt-[88px]">
      <div className="bg-vest relative overflow-hidden rounded-[28px] md:rounded-[40px]">
        {/* Retícula em ondas, como nas artes da campanha */}
        <div
          aria-hidden
          className="absolute inset-0 bg-[url(/images/vestibular/reticula.webp)] bg-cover bg-center opacity-[0.08]"
        />

        <div className="main-container relative grid grid-cols-12 items-center gap-y-8 pt-10 md:pt-14 lg:gap-x-8 lg:pt-16">
          <div className="col-span-12 space-y-6 text-center lg:col-span-6 lg:pb-16 lg:text-left">
            <RevealAnimation delay={0.1}>
              <p className="inline-flex flex-col items-center gap-1 lg:items-start">
                <span className="text-vest-navy rounded-md bg-white px-3 py-0.5 text-[12px] font-bold tracking-[0.55em] uppercase md:text-[14px]">
                  Vestibular on-line
                </span>
                <span className="font-serifada text-[38px] leading-none font-bold tracking-[0.08em] text-white md:text-[48px]">
                  VIDAL <span className="font-condensada text-vest-cyan tracking-normal">2027.1</span>
                </span>
              </p>
            </RevealAnimation>
            <RevealAnimation delay={0.2}>
              <h1 className="font-chamada text-[44px] text-white sm:text-[60px] xl:text-[72px]">
                Todo futuro real começa com uma oportunidade.
              </h1>
            </RevealAnimation>
            <RevealAnimation delay={0.3}>
              <p className="font-chamada text-[30px] leading-tight text-white md:text-[38px]">
                <Marca>Bolsas de até 100%</Marca> no vestibular
                <span className="mt-1 block text-[22px] text-white/90 md:text-[26px]">
                  e {vestibular.descontoGarantido} de desconto garantido para os aprovados
                </span>
              </p>
            </RevealAnimation>
            <RevealAnimation delay={0.4}>
              <div className="flex flex-wrap justify-center gap-2 lg:justify-start">
                <Pilula>{vestibular.diasCurto}</Pilula>
                <Pilula cheia>Inscrições gratuitas</Pilula>
              </div>
            </RevealAnimation>
            <RevealAnimation delay={0.5}>
              <div className="flex justify-center lg:justify-start">
                <BotaoInscricao>Quero me inscrever</BotaoInscricao>
              </div>
            </RevealAnimation>
            <RevealAnimation delay={0.6}>
              <div className="flex flex-col items-center gap-2 lg:items-start">
                <span className="text-[11px] font-bold tracking-[0.2em] text-white/70 uppercase">
                  Inscrições encerram em 20/11, às 18h
                </span>
                <Contagem />
              </div>
            </RevealAnimation>
          </div>

          <div className="col-span-12 pb-16 lg:col-span-6 lg:self-center lg:pb-24">
            <RevealAnimation delay={0.3} direction="up" offset={40}>
              <div className="relative mx-auto max-w-[420px] sm:max-w-[560px] lg:-mr-8 lg:max-w-[820px]">
                {/* Brilho atrás do aluno recortado */}
                <div
                  aria-hidden
                  className="absolute inset-x-[-15%] top-[8%] bottom-0 rounded-full bg-[radial-gradient(closest-side,rgba(69,211,255,0.45),rgba(69,211,255,0))]"
                />
                <Image
                  src={aluno}
                  alt="Estudante de Odontologia da Faculdade Vidal sorrindo, de jaleco"
                  priority
                  sizes="(min-width: 1024px) 820px, 560px"
                  className="relative h-auto w-full [mask-image:linear-gradient(to_bottom,#000_78%,transparent_100%)]"
                />
                {/* Card flutuante com a marca do programa de bolsas, desenhado em CSS como na arte */}
                <p
                  aria-label="Conquista Vidal, programa de bolsas"
                  className="absolute -bottom-[12%] left-1/2 -translate-x-1/2 -rotate-3 overflow-hidden rounded-2xl bg-[linear-gradient(160deg,#2b9df4,#0d5fd1)] px-4 py-2.5 text-center shadow-[0_18px_40px_-12px_rgba(3,27,78,0.85)] ring-2 ring-white/70 lg:px-7 lg:py-4">
                  <span
                    aria-hidden
                    className="absolute inset-0 bg-[url(/images/vestibular/reticula.webp)] bg-cover bg-center opacity-25"
                  />
                  <span
                    aria-hidden
                    className="font-condensada relative block text-[22px] leading-[0.9] font-extrabold tracking-tight text-white uppercase [text-shadow:0_1px_0_#d6e8ff,0_2px_0_#9cc4f5,0_3px_0_#5b95e0,0_4px_0_#2f6fd0,0_7px_12px_rgba(3,27,78,0.6)] sm:text-[30px] lg:text-[40px]">
                    Conquista
                    <span className="block text-[28px] sm:text-[38px] lg:text-[52px]">Vidal</span>
                  </span>
                </p>
              </div>
            </RevealAnimation>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;

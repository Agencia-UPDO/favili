import { vestibular } from '@/data/vestibular';
import RevealAnimation from '../animation/RevealAnimation';
import { BotaoInscricao, Marca } from './ui';

const ChamadaFinal = () => (
  <section className="px-3 pb-16 md:px-5 md:pb-20" aria-label="Inscreva-se">
    <RevealAnimation delay={0.2}>
      <div className="bg-vest relative overflow-hidden rounded-[28px] md:rounded-[40px]">
        <div aria-hidden className="bg-pontos absolute inset-0 opacity-50" />
        <div className="main-container relative flex flex-col items-center gap-6 py-14 text-center md:py-20">
          <h2 className="font-chamada max-w-[820px] leading-[1.15] text-white">
            Seu futuro pode começar agora.
            <span className="mt-2 block">
              <Marca>Inscreva-se grátis</Marca>
            </span>
          </h2>
          <p className="text-accent/80 max-w-[560px] md:text-lg">
            Inscrições até 20 de novembro, às 18h. Prova on-line em {vestibular.diasCurto}, das 8h às 20h.
          </p>
          <BotaoInscricao className="mt-2">Quero me inscrever</BotaoInscricao>
        </div>
      </div>
    </RevealAnimation>
  </section>
);

export default ChamadaFinal;

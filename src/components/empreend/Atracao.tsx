import { atracao } from '@/data/empreend';
import RevealAnimation from '../animation/RevealAnimation';
import Kicker from './Kicker';

const Atracao = () => {
  return (
    <section className="px-3 md:px-5" aria-label="Atração musical">
      <RevealAnimation delay={0.2}>
        <div className="bg-faixa main-container relative overflow-hidden rounded-[28px] !px-6 py-12 md:rounded-[40px] md:!px-14 md:py-16">
          {/* ondas sonoras decorativas */}
          <div aria-hidden className="absolute inset-y-0 right-6 hidden items-center gap-2 md:flex lg:right-16">
            {[40, 90, 60, 140, 100, 170, 80, 120, 50].map((h, i) => (
              <span
                key={i}
                className={i % 2 ? 'bg-emp-cyan/70 w-3 rounded-full' : 'w-3 rounded-full bg-white/15'}
                style={{ height: h }}
              />
            ))}
          </div>
          <div className="relative max-w-[640px] space-y-5 text-center md:text-left">
            <Kicker claro>Atração musical confirmada</Kicker>
            <h2 className="font-letreiro text-white">
              Música ao vivo com <span className="text-emp-cyan">{atracao.nome}</span>
            </h2>
            <p className="text-accent/75 md:text-lg">{atracao.texto}</p>
          </div>
        </div>
      </RevealAnimation>
    </section>
  );
};

export default Atracao;

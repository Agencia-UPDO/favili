import { evento } from '@/data/empreend';
import turma from '@public/images/empreend/fotos/turma.jpg';
import Image from 'next/image';
import LinhasCrescimento from './LinhasCrescimento';

// Fechamento com um único CTA; o "Anote na agenda" aparece só depois da inscrição (página de obrigado)
const ChamadaFinal = () => {
  return (
    <section className="px-3 pb-16 md:px-5 md:pb-20" aria-label="Confirme sua presença">
      <div className="bg-grafico main-container relative overflow-hidden rounded-[28px] !px-6 py-12 md:rounded-[40px] md:!px-14 md:py-16">
        <LinhasCrescimento />
        <div className="relative flex flex-col items-center gap-10 text-center lg:flex-row lg:justify-between lg:text-left">
          <div className="max-w-[560px] space-y-5">
            <h2 className="font-letreiro text-white">
              Te esperamos no <span className="text-emp-cyan">Empreend/</span>
            </h2>
            <p className="text-accent/75 md:text-lg">
              {evento.data}, {evento.diaSemana}, das {evento.horario}, no {evento.local}. Confirme sua presença e receba
              os avisos do evento.
            </p>
            <a
              href="#presenca"
              className="bg-emp-cyan text-secondary mt-2 inline-block rounded-full px-10 py-4 text-lg font-extrabold transition-colors duration-300 hover:bg-white">
              Confirmar presença
            </a>
          </div>
          <figure className="w-full max-w-[460px] shrink-0 rotate-2">
            <div className="overflow-hidden rounded-[24px] border-[6px] border-white shadow-[0_30px_60px_-25px_rgba(0,0,0,0.6)]">
              <Image
                src={turma}
                alt="Alunos de Administração e expositores reunidos sob o pórtico do Empreend 2025"
                className="h-auto w-full"
                sizes="(min-width: 1024px) 460px, 90vw"
                placeholder="blur"
              />
            </div>
            <figcaption className="text-tagline-3 mt-3 text-white/60">Turma do Empreend 2025</figcaption>
          </figure>
        </div>
      </div>
    </section>
  );
};

export default ChamadaFinal;

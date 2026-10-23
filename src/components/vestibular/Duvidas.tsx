import { faq } from '@/data/vestibular';
import { Rotulo } from './ui';

// Perguntas frequentes com <details>: abre e fecha sem JavaScript e o texto sai do servidor
const Duvidas = () => (
  <section id="duvidas" className="scroll-mt-20 py-16 md:py-20 lg:py-24" aria-labelledby="duvidas-titulo">
    <div className="main-container grid grid-cols-12 gap-y-8 lg:gap-x-12">
      <div className="col-span-12 space-y-4 text-center lg:col-span-4 lg:text-left">
        <Rotulo>Dúvidas frequentes</Rotulo>
        <h2 id="duvidas-titulo" className="font-chamada text-vest-navy">
          Ficou alguma dúvida?
        </h2>
        <p>As respostas seguem o regulamento do Vestibular Conquista Vidal 2027.1.</p>
      </div>
      <div className="col-span-12 space-y-2.5 lg:col-span-8">
        {faq.map((f) => (
          <details
            key={f.pergunta}
            className="group border-stroke-2 open:border-vest-blue rounded-[20px] border bg-white px-5 transition-colors md:px-6">
            <summary className="text-vest-navy flex cursor-pointer list-none items-center justify-between gap-4 py-4 text-[16px] font-bold md:text-[17px] [&::-webkit-details-marker]:hidden">
              {f.pergunta}
              <span
                aria-hidden
                className="bg-background-3 group-open:bg-vest-blue flex size-8 shrink-0 items-center justify-center rounded-full transition-colors group-open:text-white">
                <svg width={14} height={14} viewBox="0 0 24 24" fill="none" className="transition-transform group-open:rotate-45">
                  <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth={2.6} strokeLinecap="round" />
                </svg>
              </span>
            </summary>
            <p className="pb-5">{f.resposta}</p>
          </details>
        ))}
      </div>
    </div>
  </section>
);

export default Duvidas;

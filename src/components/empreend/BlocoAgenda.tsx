import { evento, lembretes } from '@/data/empreend';
import { cn } from '@/utils/cn';
import CompartilharConvite from './CompartilharConvite';

// Folha de bloco de notas "Anote na agenda": espiral no topo, folha pautada, data grifada com marca-texto
// e lista do que não esquecer já marcada. Botões: compartilhar a imagem do convite (WhatsApp) e salvar no Google Agenda.
const pauta =
  'bg-[repeating-linear-gradient(to_bottom,transparent_0,transparent_35px,rgba(19,87,217,0.14)_35px,rgba(19,87,217,0.14)_36px)]';

const Check = () => (
  <svg aria-hidden width={22} height={22} viewBox="0 0 24 24" fill="none" className="shrink-0">
    <rect x={2.5} y={2.5} width={19} height={19} rx={5} stroke="#1357d9" strokeOpacity={0.35} strokeWidth={1.6} />
    <path d="M6.5 12.5 10.5 16.5 18 7" stroke="#1357d9" strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const BlocoAgenda = ({ className }: { className?: string }) => {
  return (
    <div className={cn('relative w-full max-w-[400px] -rotate-2', className)}>
      {/* post-it colado no canto */}
      <span className="bg-emp-cyan text-secondary font-espacada absolute -top-5 -right-4 z-20 rotate-6 px-4 py-3 text-[11px] leading-tight shadow-[0_10px_20px_-10px_rgba(0,0,0,0.5)]">
        {evento.edicao}
        <br />
        não perca!
      </span>

      {/* espiral */}
      <div className="relative z-10 flex justify-around px-6" aria-hidden>
        {Array.from({ length: 11 }, (_, i) => (
          <span key={i} className="relative h-7 w-2.5">
            <span className="border-emp-navy/80 absolute inset-0 rounded-full border-[3px] bg-transparent" />
          </span>
        ))}
      </div>

      <div className="-mt-3.5 overflow-hidden rounded-b-[18px] rounded-t-md bg-white shadow-[0_30px_60px_-25px_rgba(0,0,0,0.65)]">
        {/* furos da espiral */}
        <div className="flex justify-around px-6 pt-2.5 pb-3" aria-hidden>
          {Array.from({ length: 11 }, (_, i) => (
            <span key={i} className="bg-emp-navy/85 size-2.5 rounded-full" />
          ))}
        </div>

        <div className={cn('relative px-6 pt-0 pb-6 text-left md:px-7', pauta)}>
          {/* margem da folha */}
          <span aria-hidden className="bg-emp-cyan/50 absolute inset-y-0 left-4 w-px md:left-5" />

          <p className="font-espacada text-emp-blue pl-3 text-[11px] leading-[36px]">Anote na agenda</p>

          <p className="text-secondary relative pl-3 leading-[36px]">
            <span className="relative inline-block">
              {/* marca-texto */}
              <span aria-hidden className="bg-emp-cyan/45 absolute inset-x-[-6px] bottom-1.5 h-[18px] -skew-x-12 rounded-sm" />
              <span className="font-letreiro relative text-[30px]">18/11</span>
            </span>
            <span className="ml-2 font-semibold">{evento.diaSemana}</span>
          </p>
          <p className="text-secondary pl-3 leading-[36px] font-semibold">{evento.horario}</p>
          <p className="text-secondary/70 pl-3 leading-[36px]">{evento.local}</p>

          <p className="font-espacada text-emp-blue mt-[36px] pl-3 text-[11px] leading-[36px]">Não esquecer</p>
          <ul>
            {lembretes.map((l) => (
              <li key={l} className="text-secondary/80 flex h-[36px] items-center gap-2.5 pl-3 text-[15px] leading-tight">
                <Check />
                {l}
              </li>
            ))}
          </ul>

          <div className="mt-5 flex flex-col gap-2 pl-3 sm:flex-row">
            <CompartilharConvite className="flex-1" />
            <a
              href={evento.googleAgenda}
              target="_blank"
              rel="noopener"
              className="border-emp-navy text-secondary hover:bg-emp-navy flex-1 rounded-full border-2 px-4 py-2.5 text-center text-[14px] font-bold transition-colors duration-300 hover:text-white">
              Google Agenda
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BlocoAgenda;

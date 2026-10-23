import { FormaId, vestibular } from '@/data/vestibular';
import { cn } from '@/utils/cn';
import { ReactNode } from 'react';

// Peças visuais repetidas da LP, na linguagem das artes da campanha

// Rótulo acima dos títulos, com o quadradinho ciano das artes
export const Rotulo = ({ children, claro, className }: { children: ReactNode; claro?: boolean; className?: string }) => (
  <span
    className={cn(
      'inline-flex items-center gap-2.5 text-[12px] font-bold tracking-[0.28em] uppercase md:text-[13px]',
      claro ? 'text-vest-cyan' : 'text-vest-blue',
      className,
    )}>
    <span aria-hidden className="bg-vest-cyan size-3 rounded-[3px]" />
    {children}
  </span>
);

// Marcador amarelo das artes ("95 BOLSAS")
export const Marca = ({ children, className }: { children: ReactNode; className?: string }) => (
  <span className={cn('bg-vest-yellow text-vest-navy rounded-[10px] px-[0.18em] box-decoration-clone', className)}>
    {children}
  </span>
);

// Pílulas com contorno das artes ("21 E 22 DE NOVEMBRO", "INSCRIÇÕES GRATUITAS")
export const Pilula = ({ children, cheia, className }: { children: ReactNode; cheia?: boolean; className?: string }) => (
  <span
    className={cn(
      'inline-flex items-center rounded-full border px-4 py-2 text-[11px] font-bold tracking-[0.2em] whitespace-nowrap uppercase md:text-[12px]',
      cheia ? 'bg-vest-cyan border-vest-cyan text-vest-navy' : 'border-white/70 text-white',
      className,
    )}>
    {children}
  </span>
);

// Botão de inscrição: leva à inscrição do vestibular, já com a forma de ingresso quando vem de uma delas
export const BotaoInscricao = ({
  children = 'Inscreva-se grátis',
  className,
  variante = 'amarelo',
  forma,
}: {
  children?: ReactNode;
  className?: string;
  variante?: 'amarelo' | 'azul';
  forma?: FormaId;
}) => (
  <a
    href={forma ? `${vestibular.inscricao}?forma=${forma}` : vestibular.inscricao}
    className={cn(
      'inline-flex items-center justify-center gap-2 rounded-full px-8 py-4 text-[17px] font-extrabold transition-colors duration-300',
      variante === 'amarelo'
        ? 'bg-vest-yellow text-vest-navy hover:bg-white'
        : 'bg-vest-blue hover:bg-vest-navy text-white',
      className,
    )}>
    {children}
    <Seta />
  </a>
);

export const Seta = ({ className }: { className?: string }) => (
  <svg aria-hidden width={18} height={18} viewBox="0 0 24 24" fill="none" className={className}>
    <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const Check = ({ className }: { className?: string }) => (
  <svg aria-hidden width={18} height={18} viewBox="0 0 24 24" fill="none" className={className}>
    <path d="M20 6 9 17l-5-5" stroke="currentColor" strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

import { FormaId } from '@/data/vestibular';

// Ícones das formas de ingresso (traço simples, herdam a cor do texto)
const caminhos: Record<FormaId, React.ReactNode> = {
  vestibular: (
    <>
      <rect x="4" y="3" width="16" height="18" rx="2.5" />
      <path d="M8 8h8M8 12h8M8 16h4" />
    </>
  ),
  enem: (
    <>
      <circle cx="12" cy="9" r="5" />
      <path d="m9 13.5-1.5 7L12 18l4.5 2.5-1.5-7" />
    </>
  ),
  'segunda-graduacao': (
    <>
      <path d="M2 9.5 12 5l10 4.5-10 4.5L2 9.5Z" />
      <path d="M6 11.5V16c0 1.4 2.7 3 6 3s6-1.6 6-3v-4.5M22 9.5V15" />
    </>
  ),
  transferencia: (
    <>
      <path d="M4 8h13l-3.5-3.5M20 16H7l3.5 3.5" />
    </>
  ),
};

const IconeForma = ({ id, className }: { id: FormaId; className?: string }) => (
  <svg
    aria-hidden
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.9}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}>
    {caminhos[id]}
  </svg>
);

export default IconeForma;

import { cn } from '@/utils/cn';

// Rótulo acima dos títulos, com a barra "/" do letreiro EMPREEND/
const Kicker = ({ children, className, claro }: { children: React.ReactNode; className?: string; claro?: boolean }) => (
  <span
    className={cn(
      'font-espacada inline-flex items-center gap-3 text-[12px] md:text-[13px]',
      claro ? 'text-emp-cyan' : 'text-emp-blue',
      className,
    )}>
    <span aria-hidden className="bg-emp-cyan h-4 w-1.5 skew-x-[-20deg]" />
    {children}
  </span>
);

export default Kicker;

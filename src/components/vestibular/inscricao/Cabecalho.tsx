import logo from '@public/images/vestibular/logo-vidal.png';
import Image from 'next/image';
import { rotaAreaCandidato } from './Confirmacao';

// Topo das páginas de inscrição e da área do candidato
const Cabecalho = ({ link }: { link: 'inscricao' | 'area' }) => (
  <header className="border-stroke-2/70 border-b bg-white print:hidden">
    <div className="main-container flex h-[68px] items-center justify-between gap-4">
      <a href="/vestibular" className="flex items-center gap-3">
        <Image src={logo} alt="Faculdade Vidal" className="h-10 w-auto" priority />
        <span className="border-stroke-3 hidden border-l pl-3 leading-tight sm:block">
          <span className="font-condensada text-vest-navy block text-[19px] font-bold tracking-wide uppercase">
            Vestibular 2027.1
          </span>
          <span className="text-tagline-3 text-secondary/60">Conquista Vidal</span>
        </span>
      </a>
      {link === 'area' ? (
        <a
          href={rotaAreaCandidato}
          className="border-vest-blue text-vest-blue hover:bg-vest-blue rounded-full border px-4 py-2 text-[14px] font-bold transition-colors hover:text-white">
          Já me inscrevi
        </a>
      ) : (
        <a
          href="/vestibular/inscricao"
          className="border-vest-blue text-vest-blue hover:bg-vest-blue rounded-full border px-4 py-2 text-[14px] font-bold transition-colors hover:text-white">
          Fazer inscrição
        </a>
      )}
    </div>
  </header>
);

export default Cabecalho;

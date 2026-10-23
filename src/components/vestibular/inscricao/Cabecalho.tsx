import logo from '@public/images/vestibular/logo-vidal.png';
import Image from 'next/image';
import { rotaAreaCandidato } from './Confirmacao';

// Topo das páginas de inscrição e da área do candidato
const Cabecalho = ({ link }: { link: 'inscricao' | 'area' }) => (
  <header className="border-stroke-2/70 border-b bg-white print:hidden">
    <div className="main-container flex h-[68px] items-center justify-between gap-4">
      <a href="/vestibular" className="flex items-center gap-2.5 sm:gap-3">
        <Image src={logo} alt="Faculdade Vidal" className="h-9 w-auto sm:h-10" priority />
        <span className="border-stroke-3 block border-l pl-2.5 leading-tight sm:pl-3">
          <span className="font-condensada text-vest-navy block text-[16px] font-bold tracking-wide whitespace-nowrap uppercase sm:text-[19px]">
            Vestibular 2027.1
          </span>
          <span className="text-tagline-3 text-secondary/60">Conquista Vidal</span>
        </span>
      </a>
      {link === 'area' ? (
        <a
          href={rotaAreaCandidato}
          className="border-vest-blue text-vest-blue hover:bg-vest-blue rounded-full border px-3 py-2 text-[13px] font-bold whitespace-nowrap transition-colors hover:text-white sm:px-4 sm:text-[14px]">
          Já me inscrevi
        </a>
      ) : (
        <a
          href="/vestibular/inscricao"
          className="border-vest-blue text-vest-blue hover:bg-vest-blue rounded-full border px-3 py-2 text-[13px] font-bold whitespace-nowrap transition-colors hover:text-white sm:px-4 sm:text-[14px]">
          Fazer inscrição
        </a>
      )}
    </div>
  </header>
);

export default Cabecalho;

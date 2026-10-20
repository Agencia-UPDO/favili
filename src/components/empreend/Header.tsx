import faixa from '@public/images/empreend/logo-faixa.png';
import Image from 'next/image';

const Header = () => {
  return (
    <header className="border-stroke-2/70 fixed inset-x-0 top-0 z-50 border-b bg-white/90 backdrop-blur-md">
      <div className="main-container flex h-[72px] items-center justify-between gap-4 lg:h-[84px]">
        <a href="/#presenca" className="flex items-center gap-3">
          <Image src={faixa} alt="Empreend · Feira de Negócios" className="h-8 w-auto md:h-11" priority />
          <span className="text-secondary border-stroke-3 hidden border-l pl-3 leading-tight md:block">
            <span className="block text-[15px] font-bold">Faculdade Vidal</span>
            <span className="text-tagline-3 text-secondary/60">Curso de Administração</span>
          </span>
        </a>
        <a
          href="/#presenca"
          className="bg-emp-blue hover:bg-emp-navy text-tagline-2 md:text-tagline-1 rounded-full px-4 py-2.5 font-semibold whitespace-nowrap text-white transition-colors duration-300 md:px-7 md:py-3">
          Confirmar presença
        </a>
      </div>
    </header>
  );
};

export default Header;

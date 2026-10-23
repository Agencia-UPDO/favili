import logo from '@public/images/vestibular/logo-vidal.png';
import Image from 'next/image';
import { BotaoInscricao } from './ui';

const links = [
  { href: '#ingresso', rotulo: 'Formas de ingresso' },
  { href: '#como-funciona', rotulo: 'Como funciona' },
  { href: '#bolsas', rotulo: 'Descontos e bolsas' },
  { href: '#cursos', rotulo: 'Cursos' },
  { href: '#duvidas', rotulo: 'Dúvidas' },
];

const Header = () => (
  <header className="border-stroke-2/70 fixed inset-x-0 top-0 z-50 border-b bg-white/90 backdrop-blur-md">
    <div className="main-container flex h-[68px] items-center justify-between gap-4 lg:h-[80px]">
      <a href="#topo" className="flex items-center gap-2.5 sm:gap-3">
        <Image src={logo} alt="Faculdade Vidal" className="h-9 w-auto sm:h-10 lg:h-12" priority />
        <span className="border-stroke-3 block border-l pl-2.5 leading-tight sm:pl-3">
          <span className="font-condensada text-vest-navy block text-[16px] font-bold tracking-wide uppercase sm:text-[19px]">
            Vestibular 2027.1
          </span>
          <span className="text-tagline-3 text-secondary/60">Conquista Vidal</span>
        </span>
      </a>
      <nav aria-label="Seções" className="hidden lg:block">
        <ul className="flex gap-7">
          {links.map((l) => (
            <li key={l.href}>
              <a href={l.href} className="text-secondary/80 hover:text-vest-blue text-[15px] font-medium transition-colors">
                {l.rotulo}
              </a>
            </li>
          ))}
        </ul>
      </nav>
      <div className="flex items-center gap-4">
        <a href="/vestibular/minha-inscricao" className="text-vest-blue hidden text-[15px] font-semibold hover:underline sm:block">
          Já me inscrevi
        </a>
        <BotaoInscricao className="px-4 py-2.5 text-[14px] sm:px-5 sm:text-[15px] md:px-7 md:py-3">
          Inscreva-se
        </BotaoInscricao>
      </div>
    </div>
  </header>
);

export default Header;

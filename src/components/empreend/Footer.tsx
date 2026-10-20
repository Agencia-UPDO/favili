import { evento } from '@/data/empreend';
import logo from '@public/images/empreend/logo-empreend.png';
import Image from 'next/image';

const Footer = () => {
  return (
    <footer className="border-stroke-2 border-t bg-white">
      <div className="main-container flex flex-col items-center gap-6 py-10 text-center md:flex-row md:justify-between md:text-left">
        <Image src={logo} alt="Empreend 2026 · Feira de Negócios · Faculdade Vidal" className="h-28 w-auto" />
        <div className="space-y-1 leading-tight md:text-right">
          <p className="text-secondary font-bold">{evento.nome}</p>
          <p className="text-tagline-2">
            {evento.data} de {evento.ano} · {evento.horario}
          </p>
          <p className="text-tagline-2">{evento.local}</p>
        </div>
      </div>
      <p className="text-tagline-3 text-secondary/50 border-stroke-2 border-t py-5 text-center">
        © {new Date().getFullYear()} Faculdade Vidal · Curso de Administração
      </p>
    </footer>
  );
};

export default Footer;

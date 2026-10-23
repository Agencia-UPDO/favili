import { instituicao, vestibular } from '@/data/vestibular';
import logo from '@public/images/vestibular/logo-vidal.png';
import Image from 'next/image';

const Footer = () => (
  <footer className="border-stroke-2 border-t bg-white">
    <div className="main-container flex flex-col items-center gap-6 py-10 text-center md:flex-row md:justify-between md:text-left">
      <Image src={logo} alt="Faculdade Vidal" className="h-24 w-auto" />
      <div className="space-y-1 leading-snug md:text-right">
        <p className="text-vest-navy font-bold">{instituicao.nome}</p>
        <p className="text-tagline-2">{instituicao.endereco}</p>
        <p className="text-tagline-2">
          <a href={instituicao.telefoneLink} className="hover:text-vest-blue">
            {instituicao.telefone}
          </a>
          {' · '}
          <a href={instituicao.instagram} target="_blank" rel="noopener" className="hover:text-vest-blue">
            @faculdadevidal
          </a>
          {' · '}
          <a href={vestibular.regulamento} target="_blank" className="hover:text-vest-blue">
            Regulamento
          </a>
        </p>
      </div>
    </div>
    <p className="text-tagline-3 text-secondary/50 border-stroke-2 border-t px-5 py-5 text-center">
      © {new Date().getFullYear()} Faculdade Vidal · {instituicao.mec}
    </p>
  </footer>
);

export default Footer;

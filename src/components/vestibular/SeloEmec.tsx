import { cn } from '@/utils/cn';
import selo from '@public/vestibular/selo-emec.png';
import Image from 'next/image';

// Selo oficial de consulta ao cadastro da Faculdade Vidal no e-MEC (imagem original, sem alterações):
// o selo inteiro é um link para a página do MEC
export const linkEmec =
  'https://emec.mec.gov.br/emec/consulta-cadastro/detalhamento/d96957f455f6405d14c6542552b0f6eb/MTc0OTk=';

const SeloEmec = ({ className }: { className?: string }) => (
  <a href={linkEmec} target="_blank" rel="noopener" className={cn('inline-block', className)}>
    <Image
      src={selo}
      alt="Consulte o cadastro da Faculdade Vidal no Sistema e-MEC"
      className="h-auto w-[320px] max-w-full rounded-xl"
    />
  </a>
);

export default SeloEmec;

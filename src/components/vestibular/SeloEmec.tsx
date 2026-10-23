import { cn } from '@/utils/cn';

// Selo de consulta ao cadastro da Faculdade Vidal no e-MEC: o selo inteiro é um link para a página oficial do MEC
export const linkEmec =
  'https://emec.mec.gov.br/emec/consulta-cadastro/detalhamento/d96957f455f6405d14c6542552b0f6eb/MTc0OTk=';

const SeloEmec = ({ className }: { className?: string }) => (
  <a
    href={linkEmec}
    target="_blank"
    rel="noopener"
    aria-label="Consulte o cadastro da Faculdade Vidal no Sistema e-MEC (abre o site do MEC)"
    className={cn('group inline-flex items-center gap-4 text-left', className)}>
    <span className="flex w-[104px] shrink-0 flex-col items-center rounded-2xl border-[3px] border-[#1351b4] bg-white px-2 pt-1.5 pb-2 shadow-sm transition-transform group-hover:-translate-y-0.5">
      <span className="font-sans text-[20px] leading-none font-black tracking-tight">
        <span className="text-[#168821]">e</span>
        <span className="text-[#1351b4]">-MEC</span>
      </span>
      {/* QR Code gerado para o mesmo link (public/vestibular/emec-qrcode.svg) */}
      <img src="/vestibular/emec-qrcode.svg" alt="" width={76} height={76} className="mt-1.5 size-[76px]" />
      <span className="mt-1.5 rounded-full bg-[#1351b4] px-2 py-0.5 text-[10px] font-extrabold tracking-wide text-white">
        ACESSE JÁ!
      </span>
    </span>
    <span className="max-w-[190px] text-[15px] leading-snug font-bold text-[#1351b4] group-hover:underline">
      Consulte aqui o cadastro da Instituição no Sistema e-MEC
    </span>
  </a>
);

export default SeloEmec;

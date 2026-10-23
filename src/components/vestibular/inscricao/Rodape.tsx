import { instituicao } from '@/data/vestibular';
import SeloEmec from '../SeloEmec';

// Rodapé das páginas de inscrição e da área do candidato: selo do e-MEC e dados da instituição
const Rodape = () => (
  <footer className="border-stroke-2 border-t bg-white print:hidden">
    <div className="mx-auto flex w-full max-w-[720px] flex-col items-center gap-5 px-4 py-8 text-center sm:flex-row sm:justify-between sm:text-left">
      <SeloEmec />
      <div className="text-tagline-2 text-secondary/70 space-y-1 sm:text-right">
        <p className="text-vest-navy font-bold">{instituicao.nome}</p>
        <p>{instituicao.mec}</p>
        <p>
          <a href={instituicao.telefoneLink} className="hover:text-vest-blue">
            {instituicao.telefone}
          </a>
        </p>
      </div>
    </div>
  </footer>
);

export default Rodape;

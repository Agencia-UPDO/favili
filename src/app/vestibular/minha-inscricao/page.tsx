import AreaCandidato from '@/components/vestibular/inscricao/AreaCandidato';
import Cabecalho from '@/components/vestibular/inscricao/Cabecalho';
import { Rotulo } from '@/components/vestibular/ui';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Minha inscrição · Vestibular Conquista Vidal 2027.1 | Faculdade Vidal',
  description: 'Acesse sua inscrição no Vestibular Conquista Vidal 2027.1 com CPF e código de acesso.',
  robots: { index: false },
};

const page = () => (
  <>
    <Cabecalho link="inscricao" />
    <main className="bg-background-3 min-h-[calc(100vh-68px)] py-10 md:py-14">
      <div className="mx-auto w-full max-w-[720px] px-4">
        <div className="mb-6 text-center print:hidden">
          <Rotulo>Área do candidato</Rotulo>
        </div>
        <div className="rounded-[28px] bg-white p-5 shadow-[0_30px_60px_-30px_rgba(6,46,114,0.35)] md:p-9">
          <AreaCandidato />
        </div>
      </div>
    </main>
  </>
);

export default page;

import Cabecalho from '@/components/vestibular/inscricao/Cabecalho';
import Rodape from '@/components/vestibular/inscricao/Rodape';
import FormInscricao from '@/components/vestibular/inscricao/FormInscricao';
import { Rotulo } from '@/components/vestibular/ui';
import { ofertasAtivas } from '@/data/inscricao';
import { FormaId, formas, vestibular } from '@/data/vestibular';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Inscrição · Vestibular Conquista Vidal 2027.1 | Faculdade Vidal',
  description:
    'Inscreva-se grátis no Vestibular Conquista Vidal 2027.1: prova on-line em 21 ou 22 de novembro, no dia e horário que você escolher.',
  alternates: { canonical: '/vestibular/inscricao' },
};

// Aceita ?forma=enem e ?curso=direito para a LP de cada área já abrir com a escolha feita
const page = async ({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) => {
  const params = await searchParams;
  const forma = formas.find((f) => f.id === params.forma)?.id as FormaId | undefined;
  const oferta = ofertasAtivas.find((o) => o.id === params.curso)?.id;
  const encerradas = Date.now() > new Date(vestibular.fimInscricoes).getTime();

  return (
    <>
      <Cabecalho link="area" />

      <main className="bg-background-3 min-h-[calc(100vh-68px)] py-10 md:py-14 print:min-h-0 print:bg-white print:py-0">
        <div className="mx-auto w-full max-w-[720px] px-4 print:max-w-none print:px-0">
          <div className="mb-8 space-y-3 text-center print:hidden">
            <Rotulo>Inscrição grátis</Rotulo>
            <h1 className="font-chamada text-vest-navy text-[44px] md:text-[56px]">Garanta sua vaga</h1>
            <p className="text-[16px] md:text-lg">
              {vestibular.descontoGarantido} de desconto garantido para os aprovados. Faça a prova em{' '}
              {vestibular.diasCurto}, no dia e horário que escolher, e concorra a bolsas de até 100%. Inscrições até{' '}
              {vestibular.inscricoes.split(' a ')[1]}, às 18h.
            </p>
          </div>

          <div className="rounded-[28px] bg-white p-5 shadow-[0_30px_60px_-30px_rgba(6,46,114,0.35)] md:p-9 print:rounded-none print:p-0 print:shadow-none">
            {encerradas ? (
              <p className="text-center text-lg">
                As inscrições do {vestibular.nome} foram encerradas em 20/11, às 18h.
              </p>
            ) : (
              <FormInscricao formaInicial={forma} ofertaInicial={oferta} />
            )}
          </div>
        </div>
      </main>
      <Rodape />
    </>
  );
};

export default page;

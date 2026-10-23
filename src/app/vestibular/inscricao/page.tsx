import FormInscricao from '@/components/vestibular/inscricao/FormInscricao';
import { Rotulo } from '@/components/vestibular/ui';
import { ofertas } from '@/data/inscricao';
import { FormaId, formas, vestibular } from '@/data/vestibular';
import logo from '@public/images/vestibular/logo-vidal.png';
import { Metadata } from 'next';
import Image from 'next/image';

export const metadata: Metadata = {
  title: 'Inscrição · Vestibular Conquista Vidal 2027.1 | Faculdade Vidal',
  description: 'Inscreva-se grátis no Vestibular Conquista Vidal 2027.1: prova on-line em 21 e 22 de novembro.',
  alternates: { canonical: '/vestibular/inscricao' },
};

// Aceita ?forma=enem e ?curso=direito para a LP de cada área já abrir com a escolha feita
const page = async ({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) => {
  const params = await searchParams;
  const forma = formas.find((f) => f.id === params.forma)?.id as FormaId | undefined;
  const oferta = ofertas.find((o) => o.id === params.curso)?.id;
  const encerradas = Date.now() > new Date(vestibular.fimInscricoes).getTime();

  return (
    <>
      <header className="border-stroke-2/70 border-b bg-white">
        <div className="main-container flex h-[68px] items-center justify-between gap-4">
          <a href="/vestibular" className="flex items-center gap-3">
            <Image src={logo} alt="Faculdade Vidal" className="h-10 w-auto" priority />
            <span className="border-stroke-3 hidden border-l pl-3 leading-tight sm:block">
              <span className="font-condensada text-vest-navy block text-[19px] font-bold tracking-wide uppercase">
                Vestibular 2027.1
              </span>
              <span className="text-tagline-3 text-secondary/60">Conquista Vidal</span>
            </span>
          </a>
          <a href="/vestibular" className="text-secondary/70 hover:text-vest-blue text-[14px] font-semibold">
            ← Voltar
          </a>
        </div>
      </header>

      <main className="bg-background-3 min-h-[calc(100vh-68px)] py-10 md:py-14">
        <div className="mx-auto w-full max-w-[720px] px-4">
          <div className="mb-8 space-y-3 text-center">
            <Rotulo>Inscrição grátis</Rotulo>
            <h1 className="font-chamada text-vest-navy text-[44px] md:text-[56px]">Garanta sua vaga</h1>
            <p className="text-[16px] md:text-lg">
              {vestibular.descontoGarantido} de desconto garantido para todos. Faça a prova em {vestibular.diasCurto} e
              concorra a bolsas de até 100%. Inscrições até {vestibular.inscricoes.split(' a ')[1]}, às 18h.
            </p>
          </div>

          <div className="rounded-[28px] bg-white p-5 shadow-[0_30px_60px_-30px_rgba(6,46,114,0.35)] md:p-9">
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
    </>
  );
};

export default page;

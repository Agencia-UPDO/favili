import Cabecalho from '@/components/vestibular/inscricao/Cabecalho';
import Rodape from '@/components/vestibular/inscricao/Rodape';
import ListaResultado, { LinhaPublica } from '@/components/vestibular/resultado/ListaResultado';
import { Rotulo } from '@/components/vestibular/ui';
import { ofertas, rotaAreaCandidato } from '@/data/inscricao';
import { vestibular } from '@/data/vestibular';
import { resultadoPublicado } from '@/utils/vestibular/resultado';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Resultado · Vestibular Conquista Vidal 2027.1 | Faculdade Vidal',
  description: 'Resultado do Vestibular Conquista Vidal 2027.1: candidatos contemplados com bolsas, por curso.',
  alternates: { canonical: '/vestibular/resultado' },
};

// Sempre lê o resultado publicado na hora (a faculdade publica pelo painel)
export const dynamic = 'force-dynamic';

const page = async () => {
  const resultado = await resultadoPublicado();
  const contemplados = (resultado?.linhas ?? []).filter((l): l is LinhaPublica & typeof l => !!l.bolsa);
  const integral = contemplados.find((l) => l.bolsa === 100);

  // Agrupa por curso, na ordem das ofertas da inscrição
  const grupos = ofertas
    .map((o) => ({
      oferta: contemplados.find((l) => l.ofertaId === o.id)?.oferta ?? '',
      linhas: contemplados
        .filter((l) => l.ofertaId === o.id)
        .sort((a, b) => a.classificacaoOferta - b.classificacaoOferta)
        .map(({ numero, iniciais, ofertaId, oferta, classificacaoOferta, bolsa }) => ({
          numero,
          iniciais,
          ofertaId,
          oferta,
          classificacaoOferta,
          bolsa: bolsa as number,
        })),
    }))
    .filter((g) => g.linhas.length);

  return (
    <>
      <Cabecalho link="area" />
      <main className="bg-background-3 min-h-[calc(100vh-68px)] py-10 md:py-14">
        <div className="mx-auto w-full max-w-[860px] space-y-8 px-4">
          <div className="space-y-3 text-center">
            <Rotulo>Resultado</Rotulo>
            <h1 className="font-chamada text-vest-navy text-[44px] md:text-[56px]">{vestibular.nome}</h1>
          </div>

          {!resultado?.publicadoEm ? (
            <div className="space-y-3 rounded-[24px] bg-white p-6 text-center text-[17px]">
              <p>
                O resultado sai em <strong>{vestibular.resultado}</strong>, aqui nesta página e em{' '}
                <a href={rotaAreaCandidato} className="text-vest-blue font-semibold underline">
                  Minha inscrição
                </a>
                .
              </p>
            </div>
          ) : (
            <>
              <div className="space-y-2 rounded-[24px] bg-white p-6 text-[15px]">
                <p>
                  Estes são os candidatos contemplados com bolsas, por curso, identificados pelo número de inscrição.
                  Todos os aprovados têm {vestibular.descontoGarantido} de desconto garantido. A matrícula dos
                  contemplados vai de {vestibular.matricula}.
                </p>
                {integral && (
                  <p className="text-vest-navy font-bold">
                    Bolsa de 100% (1º lugar geral): inscrição {integral.numero} – {integral.oferta}.
                  </p>
                )}
                <p>
                  Para ver sua nota e sua classificação, entre em{' '}
                  <a href={rotaAreaCandidato} className="text-vest-blue font-semibold underline">
                    Minha inscrição
                  </a>{' '}
                  com seu CPF e código.
                </p>
              </div>
              <ListaResultado grupos={grupos} />
            </>
          )}
        </div>
      </main>
      <Rodape />
    </>
  );
};

export default page;

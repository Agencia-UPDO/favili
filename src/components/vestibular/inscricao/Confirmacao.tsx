'use client';

import {
  avisoEntrada,
  diasProva,
  documentoPorForma,
  linkAreaCandidatoCurto,
  nomeOferta,
  ofertas,
  rotaAreaCandidato,
} from '@/data/inscricao';
import { FormaId, formas, instituicao, vestibular } from '@/data/vestibular';
import { ReactNode, useState } from 'react';
import { Check } from '../ui';
import SalvarInscricao from './SalvarInscricao';

export { rotaAreaCandidato };

export type InscricaoConfirmada = {
  numero: number;
  codigo: string;
  nome: string;
  email: string;
  celular: string;
  forma: FormaId;
  ofertaId: string;
  fazProva: boolean;
  diaProva: string | null;
  horaProva: string | null;
};

// Comprovante da inscrição, com o número e o código de acesso. Aparece logo depois da inscrição (modo "nova")
// e na área do candidato (modo "area"), que encaixa o status da prova em `extra`.
const Confirmacao = ({
  inscricao,
  modo = 'nova',
  extra,
}: {
  inscricao: InscricaoConfirmada;
  modo?: 'nova' | 'area';
  extra?: ReactNode;
}) => {
  const [copiado, setCopiado] = useState(false);
  const oferta = ofertas.find((o) => o.id === inscricao.ofertaId);
  const forma = formas.find((f) => f.id === inscricao.forma);
  const dia = diasProva.find((d) => d.id === inscricao.diaProva);
  const documento = documentoPorForma[inscricao.forma];
  const primeiroNome = inscricao.nome.split(' ')[0];

  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(inscricao.codigo);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      // Sem permissão de área de transferência: o código continua na tela para anotar
    }
  };

  return (
    <div className="space-y-7" aria-live="polite">
      {modo === 'nova' ? (
        <div className="space-y-3 text-center">
          <span className="bg-vest-blue mx-auto flex size-14 items-center justify-center rounded-full text-white">
            <Check className="size-7" />
          </span>
          <h2 className="font-chamada text-vest-navy text-[36px] md:text-[44px]">Inscrição confirmada!</h2>
          <p className="text-[16px] md:text-lg">
            {primeiroNome}, você está no {vestibular.nome}. Guarde este código: com ele e o seu CPF você entra em{' '}
            <a href={rotaAreaCandidato} className="text-vest-blue font-semibold underline">
              Minha inscrição
            </a>{' '}
            para ver sua inscrição e fazer a prova.
          </p>
        </div>
      ) : (
        <div className="space-y-2 text-center">
          <h2 className="font-chamada text-vest-navy text-[36px] md:text-[44px]">Olá, {primeiroNome}!</h2>
          <p className="text-[16px] md:text-lg">Esta é a sua inscrição no {vestibular.nome}.</p>
        </div>
      )}

      <div className="bg-vest print:border-vest-navy print:text-vest-navy relative overflow-hidden rounded-[28px] p-6 text-center text-white md:p-8 print:border-2 print:bg-none">
        <p className="text-vest-cyan text-[12px] font-bold tracking-[0.24em] uppercase">Código de acesso</p>
        <p className="font-condensada print:text-vest-navy mt-2 text-[44px] leading-none font-bold tracking-[0.06em] text-white md:text-[56px]">
          {inscricao.codigo}
        </p>
        <button
          type="button"
          onClick={copiar}
          className="hover:text-vest-navy mt-4 inline-flex cursor-pointer items-center gap-2 rounded-full border border-white/60 px-5 py-2 text-[14px] font-bold transition-colors hover:bg-white print:hidden">
          {copiado ? 'Copiado!' : 'Copiar código'}
        </button>
        <p className="print:text-vest-navy mt-4 text-[14px] text-white/80">Inscrição nº {inscricao.numero}</p>
      </div>

      <dl className="divide-stroke-2 border-stroke-2 divide-y rounded-[22px] border bg-white text-[15px]">
        {[
          ['Forma de ingresso', forma?.rotulo],
          ['Curso', oferta ? nomeOferta(oferta) : ''],
          ['Prova', inscricao.fazProva && dia ? `${dia.rotulo}, às ${inscricao.horaProva?.replace(':00', 'h')}` : null],
          ['E-mail', inscricao.email],
        ]
          .filter(([, valor]) => valor)
          .map(([rotulo, valor]) => (
            <div key={rotulo} className="flex flex-col gap-0.5 px-5 py-3 sm:flex-row sm:justify-between sm:gap-6">
              <dt className="text-secondary/60">{rotulo}</dt>
              <dd className="text-vest-navy font-semibold sm:text-right">{valor}</dd>
            </div>
          ))}
      </dl>

      <SalvarInscricao inscricao={inscricao} />

      {extra}

      <div className="space-y-3">
        <div className="border-vest-blue bg-primary-50 rounded-[18px] border-l-4 p-4 text-[15px]">
          <p className="text-secondary/70 text-[13px]">Para ver sua inscrição e fazer a prova, acesse:</p>
          <a href={rotaAreaCandidato} className="text-vest-navy text-[17px] font-bold break-all underline">
            {linkAreaCandidatoCurto}
          </a>
          <p className="text-secondary/70 text-[13px]">com o seu CPF e o código de acesso.</p>
        </div>
        <p className="font-chamada text-vest-navy text-[24px]">Próximos passos</p>
        <ol className="space-y-3 text-[15px]">
          {inscricao.fazProva && (
            <>
              <li className="flex gap-3">
                <span className="text-vest-blue font-bold">1.</span>
                <span>
                  Na véspera da prova, você recebe por e-mail e WhatsApp o link da prova. Confira também a caixa de
                  spam.
                </span>
              </li>
              <li className="flex gap-3">
                <span className="text-vest-blue font-bold">2.</span>
                <span>
                  {inscricao.horaProva ? avisoEntrada(inscricao.horaProva) : null} Você tem até{' '}
                  {vestibular.duracaoHoras} horas de prova.
                </span>
              </li>
              <li className="flex gap-3">
                <span className="text-vest-blue font-bold">3.</span>
                <span>O resultado com as bolsas sai em {vestibular.resultado}.</span>
              </li>
            </>
          )}
          {documento && (
            <li className="flex gap-3">
              <span className="text-vest-blue font-bold">{inscricao.fazProva ? '4.' : '1.'}</span>
              <span>
                Nossa equipe vai chamar você no WhatsApp para receber {documento}. Com ele analisado, você recebe a
                confirmação da vaga com {vestibular.descontoGarantido} de desconto.
              </span>
            </li>
          )}
        </ol>
        <p className="text-secondary/60 text-[13px]">
          Dúvidas? Fale com a Faculdade Vidal pelo{' '}
          <a href={instituicao.telefoneLink} className="text-vest-blue font-semibold">
            {instituicao.telefone}
          </a>
          .
        </p>
      </div>

      <a
        href="/vestibular"
        className="text-vest-blue block text-center text-[15px] font-semibold underline-offset-4 hover:underline print:hidden">
        Voltar para a página do vestibular
      </a>
    </div>
  );
};

export default Confirmacao;

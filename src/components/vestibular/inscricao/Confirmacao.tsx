'use client';

import { diasProva, documentoPorForma, nomeOferta, ofertas } from '@/data/inscricao';
import { FormaId, formas, instituicao, vestibular } from '@/data/vestibular';
import { useState } from 'react';
import { Check } from '../ui';

export type InscricaoConfirmada = {
  numero: number;
  codigo: string;
  nome: string;
  email: string;
  forma: FormaId;
  ofertaId: string;
  fazProva: boolean;
  diaProva: string | null;
  horaProva: string | null;
};

// Tela que substitui o formulário depois da inscrição: é o comprovante, com o número e o código de acesso
const Confirmacao = ({ inscricao }: { inscricao: InscricaoConfirmada }) => {
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
      <div className="space-y-3 text-center">
        <span className="bg-vest-blue mx-auto flex size-14 items-center justify-center rounded-full text-white">
          <Check className="size-7" />
        </span>
        <h2 className="font-chamada text-vest-navy text-[36px] md:text-[44px]">Inscrição confirmada!</h2>
        <p className="text-[16px] md:text-lg">
          {primeiroNome}, você está no {vestibular.nome}. Guarde o seu código: é com ele que você entra na prova.
        </p>
      </div>

      <div className="bg-vest relative overflow-hidden rounded-[28px] p-6 text-center text-white md:p-8">
        <p className="text-vest-cyan text-[12px] font-bold tracking-[0.24em] uppercase">Código de acesso</p>
        <p className="font-condensada mt-2 text-[44px] leading-none font-bold tracking-[0.06em] text-white md:text-[56px]">
          {inscricao.codigo}
        </p>
        <button
          type="button"
          onClick={copiar}
          className="hover:text-vest-navy mt-4 inline-flex cursor-pointer items-center gap-2 rounded-full border border-white/60 px-5 py-2 text-[14px] font-bold transition-colors hover:bg-white">
          {copiado ? 'Copiado!' : 'Copiar código'}
        </button>
        <p className="mt-4 text-[14px] text-white/80">Inscrição nº {inscricao.numero}</p>
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

      <div className="space-y-3">
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
                  No dia e horário escolhidos, entre com seu CPF e o código acima. Você tem até{' '}
                  {vestibular.duracaoHoras} horas.
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
        className="text-vest-blue block text-center text-[15px] font-semibold underline-offset-4 hover:underline">
        Voltar para a página do vestibular
      </a>
    </div>
  );
};

export default Confirmacao;

'use client';

import {
  avisoEntrada,
  avisoFim,
  fusoHorario,
  diasProva,
  documentoPorForma,
  linkAreaCandidatoCurto,
  nomeOferta,
  ofertas,
  rotaAreaCandidato,
} from '@/data/inscricao';
import { FormaId, formas, instituicao, vestibular } from '@/data/vestibular';
import logo from '@public/images/vestibular/logo-vidal.png';
import Image from 'next/image';
import { ReactNode, useState } from 'react';
import { Check } from '../ui';
import EnvioDocumentos, { InscricaoComDocumentos } from './EnvioDocumentos';
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
  provaIniciada?: boolean;
  provaEntregue?: boolean;
} & Omit<InscricaoComDocumentos, 'forma'>;

// Comprovante da inscrição, com o número e o código de acesso. Aparece logo depois da inscrição (modo "nova")
// e na área do candidato (modo "area"), que encaixa o status da prova em `extra`.
const Confirmacao = ({
  inscricao: inicial,
  modo = 'nova',
  extra,
  cpf,
}: {
  inscricao: InscricaoConfirmada;
  modo?: 'nova' | 'area';
  extra?: ReactNode;
  // Logo depois da inscrição, o CPF permite enviar os documentos sem entrar em Minha inscrição
  cpf?: string;
}) => {
  const [inscricao, setInscricao] = useState(inicial);
  const [copiado, setCopiado] = useState(false);
  const oferta = ofertas.find((o) => o.id === inscricao.ofertaId);
  const forma = formas.find((f) => f.id === inscricao.forma);
  const dia = diasProva.find((d) => d.id === inscricao.diaProva);
  const documento = documentoPorForma[inscricao.forma];
  const primeiroNome = inscricao.nome.split(' ')[0];
  // Data de emissão do comprovante impresso (só aparece na impressão)
  const [emitido] = useState(() =>
    new Date().toLocaleString('pt-BR', {
      timeZone: 'America/Sao_Paulo',
      dateStyle: 'short',
      timeStyle: 'short',
    }),
  );

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
    <div className="comprovante space-y-7 print:space-y-4" aria-live="polite">
      {/* Cabeçalho do comprovante impresso (Baixar comprovante em PDF); na tela não aparece. Sem CPF. */}
      <div className="border-vest-navy hidden items-center justify-between gap-4 border-b-2 pb-3 print:flex">
        <Image src={logo} alt="Faculdade Vidal" className="h-11 w-auto" />
        <div className="text-right leading-tight">
          <p className="text-vest-navy text-[18px] font-bold">Comprovante de inscrição</p>
          <p className="text-secondary/70 text-[12px]">{vestibular.nome}</p>
        </div>
      </div>
      <p className="text-vest-navy hidden text-[15px] print:block">
        <span className="font-bold">{inscricao.nome}</span>, sua inscrição no {vestibular.nome} está confirmada. Guarde
        o código abaixo: com ele e o seu CPF você entra em Minha inscrição.
      </p>

      {modo === 'nova' && (
        <div className="space-y-3 text-center print:hidden">
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
      )}

      {modo === 'nova' && cpf && documento && (
        <EnvioDocumentos
          inscricao={inscricao}
          cpf={cpf}
          codigo={inscricao.codigo}
          aoAtualizar={(i) => setInscricao({ ...inscricao, ...i })}
        />
      )}

      <div className="bg-vest print:border-vest-navy print:text-vest-navy relative overflow-hidden rounded-[28px] p-6 text-center text-white md:p-8 print:rounded-2xl print:border-2 print:bg-white print:bg-none print:p-4">
        <p className="text-vest-cyan print:text-vest-blue text-[12px] font-bold tracking-[0.24em] uppercase">
          Código de acesso
        </p>
        <p className="font-condensada print:text-vest-navy mt-2 text-[44px] leading-none font-bold tracking-[0.06em] text-white md:text-[56px] print:text-[40px]">
          {inscricao.codigo}
        </p>
        <button
          type="button"
          onClick={copiar}
          className="hover:text-vest-navy mt-4 inline-flex cursor-pointer items-center gap-2 rounded-full border border-white/60 px-5 py-2 text-[14px] font-bold transition-colors hover:bg-white print:hidden">
          {copiado ? 'Copiado!' : 'Copiar código'}
        </button>
        <p className="print:text-vest-navy mt-4 text-[14px] text-white/80 print:mt-2">
          Inscrição nº {inscricao.numero}
        </p>
      </div>

      <dl className="divide-stroke-2 border-stroke-2 divide-y rounded-[22px] border bg-white text-[15px] print:rounded-2xl print:text-[13px]">
        {[
          ['Forma de ingresso', forma?.rotulo],
          ['Curso', oferta ? nomeOferta(oferta) : ''],
          [
            'Prova',
            inscricao.fazProva && dia
              ? `${dia.rotulo}, às ${inscricao.horaProva?.replace(':00', 'h')} (${fusoHorario})`
              : null,
          ],
          ['E-mail', inscricao.email],
        ]
          .filter(([, valor]) => valor)
          .map(([rotulo, valor]) => (
            <div
              key={rotulo}
              className="flex flex-col gap-0.5 px-5 py-3 sm:flex-row sm:justify-between sm:gap-6 print:flex-row print:justify-between print:gap-6 print:py-2">
              <dt className="text-secondary/60">{rotulo}</dt>
              <dd className="text-vest-navy font-semibold sm:text-right print:text-right">{valor}</dd>
            </div>
          ))}
      </dl>

      <SalvarInscricao inscricao={inscricao} />

      {extra}

      <div className="space-y-3 print:space-y-2">
        <div className="border-vest-blue bg-primary-50 rounded-[18px] border-l-4 p-4 text-[15px] print:rounded-none print:bg-transparent print:py-1">
          <p className="text-secondary/70 text-[13px]">Para ver sua inscrição e fazer a prova, acesse:</p>
          <a href={rotaAreaCandidato} className="text-vest-navy text-[17px] font-bold break-all underline">
            {linkAreaCandidatoCurto}
          </a>
          <p className="text-secondary/70 text-[13px]">com o seu CPF e o código de acesso.</p>
        </div>
        <p className="font-chamada text-vest-navy text-[24px] print:text-[20px]">Próximos passos</p>
        <ol className="space-y-3 text-[15px] print:space-y-1.5 print:text-[13px]">
          {inscricao.fazProva && (
            <>
              <li className="flex gap-3">
                <span className="text-vest-blue font-bold">1.</span>
                <span>
                  Na véspera da prova, você recebe por e-mail e WhatsApp o lembrete com o link. Você entra com seu CPF e
                  o código de acesso. Confira também a caixa de spam.
                </span>
              </li>
              <li className="flex gap-3">
                <span className="text-vest-blue font-bold">2.</span>
                <span>
                  {inscricao.horaProva ? `${avisoEntrada(inscricao.horaProva)} ${avisoFim(inscricao.horaProva)}` : null}
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
                {inscricao.documentoStatus === 'aprovado'
                  ? `Seus documentos foram aprovados: sua vaga está confirmada com ${vestibular.descontoGarantido} de desconto.`
                  : `Envie ${documento} pelo site (aqui ou em Minha inscrição), até 20/11 às 18h. Com ele aprovado, sua vaga fica confirmada com ${vestibular.descontoGarantido} de desconto.`}
              </span>
            </li>
          )}
        </ol>
        <p className="text-secondary/60 text-[13px] print:hidden">
          Dúvidas? Fale com a Faculdade Vidal pelo{' '}
          <a href={instituicao.telefoneLink} className="text-vest-blue font-semibold">
            {instituicao.telefone}
          </a>
          .
        </p>
      </div>

      {/* Rodapé do comprovante impresso */}
      <p className="border-stroke-2 text-secondary/70 hidden border-t pt-2 text-center text-[11px] print:block">
        Faculdade Vidal · {instituicao.telefone} · {instituicao.site} · Emitido em {emitido} ({fusoHorario})
      </p>

      <a
        href="/vestibular"
        className="text-vest-blue block text-center text-[15px] font-semibold underline-offset-4 hover:underline print:hidden">
        Voltar para a página do vestibular
      </a>
    </div>
  );
};

export default Confirmacao;

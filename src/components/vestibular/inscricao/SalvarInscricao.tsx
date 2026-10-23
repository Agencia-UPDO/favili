'use client';

import { diasProva } from '@/data/inscricao';
import { vestibular } from '@/data/vestibular';
import { InscricaoConfirmada, rotaAreaCandidato } from './Confirmacao';

// Botões para o candidato guardar o código: mandar para o próprio WhatsApp e pôr a prova na agenda
// (arquivo .ics, que abre no calendário do celular, ou o Google Agenda), com lembretes de 1 dia e 1 hora antes.

const linkArea = () => `${window.location.origin}${rotaAreaCandidato}`;

const inicioFim = (i: InscricaoConfirmada) => {
  if (!i.diaProva || !i.horaProva) {
    return null;
  }
  const inicio = new Date(`${i.diaProva}T${i.horaProva}:00-03:00`);
  return { inicio, fim: new Date(inicio.getTime() + vestibular.duracaoHoras * 60 * 60 * 1000) };
};

// 2026-11-21T13:00:00.000Z → 20261121T130000Z
const utc = (d: Date) =>
  d
    .toISOString()
    .replace(/[-:]/g, '')
    .replace(/\.\d{3}/, '');

const textoProva = (i: InscricaoConfirmada) => {
  const dia = diasProva.find((d) => d.id === i.diaProva);
  return dia && i.horaProva ? `${dia.rotulo}, às ${i.horaProva.replace(':00', 'h')}` : null;
};

const mensagem = (i: InscricaoConfirmada) =>
  [
    `*${vestibular.nome}*`,
    `Inscrição nº ${i.numero}`,
    `Código de acesso: *${i.codigo}*`,
    textoProva(i) ? `Prova: ${textoProva(i)}` : null,
    `Entre com seu CPF e o código em: ${linkArea()}`,
  ]
    .filter(Boolean)
    .join('\n');

const detalhesAgenda = (i: InscricaoConfirmada) =>
  `Código de acesso: ${i.codigo}\nInscrição nº ${i.numero}\nEntre com seu CPF e o código em ${linkArea()}\nVocê tem até ${vestibular.duracaoHoras} horas.`;

const baixarIcs = (i: InscricaoConfirmada) => {
  const horario = inicioFim(i);
  if (!horario) {
    return;
  }
  const escapar = (t: string) =>
    t.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');
  const ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Faculdade Vidal//Vestibular 2027.1//PT',
    'BEGIN:VEVENT',
    `UID:vestibular-${i.numero}@favili.com.br`,
    `DTSTAMP:${utc(new Date())}`,
    `DTSTART:${utc(horario.inicio)}`,
    `DTEND:${utc(horario.fim)}`,
    `SUMMARY:${escapar('Prova Vestibular Vidal')}`,
    `DESCRIPTION:${escapar(detalhesAgenda(i))}`,
    `URL:${linkArea()}`,
    'BEGIN:VALARM',
    'TRIGGER:-P1D',
    'ACTION:DISPLAY',
    'DESCRIPTION:Amanhã é a prova do vestibular',
    'END:VALARM',
    'BEGIN:VALARM',
    'TRIGGER:-PT1H',
    'ACTION:DISPLAY',
    'DESCRIPTION:A prova do vestibular começa em 1 hora',
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');
  const url = URL.createObjectURL(new Blob([ics], { type: 'text/calendar;charset=utf-8' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = 'prova-vestibular-vidal.ics';
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};

const linkGoogle = (i: InscricaoConfirmada) => {
  const horario = inicioFim(i);
  if (!horario) {
    return '';
  }
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: 'Prova Vestibular Vidal',
    dates: `${utc(horario.inicio)}/${utc(horario.fim)}`,
    details: detalhesAgenda(i),
  });
  return `https://calendar.google.com/calendar/render?${params}`;
};

const botao =
  'border-stroke-3 text-vest-navy hover:border-vest-blue inline-flex h-12 items-center justify-center gap-2 rounded-full border bg-white px-5 text-[15px] font-bold transition-colors';

const SalvarInscricao = ({ inscricao }: { inscricao: InscricaoConfirmada }) => {
  const temProva = !!inicioFim(inscricao);
  return (
    <div className="space-y-3 print:hidden">
      <p className="text-vest-navy text-center text-[15px] font-bold">Guarde seu código</p>
      <div className="grid gap-3 sm:grid-cols-2">
        <a
          href={`https://wa.me/55${inscricao.celular}?text=${encodeURIComponent(mensagem(inscricao))}`}
          target="_blank"
          rel="noopener"
          className={`${botao} border-[#25D366] text-[#128C7E] hover:bg-[#25D366] hover:text-white`}>
          <svg aria-hidden viewBox="0 0 24 24" className="size-5" fill="currentColor">
            <path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2Zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8s-.4-.1-.6.1-.7.8-.8 1-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.3-.4.7-1.3a.5.5 0 0 0 0-.5l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.7 11.8 11.8 0 0 0 4.5 4c1.7.7 2.3.8 3.2.6a2.7 2.7 0 0 0 1.8-1.2 2.2 2.2 0 0 0 .1-1.3c0-.1-.2-.2-.4-.3Z" />
          </svg>
          Enviar para meu WhatsApp
        </a>
        {temProva && (
          <>
            <button type="button" onClick={() => baixarIcs(inscricao)} className={`${botao} cursor-pointer`}>
              Pôr na agenda do celular
            </button>
            <a href={linkGoogle(inscricao)} target="_blank" rel="noopener" className={botao}>
              Google Agenda
            </a>
          </>
        )}
        <button type="button" onClick={() => window.print()} className={`${botao} cursor-pointer`}>
          Baixar comprovante (PDF)
        </button>
      </div>
      <p className="text-secondary/60 text-center text-[13px]">
        O WhatsApp abre a conversa com o seu próprio número: é só tocar em enviar para guardar o código.
      </p>
    </div>
  );
};

export default SalvarInscricao;

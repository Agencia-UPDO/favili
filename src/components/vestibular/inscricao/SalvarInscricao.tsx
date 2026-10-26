'use client';

import { avisoEntrada, avisoFim, diasProva, fusoHorario, linkAreaCandidato, minutosAntes } from '@/data/inscricao';
import { vestibular } from '@/data/vestibular';
import { InscricaoConfirmada } from './Confirmacao';

// Botões para o candidato guardar o código: mandar para o próprio WhatsApp e pôr a prova na agenda
// (arquivo .ics, que abre no calendário do celular, ou o Google Agenda), com lembretes de 1 dia, 1 hora e 15 minutos antes.

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
  return dia && i.horaProva ? `${dia.rotulo}, às ${i.horaProva.replace(':00', 'h')} (${fusoHorario})` : null;
};

const mensagem = (i: InscricaoConfirmada) =>
  [
    `*${vestibular.nome}*`,
    `Inscrição nº ${i.numero}`,
    `Código de acesso: *${i.codigo}*`,
    textoProva(i) ? `Prova: ${textoProva(i)}` : null,
    i.horaProva ? avisoEntrada(i.horaProva) : `Entre com seu CPF e o código em: ${linkAreaCandidato}`,
  ]
    .filter(Boolean)
    .join('\n');

const detalhesAgenda = (i: InscricaoConfirmada) =>
  [
    `Código de acesso: ${i.codigo}`,
    `Inscrição nº ${i.numero}`,
    i.horaProva ? avisoEntrada(i.horaProva) : `Entre com seu CPF e o código em ${linkAreaCandidato}`,
    `Link: ${linkAreaCandidato}`,
    i.horaProva ? avisoFim(i.horaProva) : `Você tem até ${vestibular.duracaoHoras} horas de prova.`,
  ].join('\n');

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
    `SUMMARY:${escapar(`Prova Vestibular Vidal (entre ${minutosAntes} min antes)`)}`,
    `DESCRIPTION:${escapar(detalhesAgenda(i))}`,
    `URL:${linkAreaCandidato}`,
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
    'BEGIN:VALARM',
    `TRIGGER:-PT${minutosAntes}M`,
    'ACTION:DISPLAY',
    'DESCRIPTION:Entre agora com seu CPF e código para liberar a prova',
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
    text: `Prova Vestibular Vidal (entre ${minutosAntes} min antes)`,
    dates: `${utc(horario.inicio)}/${utc(horario.fim)}`,
    details: detalhesAgenda(i),
  });
  return `https://calendar.google.com/calendar/render?${params}`;
};

// Botões grandes e coloridos, cada um com a cor e o ícone do destino; 2 por linha também no celular
const botao =
  'flex min-h-[64px] flex-col items-center justify-center gap-1.5 rounded-2xl px-3 py-3 text-center text-[14px] leading-tight font-bold transition-transform active:scale-[0.97] sm:flex-row sm:gap-2.5 sm:text-[15px]';

const IconeWhatsApp = () => (
  <svg aria-hidden viewBox="0 0 24 24" className="size-6 shrink-0" fill="currentColor">
    <path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2Zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8s-.4-.1-.6.1-.7.8-.8 1-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.3-.4.7-1.3a.5.5 0 0 0 0-.5l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.7 11.8 11.8 0 0 0 4.5 4c1.7.7 2.3.8 3.2.6a2.7 2.7 0 0 0 1.8-1.2 2.2 2.2 0 0 0 .1-1.3c0-.1-.2-.2-.4-.3Z" />
  </svg>
);

const IconeCalendario = () => (
  <svg aria-hidden viewBox="0 0 24 24" className="size-6 shrink-0" fill="none" stroke="currentColor" strokeWidth={2}>
    <rect x="3" y="5" width="18" height="16" rx="3" />
    <path d="M3 10h18M8 3v4M16 3v4" strokeLinecap="round" />
    <path d="M12 13v5M9.5 15.5h5" strokeLinecap="round" />
  </svg>
);

const IconeGoogle = () => (
  <svg aria-hidden viewBox="0 0 24 24" className="size-6 shrink-0">
    <path
      fill="#4285F4"
      d="M22.5 12.2c0-.8-.1-1.5-.2-2.2H12v4.2h5.9a5 5 0 0 1-2.2 3.3v2.7h3.5c2.1-1.9 3.3-4.7 3.3-8Z"
    />
    <path
      fill="#34A853"
      d="M12 23c3 0 5.5-1 7.3-2.7l-3.5-2.7c-1 .7-2.3 1.1-3.8 1.1-2.9 0-5.4-2-6.3-4.6H2.1v2.8A11 11 0 0 0 12 23Z"
    />
    <path fill="#FBBC05" d="M5.7 14.1a6.6 6.6 0 0 1 0-4.2V7.1H2.1a11 11 0 0 0 0 9.8l3.6-2.8Z" />
    <path fill="#EA4335" d="M12 5.4c1.6 0 3.1.6 4.2 1.7l3.2-3.2A11 11 0 0 0 2.1 7.1l3.6 2.8C6.6 7.4 9.1 5.4 12 5.4Z" />
  </svg>
);

const IconePdf = () => (
  <svg aria-hidden viewBox="0 0 24 24" className="size-6 shrink-0" fill="none" stroke="currentColor" strokeWidth={2}>
    <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8l-5-5Z" strokeLinejoin="round" />
    <path d="M14 3v5h5M12 11v6M9.5 14.5 12 17l2.5-2.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const SalvarInscricao = ({ inscricao }: { inscricao: InscricaoConfirmada }) => {
  const temProva = !!inicioFim(inscricao);
  return (
    <div className="space-y-3 print:hidden">
      <p className="font-chamada text-vest-navy text-center text-[22px]">Guarde seu código</p>
      <div className="grid grid-cols-2 gap-3">
        <a
          href={`https://wa.me/55${inscricao.celular}?text=${encodeURIComponent(mensagem(inscricao))}`}
          target="_blank"
          rel="noopener"
          className={`${botao} bg-[#25D366] text-white hover:bg-[#1ebe5a]`}>
          <IconeWhatsApp />
          Enviar para meu WhatsApp
        </a>
        {temProva && (
          <button
            type="button"
            onClick={() => baixarIcs(inscricao)}
            className={`${botao} bg-vest-blue hover:bg-vest-navy cursor-pointer text-white`}>
            <IconeCalendario />
            Pôr na agenda do celular
          </button>
        )}
        {temProva && (
          <a
            href={linkGoogle(inscricao)}
            target="_blank"
            rel="noopener"
            className={`${botao} border-stroke-3 text-secondary border-2 bg-white hover:border-[#4285F4]`}>
            <IconeGoogle />
            Google Agenda
          </a>
        )}
        <button
          type="button"
          onClick={() => window.print()}
          className={`${botao} cursor-pointer bg-[#D93025] text-white hover:bg-[#B3261E]`}>
          <IconePdf />
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

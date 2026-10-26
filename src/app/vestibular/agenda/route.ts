import { diasProva, horariosProva, linkAreaCandidato, minutosAntes } from '@/data/inscricao';
import { vestibular } from '@/data/vestibular';
import { NextResponse } from 'next/server';

// Botão "Salvar no Google Agenda" dos e-mails: o link aponta para o nosso domínio (o Resend alerta quando o e-mail
// tem links de outro domínio) e daqui vai para o Google Agenda. A URL do Google é montada só a partir do dia e do
// horário da prova, validados contra a lista oficial, então não dá para usar esta rota como redirecionamento aberto.

export function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const dia = params.get('dia') ?? '';
  const hora = params.get('hora') ?? '';
  if (!diasProva.some((d) => d.id === dia) || !horariosProva.includes(hora)) {
    return NextResponse.redirect(new URL('/vestibular/minha-inscricao', request.url));
  }
  const inicio = new Date(`${dia}T${hora}:00-03:00`);
  const fim = new Date(inicio.getTime() + vestibular.duracaoHoras * 60 * 60 * 1000);
  const utc = (d: Date) =>
    d
      .toISOString()
      .replace(/[-:]/g, '')
      .replace(/\.\d{3}/, '');
  const google = new URLSearchParams({
    action: 'TEMPLATE',
    text: `Prova · ${vestibular.nome}`,
    dates: `${utc(inicio)}/${utc(fim)}`,
    details: `Entre em ${linkAreaCandidato} com seu CPF e o código de acesso (está no e-mail de confirmação), ${minutosAntes} minutos antes.`,
    location: linkAreaCandidato,
  });
  return NextResponse.redirect(`https://calendar.google.com/calendar/render?${google}`);
}

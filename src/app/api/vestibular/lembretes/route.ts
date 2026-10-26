import { diaLembrete } from '@/data/inscricao';
import { enviarLembretes, hojeBrasilia } from '@/utils/vestibular/lembretes';
import { timingSafeEqual } from 'node:crypto';
import { NextResponse } from 'next/server';

// Lembrete da prova, chamado pelo cron da Vercel (vercel.json: 19/11 às 13:00 UTC = 10h de Brasília).
// A Vercel manda "Authorization: Bearer <CRON_SECRET>"; sem a variável, a rota fica fechada.
// Só envia no dia do lembrete; ?forcar=1 envia em outro dia (reenvio manual com o segredo).

export const maxDuration = 300;

const autorizado = (request: Request) => {
  const segredo = process.env.CRON_SECRET;
  if (!segredo) {
    return false;
  }
  const certo = Buffer.from(`Bearer ${segredo}`);
  const recebido = Buffer.from(request.headers.get('authorization') ?? '');
  return certo.length === recebido.length && timingSafeEqual(certo, recebido);
};

export async function GET(request: Request) {
  if (!autorizado(request)) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
  const forcar = new URL(request.url).searchParams.get('forcar') === '1';
  if (!forcar && hojeBrasilia() !== diaLembrete.id) {
    return NextResponse.json({ ok: true, mensagem: `O lembrete só sai em ${diaLembrete.rotulo}.` });
  }
  const resultado = await enviarLembretes();
  console.log('[vestibular lembrete]', JSON.stringify(resultado));
  return NextResponse.json({ ok: true, ...resultado });
}

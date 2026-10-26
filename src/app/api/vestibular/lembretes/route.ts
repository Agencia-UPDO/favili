import { diasProva } from '@/data/inscricao';
import { amanha, enviarLembretes } from '@/utils/vestibular/lembretes';
import { timingSafeEqual } from 'node:crypto';
import { NextResponse } from 'next/server';

// Lembrete da véspera da prova, chamado pelo cron da Vercel (vercel.json, 21:00 UTC = 18h de Brasília).
// A Vercel manda "Authorization: Bearer <CRON_SECRET>"; sem a variável, a rota fica fechada.
// ?dia=AAAA-MM-DD (um dos dias de prova) força o dia, para reenviar ou testar; sem ele, vale amanhã.

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
  const pedido = new URL(request.url).searchParams.get('dia');
  if (pedido && !diasProva.some((d) => d.id === pedido)) {
    return NextResponse.json({ ok: false, mensagem: 'Dia de prova inválido.' }, { status: 400 });
  }
  const dia = pedido ?? amanha();
  // Fora da véspera de um dia de prova não há o que enviar
  if (!diasProva.some((d) => d.id === dia)) {
    return NextResponse.json({ ok: true, dia, pendentes: 0, enviados: 0, falhas: 0, restantes: 0 });
  }
  const resultado = await enviarLembretes(dia);
  console.log('[vestibular lembrete]', JSON.stringify(resultado));
  return NextResponse.json({ ok: true, ...resultado });
}

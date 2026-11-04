import { processarLote, resumoFila, lerFila } from '@/utils/vestibular/filaSei';
import { timingSafeEqual } from 'node:crypto';
import { NextResponse } from 'next/server';

// Fila de avisos das inscrições importadas do SEI (ver src/utils/vestibular/filaSei.ts): manda um lote se estiver no
// horário e já tiver passado o intervalo. Chamada pelo cron da Vercel a cada 10 minutos (vercel.json, plano Pro); o
// ritmo real (lote, intervalo, horário, pausa) é o configurado no painel. O botão do painel faz o mesmo na hora.
// Exige "Authorization: Bearer <CRON_SECRET>"; sem a variável, a rota fica fechada.

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
  const lote = await processarLote({ automatico: true });
  const fila = resumoFila(await lerFila());
  // Só contagens no log
  console.log(
    '[vestibular fila-sei]',
    JSON.stringify({ ...lote, pendentes: fila.pendentes, erros: fila.erros.length }),
  );
  return NextResponse.json({ ok: true, ...lote, pendentes: fila.pendentes });
}

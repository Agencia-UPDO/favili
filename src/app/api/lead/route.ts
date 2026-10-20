import { NextResponse } from 'next/server';

// TODO: enviar a confirmação de presença para o destino definido (RD Station ou planilha).
export async function POST(request: Request) {
  const lead = await request.json();
  if (!lead?.nome || !lead?.whatsapp || !lead?.email) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
  console.log('[lead empreend-2026]', lead);
  return NextResponse.json({ ok: true });
}

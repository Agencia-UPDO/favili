import { NextResponse } from 'next/server';

// Envia a confirmação de presença para a RD Station Marketing como uma conversão.
// Usa o token público da conta (RD Station → Perfil da conta → Integrações → Chave de API, "token público").
// Variáveis de ambiente: ver .env.example.
const RD_ENDPOINT = 'https://api.rd.services/platform/conversions';

interface Lead {
  nome?: string;
  whatsapp?: string;
  email?: string;
  perfil?: string;
  origem?: string;
}

// "Aluno(a) da Vidal" → "aluno-a-da-vidal" (as tags da RD aceitam só minúsculas, números e hífens)
const slug = (texto: string) =>
  texto
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

// "(88) 90000-0000" → "+55 88 90000-0000"
const telefoneRd = (telefone: string) => {
  const digitos = telefone.replace(/\D/g, '');
  return `+55 ${digitos.slice(0, 2)} ${digitos.slice(2, -4)}-${digitos.slice(-4)}`;
};

export async function POST(request: Request) {
  const lead: Lead = await request.json().catch(() => ({}));
  if (!lead?.nome || !lead?.whatsapp || !lead?.email) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const apiKey = process.env.RDSTATION_API_KEY;
  if (!apiKey) {
    // Sem token, o lead fica só no log (como antes da integração) e o formulário segue funcionando.
    console.error('[lead empreend-2026] RDSTATION_API_KEY não definida; lead não enviado à RD', lead);
    return NextResponse.json({ ok: true });
  }

  const origem = lead.origem || 'empreend-2026';
  const payload: Record<string, unknown> = {
    conversion_identifier: process.env.RDSTATION_CONVERSION_IDENTIFIER || origem,
    email: lead.email,
    name: lead.nome,
    mobile_phone: telefoneRd(lead.whatsapp),
    tags: [slug(origem), ...(lead.perfil ? [slug(lead.perfil)] : [])],
    traffic_source: origem,
    // O formulário exige o aceite do termo de contato por WhatsApp e e-mail
    legal_bases: [{ category: 'communications', type: 'consent', status: 'granted' }],
  };
  // Campo personalizado "Você é" na RD (texto aberto)
  if (lead.perfil) {
    payload.cf_voce_e = lead.perfil;
  }

  try {
    const res = await fetch(`${RD_ENDPOINT}?api_key=${encodeURIComponent(apiKey)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ event_type: 'CONVERSION', event_family: 'CDP', payload }),
    });
    if (!res.ok) {
      console.error('[lead empreend-2026] RD Station respondeu', res.status, await res.text());
      return NextResponse.json({ ok: false }, { status: 502 });
    }
  } catch (erro) {
    console.error('[lead empreend-2026] falha ao chamar a RD Station', erro);
    return NextResponse.json({ ok: false }, { status: 502 });
  }

  return NextResponse.json({ ok: true });
}

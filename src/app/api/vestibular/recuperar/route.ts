import { instituicao } from '@/data/vestibular';
import { emailConfigurado, enviarCodigo, mascararEmail } from '@/utils/vestibular/email';
import { buscarPorCpf } from '@/utils/vestibular/inscricoes';
import { bloqueado, ipDe, limites, registrarErro, umaHora } from '@/utils/vestibular/limite';
import { cpfValido, soDigitos } from '@/utils/vestibular/validacao';
import { NextResponse } from 'next/server';

// "Esqueci meu código": o candidato informa o CPF e o código vai SÓ para o e-mail cadastrado (nunca por WhatsApp).
// Limite: 3 pedidos por CPF e 10 por IP em 1 hora (contados todos, não só os errados).
// Sem e-mail configurado (RESEND_API_KEY), orienta a falar com a secretaria.

const secretaria = `Fale com a Faculdade Vidal pelo ${instituicao.telefone} com o seu CPF em mãos.`;

export async function POST(request: Request) {
  const corpo = await request.json().catch(() => ({}));
  const cpf = soDigitos(typeof corpo.cpf === 'string' ? corpo.cpf : '');
  if (!cpfValido(cpf)) {
    return NextResponse.json({ ok: false, mensagem: 'Confira o CPF.' }, { status: 400 });
  }
  if (!emailConfigurado()) {
    return NextResponse.json({ ok: true, semEmail: true, mensagem: secretaria });
  }

  const chaves = {
    [`recuperar-cpf:${cpf}`]: limites.recuperarCpf,
    [`recuperar-ip:${ipDe(request)}`]: limites.recuperarIp,
  };
  if (await bloqueado(chaves, umaHora)) {
    return NextResponse.json(
      {
        ok: false,
        mensagem: `Você já pediu o código algumas vezes. Confira seu e-mail (e o spam). Se não chegou: ${secretaria}`,
      },
      { status: 429 },
    );
  }
  await registrarErro(Object.keys(chaves));

  const inscricao = await buscarPorCpf(cpf);
  const enviado = inscricao ? await enviarCodigo(inscricao) : false;
  if (inscricao && !enviado) {
    return NextResponse.json(
      { ok: false, mensagem: `Não conseguimos enviar o e-mail agora. ${secretaria}` },
      { status: 502 },
    );
  }
  // Mesma resposta exista ou não a inscrição; com inscrição, mostra o e-mail mascarado para a pessoa saber onde olhar
  return NextResponse.json({
    ok: true,
    mensagem: `Se houver inscrição com este CPF, enviamos o código para o e-mail cadastrado${
      inscricao ? `: ${mascararEmail(inscricao.email)}` : ''
    }. Confira também a caixa de spam.`,
  });
}

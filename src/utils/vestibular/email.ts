import 'server-only';

import {
  avisoEntrada,
  avisoFim,
  diasProva,
  fusoHorario,
  linkAreaCandidato,
  nomeOferta,
  ofertas,
} from '@/data/inscricao';
import { instituicao, vestibular } from '@/data/vestibular';
import { Inscricao } from './inscricoes';

// E-mails do vestibular pelo Resend (https://resend.com). Precisa de RESEND_API_KEY e VESTIBULAR_EMAIL_REMETENTE
// (ex.: "Vestibular Vidal <vestibular@favili.com.br>", com o domínio verificado no Resend). Sem elas, nada é enviado
// e o site orienta a falar com a secretaria. O e-mail de confirmação da inscrição só sai com
// VESTIBULAR_EMAIL_CONFIRMACAO=1 (pronto, mas desligado até a faculdade decidir).

export const emailConfigurado = () => !!process.env.RESEND_API_KEY && !!process.env.VESTIBULAR_EMAIL_REMETENTE;
export const confirmacaoLigada = () => emailConfigurado() && process.env.VESTIBULAR_EMAIL_CONFIRMACAO === '1';

// "rodrigo@gmail.com" → "r•••••o@gmail.com"
export const mascararEmail = (email: string) => {
  const [usuario, dominio] = email.split('@');
  if (!dominio) {
    return '';
  }
  const meio = usuario.length > 2 ? '•'.repeat(Math.min(usuario.length - 2, 5)) : '';
  return `${usuario[0]}${meio}${usuario.length > 1 ? usuario.at(-1) : ''}@${dominio}`;
};

const escapar = (t: string) => t.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

const enviar = async (para: string, assunto: string, html: string, texto: string) => {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: process.env.VESTIBULAR_EMAIL_REMETENTE,
      to: [para],
      subject: assunto,
      html,
      text: texto,
    }),
  });
  if (!res.ok) {
    // Sem dados do candidato no log
    console.error('[vestibular email] Resend respondeu', res.status);
    return false;
  }
  return true;
};

// Linhas comuns: código, curso e, se faz prova, dia, horário e aviso de entrar 15 minutos antes
const detalhes = (i: Inscricao) => {
  const oferta = ofertas.find((o) => o.id === i.oferta_id);
  const dia = diasProva.find((d) => d.id === i.dia_prova)?.rotulo;
  const hora = i.hora_prova?.slice(0, 5);
  return [
    oferta ? `Curso: ${nomeOferta(oferta)}` : '',
    `Inscrição nº ${i.numero}`,
    i.faz_prova && dia && hora ? `Prova: ${dia}, às ${hora.replace(':00', 'h')} (${fusoHorario})` : '',
    i.faz_prova && hora ? avisoEntrada(hora) : '',
    i.faz_prova && hora ? avisoFim(hora) : '',
  ].filter(Boolean);
};

const modelo = (titulo: string, i: Inscricao, chamada: string) => {
  const linhas = detalhes(i);
  const html = `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head><body style="margin:0;background:#eef3fb;font-family:Arial,Helvetica,sans-serif;color:#0b1f4d">
<div style="max-width:520px;margin:0 auto;padding:24px 16px">
  <div style="background:#062a6e;border-radius:20px;padding:28px 24px;color:#fff;text-align:center">
    <p style="margin:0;font-size:13px;letter-spacing:3px;text-transform:uppercase;color:#45d3ff">${escapar(vestibular.nome)}</p>
    <h1 style="margin:10px 0 0;font-size:24px">${escapar(titulo)}</h1>
  </div>
  <div style="background:#fff;border-radius:20px;padding:24px;margin-top:12px">
    <p style="margin:0 0 12px">Olá, ${escapar(i.nome.split(' ')[0])}! ${escapar(chamada)}</p>
    <p style="margin:0 0 4px;font-size:13px;color:#5b6b8c">Seu código de acesso</p>
    <p style="margin:0 0 16px;font-size:34px;font-weight:bold;letter-spacing:6px">${escapar(i.codigo)}</p>
    ${linhas.map((l) => `<p style="margin:0 0 6px;font-size:15px">${escapar(l)}</p>`).join('')}
    <p style="margin:18px 0"><a href="${linkAreaCandidato}" style="display:inline-block;background:#ffd21f;color:#062a6e;font-weight:bold;text-decoration:none;padding:12px 22px;border-radius:999px">Entrar em Minha inscrição</a></p>
    <p style="margin:0;font-size:13px;color:#5b6b8c">Entre com o seu CPF e este código. Não compartilhe o código com ninguém.</p>
  </div>
  <p style="font-size:12px;color:#5b6b8c;text-align:center">${escapar(instituicao.nome)} · ${escapar(instituicao.telefone)}<br>Se você não pediu este e-mail, pode ignorar.</p>
</div></body></html>`;
  const texto = [
    `${vestibular.nome}: ${titulo}`,
    `Olá, ${i.nome.split(' ')[0]}! ${chamada}`,
    `Seu código de acesso: ${i.codigo}`,
    ...linhas,
    `Minha inscrição: ${linkAreaCandidato}`,
    `Dúvidas: ${instituicao.telefone}`,
  ].join('\n');
  return { html, texto };
};

export const enviarCodigo = (i: Inscricao) => {
  const { html, texto } = modelo('Seu código de acesso', i, 'Você pediu o código da sua inscrição.');
  return enviar(i.email, `Seu código de acesso · ${vestibular.nome}`, html, texto);
};

export const enviarConfirmacao = (i: Inscricao) => {
  const { html, texto } = modelo('Inscrição confirmada', i, 'Sua inscrição está confirmada.');
  return enviar(i.email, `Inscrição confirmada · ${vestibular.nome}`, html, texto);
};

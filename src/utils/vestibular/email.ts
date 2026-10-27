import 'server-only';

import {
  avisoFim,
  diasProva,
  documentoPorForma,
  fusoHorario,
  horaDeEntrar,
  linkAreaCandidato,
  minutosAntes,
  nomeOferta,
  ofertas,
} from '@/data/inscricao';
import { FormaId, formas, instituicao, vestibular } from '@/data/vestibular';
import { Inscricao } from './inscricoes';

// E-mails do vestibular pelo Resend (https://resend.com): confirmação da inscrição e "Esqueci meu código".
// Precisa de RESEND_API_KEY e VESTIBULAR_EMAIL_REMETENTE (ex.: "Vestibular Vidal <vestibular@materiais.favili.com.br>",
// com o domínio verificado no Resend). Sem elas, nada é enviado e o site orienta a falar com a secretaria.
// As respostas vão para a secretaria (VESTIBULAR_EMAIL_RESPONDER_PARA troca o endereço). A confirmação sai sempre
// que o e-mail está configurado; VESTIBULAR_EMAIL_CONFIRMACAO=0 desliga só ela.
// Layout em tabelas com CSS inline e largura de 600px, para funcionar no Gmail, no Outlook e no celular.

const responderPara = () => process.env.VESTIBULAR_EMAIL_RESPONDER_PARA || 'atendimento01@favili.com.br';
const logo = `${vestibular.site}/images/vestibular/logo-vidal.png`;

export const emailConfigurado = () => !!process.env.RESEND_API_KEY && !!process.env.VESTIBULAR_EMAIL_REMETENTE;
export const confirmacaoLigada = () => emailConfigurado() && process.env.VESTIBULAR_EMAIL_CONFIRMACAO !== '0';

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
      reply_to: responderPara(),
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

// ---------- Conteúdo ----------
type Dados = {
  primeiroNome: string;
  numero: number;
  codigo: string;
  curso: string;
  forma: string;
  prova: { quando: string; entrar: string; fim: string; agenda: string } | null;
  documento: string | null;
};

// Botão de agenda: rota do nosso domínio que redireciona para o Google Agenda (src/app/vestibular/agenda/route.ts)
const linkAgenda = (i: Inscricao) =>
  `${vestibular.site}/vestibular/agenda?${new URLSearchParams({ dia: i.dia_prova ?? '', hora: i.hora_prova?.slice(0, 5) ?? '' })}`;

const dados = (i: Inscricao): Dados => {
  const oferta = ofertas.find((o) => o.id === i.oferta_id);
  const dia = diasProva.find((d) => d.id === i.dia_prova)?.rotulo;
  const hora = i.hora_prova?.slice(0, 5);
  return {
    primeiroNome: i.nome.split(' ')[0],
    numero: i.numero,
    codigo: i.codigo,
    curso: oferta ? nomeOferta(oferta) : '',
    forma: formas.find((f) => f.id === i.forma)?.rotulo ?? '',
    prova:
      i.faz_prova && dia && hora
        ? {
            quando: `${dia}, às ${hora.replace(':00', 'h')} (${fusoHorario})`,
            entrar: `Entre às ${horaDeEntrar(hora)}, ${minutosAntes} minutos antes, para liberar a prova.`,
            fim: avisoFim(hora),
            agenda: linkAgenda(i),
          }
        : null,
    documento: documentoPorForma[i.forma as FormaId] ?? null,
  };
};

// ---------- Layout (tabelas + CSS inline) ----------
const fonte = "font-family:Arial,'Helvetica Neue',Helvetica,sans-serif;";
const azul = '#062a6e';
const azulClaro = '#0d5fd1';
const amarelo = '#ffd21f';
const cinza = '#5b6b8c';

// Com link: o valor vira link próprio (o Gmail e o iPhone transformavam o nº de inscrição em telefone)
const linha = (rotulo: string, valor: string, link?: string) => `
<tr>
  <td style="${fonte}padding:8px 0;border-bottom:1px solid #e6ecf5;font-size:13px;color:${cinza};width:38%;vertical-align:top">${escapar(rotulo)}</td>
  <td style="${fonte}padding:8px 0;border-bottom:1px solid #e6ecf5;font-size:15px;color:${azul};font-weight:bold;vertical-align:top">${
    link
      ? `<a href="${link}" target="_blank" style="color:${azul};text-decoration:underline">${escapar(valor)}</a>`
      : escapar(valor)
  }</td>
</tr>`;

const botao = (href: string, texto: string, fundo: string, cor: string) => `
<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 auto">
  <tr><td align="center" bgcolor="${fundo}" style="border-radius:999px">
    <a href="${href}" target="_blank" style="${fonte}display:inline-block;padding:14px 28px;font-size:16px;font-weight:bold;color:${cor};text-decoration:none;border-radius:999px">${escapar(texto)}</a>
  </td></tr>
</table>`;

const aviso = (titulo: string, texto: string) => `
<tr><td style="padding:0 32px 20px">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#fff8d6;border-radius:14px">
    <tr><td style="${fonte}padding:16px 18px;font-size:14px;line-height:20px;color:${azul}">
      <strong>${escapar(titulo)}</strong><br>${escapar(texto)}
    </td></tr>
  </table>
</td></tr>`;

// Bloco extra (resultado): título, parágrafos e lista, em HTML e texto
type Bloco = { titulo: string; paragrafos: string[]; lista?: string[] };

const blocoHtml = (b: Bloco) => `
<tr><td style="padding:0 32px 20px">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f2f6fd;border-radius:14px">
    <tr><td style="${fonte}padding:16px 18px;font-size:14px;line-height:21px;color:${azul}">
      <strong style="font-size:15px">${escapar(b.titulo)}</strong>
      ${b.paragrafos.map((p) => `<p style="margin:8px 0 0">${escapar(p)}</p>`).join('')}
      ${b.lista ? `<ul style="margin:8px 0 0;padding-left:18px">${b.lista.map((l) => `<li style="margin:2px 0">${escapar(l)}</li>`).join('')}</ul>` : ''}
    </td></tr>
  </table>
</td></tr>`;

const blocoTexto = (b: Bloco) => [b.titulo, ...b.paragrafos, ...(b.lista ?? []).map((l) => `- ${l}`)].join('\n');

const montar = (opcoes: {
  preheader: string;
  titulo: string;
  abertura: string;
  d: Dados;
  confirmacao: boolean;
  // Resultado: sem a linha da prova, com linhas e blocos a mais
  semProva?: boolean;
  linhasExtras?: [string, string][];
  blocos?: Bloco[];
}) => {
  const { d } = opcoes;
  const prova = opcoes.semProva ? null : d.prova;
  const linhas = [
    linha('Inscrição nº', String(d.numero), linkAreaCandidato),
    d.curso ? linha('Curso', d.curso) : '',
    ...(opcoes.linhasExtras ?? []).map(([rotulo, valor]) => linha(rotulo, valor)),
    opcoes.confirmacao && d.forma ? linha('Forma de ingresso', d.forma) : '',
    prova ? linha('Prova on-line', prova.quando) : '',
  ].join('');

  const html = `<!doctype html>
<html lang="pt-BR"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="x-apple-disable-message-reformatting"><meta name="format-detection" content="telephone=no,date=no,address=no,email=no">
<style>a[x-apple-data-detectors]{color:inherit!important;text-decoration:none!important;font-size:inherit!important;font-family:inherit!important;font-weight:inherit!important;line-height:inherit!important}u+#corpo a{color:inherit;text-decoration:none}</style><title>${escapar(opcoes.titulo)}</title>
</head>
<body id="corpo" style="margin:0;padding:0;background:#eef3fb">
<div style="display:none;max-height:0;overflow:hidden;opacity:0">${escapar(opcoes.preheader)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#eef3fb">
<tr><td align="center" style="padding:24px 12px">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:600px;background:#ffffff;border-radius:20px;overflow:hidden">

  <tr><td align="center" bgcolor="${azul}" style="background:${azul};background-image:linear-gradient(160deg,${azulClaro},${azul});padding:28px 24px 30px">
    <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr><td bgcolor="#ffffff" style="border-radius:14px;padding:8px 14px">
      <img src="${logo}" width="58" height="62" alt="Faculdade Vidal" style="display:block;border:0;width:58px;height:auto">
    </td></tr></table>
    <p style="${fonte}margin:18px 0 0;font-size:12px;letter-spacing:3px;text-transform:uppercase;color:#45d3ff;font-weight:bold">${escapar(vestibular.nome)}</p>
    <h1 style="${fonte}margin:8px 0 0;font-size:26px;line-height:32px;color:#ffffff;font-weight:bold">${escapar(opcoes.titulo)}</h1>
  </td></tr>

  <tr><td style="${fonte}padding:28px 32px 8px;font-size:16px;line-height:24px;color:${azul}">
    Olá, <strong>${escapar(d.primeiroNome)}</strong>! ${escapar(opcoes.abertura)}
  </td></tr>

  <tr><td align="center" style="padding:16px 32px 8px">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f2f6fd;border:2px dashed ${azulClaro};border-radius:16px">
      <tr><td align="center" style="${fonte}padding:18px 12px">
        <p style="margin:0;font-size:12px;letter-spacing:2px;text-transform:uppercase;color:${cinza}">Seu código de acesso</p>
        <p style="margin:6px 0 0;font-family:'Courier New',Courier,monospace;font-size:38px;line-height:44px;letter-spacing:8px;font-weight:bold;color:${azul}">${escapar(d.codigo)}</p>
        <p style="margin:6px 0 0;font-size:12px;color:${cinza}">Use com o seu CPF para entrar em Minha inscrição.</p>
      </td></tr>
    </table>
  </td></tr>

  <tr><td style="padding:16px 32px 8px">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">${linhas}</table>
  </td></tr>

  ${
    prova
      ? `<tr><td style="${fonte}padding:12px 32px 20px;font-size:14px;line-height:21px;color:${azul}">
    ⏰ ${escapar(prova.entrar)}<br>⌛ ${escapar(prova.fim)}
  </td></tr>`
      : '<tr><td style="padding:0 0 12px"></td></tr>'
  }

  ${(opcoes.blocos ?? []).map(blocoHtml).join('')}

  ${
    opcoes.confirmacao && d.documento
      ? aviso(
          'Último passo: envie seu documento',
          `Entre em Minha inscrição e envie ${d.documento} (foto ou PDF), até 20/11 às 18h. A aprovação acontece depois da conferência.`,
        )
      : ''
  }

  <tr><td align="center" style="padding:4px 32px 12px">${botao(linkAreaCandidato, 'Entrar em Minha inscrição', amarelo, azul)}</td></tr>
  ${
    opcoes.confirmacao && d.prova
      ? `<tr><td align="center" style="padding:0 32px 24px">${botao(d.prova.agenda, 'Salvar no Google Agenda', '#ffffff', azulClaro).replace('border-radius:999px">', `border-radius:999px;border:2px solid ${azulClaro}">`)}</td></tr>`
      : '<tr><td style="padding:0 0 12px"></td></tr>'
  }

  <tr><td style="${fonte}padding:18px 32px;background:#f6f8fc;font-size:12px;line-height:18px;color:${cinza}">
    🔒 <strong>Não compartilhe seu código</strong>: com ele e o seu CPF é possível entrar na sua inscrição e fazer a prova.<br>
    Dúvidas? Responda este e-mail ou ligue ${escapar(instituicao.telefone)}.<br><br>
    ${escapar(instituicao.nome)}<br>${escapar(instituicao.endereco)}
  </td></tr>
</table>
<p style="${fonte}margin:14px 0 0;font-size:11px;color:${cinza}">Você recebeu este e-mail porque se inscreveu no ${escapar(vestibular.nome)}.</p>
</td></tr>
</table>
</body></html>`;

  const texto = [
    `${vestibular.nome}: ${opcoes.titulo}`,
    '',
    `Olá, ${d.primeiroNome}! ${opcoes.abertura}`,
    '',
    `Seu código de acesso: ${d.codigo}`,
    `Inscrição nº ${d.numero}`,
    d.curso ? `Curso: ${d.curso}` : '',
    ...(opcoes.linhasExtras ?? []).map(([rotulo, valor]) => `${rotulo}: ${valor}`),
    opcoes.confirmacao && d.forma ? `Forma de ingresso: ${d.forma}` : '',
    prova ? `Prova on-line: ${prova.quando}` : '',
    prova ? prova.entrar : '',
    prova ? prova.fim : '',
    ...(opcoes.blocos ?? []).flatMap((b) => ['', blocoTexto(b)]),
    opcoes.confirmacao && d.documento ? `Último passo: envie ${d.documento} em Minha inscrição, até 20/11 às 18h.` : '',
    '',
    `Minha inscrição: ${linkAreaCandidato}`,
    opcoes.confirmacao && d.prova ? `Salvar no Google Agenda: ${d.prova.agenda}` : '',
    '',
    'Não compartilhe seu código: com ele e o seu CPF é possível entrar na sua inscrição.',
    `Dúvidas? Responda este e-mail ou ligue (88) 3423-6090.`,
    `${instituicao.nome} · ${instituicao.endereco}`,
  ]
    .filter((l, idx, todas) => l !== '' || todas[idx - 1] !== '')
    .join('\n');

  return { html, texto };
};

// ---------- E-mails ----------
export const emailCodigo = (i: Inscricao) =>
  montar({
    preheader: `Seu código de acesso: ${i.codigo}`,
    titulo: 'Seu código de acesso',
    abertura: 'Você pediu o código da sua inscrição. Aqui está:',
    d: dados(i),
    confirmacao: false,
  });

export const emailConfirmacao = (i: Inscricao) =>
  montar({
    preheader: `Inscrição nº ${i.numero} confirmada. Guarde seu código: ${i.codigo}`,
    titulo: 'Inscrição confirmada!',
    abertura: `Você está no ${vestibular.nome}. Guarde este e-mail: ele tem tudo o que você precisa.`,
    d: dados(i),
    confirmacao: true,
  });

export const emailAtualizacao = (i: Inscricao) =>
  montar({
    preheader: `Sua inscrição nº ${i.numero} foi atualizada. Confira os dados novos.`,
    titulo: 'Sua inscrição foi atualizada',
    abertura:
      'Houve uma alteração na sua inscrição (código de acesso ou dia e horário da prova). Estes são os dados que valem agora:',
    d: dados(i),
    confirmacao: true,
  });

// Lembrete da prova em 19/11 (cron /api/vestibular/lembretes): dia, hora, regra das 2h, link e código
export const emailLembrete = (i: Inscricao) =>
  montar({
    preheader: `Sua prova on-line está chegando. Entre com seu CPF e o código ${i.codigo}.`,
    titulo: 'Sua prova está chegando',
    abertura:
      'Falta pouco para a sua prova on-line. No dia e horário abaixo, entre em Minha inscrição com o seu CPF e este código para liberar a prova:',
    d: dados(i),
    confirmacao: false,
  });

export const enviarLembrete = (i: Inscricao) => {
  const { html, texto } = emailLembrete(i);
  return enviar(i.email, `Lembrete: sua prova está chegando · ${vestibular.nome}`, html, texto).catch(() => false);
};

// ---------- Resultado (só aprovados; enviado pelo painel depois de publicar) ----------
// Regras do regulamento 2027.1: matrícula dos contemplados de 24/11 a 04/12/2026 (Art. 26), sob pena de perder a bolsa
// (Art. 27); documentos do Art. 28; bolsas parciais pagam R$ 150,00 de matrícula e ganham a 1ª mensalidade
// (Arts. 30 e 32); a de 100% é isenta (Art. 31). Aprovado sem bolsa: 40% de desconto da campanha. Nunca mostra nota.
const documentosMatricula = [
  'Histórico Escolar do Ensino Médio',
  'Certificado de Conclusão do Ensino Médio',
  'Documento oficial de identidade e CPF',
  'Título de Eleitor e comprovante de quitação eleitoral, quando aplicável',
  'Comprovante de residência',
  'Certidão de nascimento ou casamento',
  'Certificado de Reservista, quando aplicável',
];

export const emailResultado = (i: Inscricao, bolsa: number | null) => {
  const turno = ofertas.find((o) => o.id === i.oferta_id)?.turno ?? i.turno;
  const linhasExtras: [string, string][] = [
    ['Turno', turno],
    [
      'Resultado',
      bolsa ? `Aprovado com bolsa de ${bolsa}%` : `Aprovado com ${vestibular.descontoGarantido} de desconto`,
    ],
  ];
  const documentos: Bloco = {
    titulo: 'Documentos para a matrícula',
    paragrafos: ['Leve os documentos abaixo (Art. 28 do regulamento):'],
    lista: documentosMatricula,
  };
  if (bolsa) {
    const pagamento =
      bolsa === 100
        ? 'Com a bolsa de 100%, você está isento do pagamento da matrícula.'
        : `No ato da matrícula, você paga o valor promocional de R$ 150,00 e a mensalidade seguinte é grátis. A partir da 2ª mensalidade depois da matrícula, vale a sua bolsa de ${bolsa}%.`;
    return montar({
      preheader: `Parabéns! Você conquistou bolsa de ${bolsa}% no ${vestibular.nome}.`,
      titulo: `Parabéns! Bolsa de ${bolsa}%`,
      abertura: `Você foi aprovado no ${vestibular.nome} e conquistou uma bolsa de ${bolsa}% no curso abaixo.`,
      d: dados(i),
      confirmacao: false,
      semProva: true,
      linhasExtras,
      blocos: [
        {
          titulo: `Matrícula: de ${vestibular.matricula}`,
          paragrafos: [pagamento, 'Atenção: quem não fizer a matrícula dentro do prazo perde o direito à bolsa.'],
        },
        documentos,
      ],
    });
  }
  return montar({
    preheader: `Parabéns! Você foi aprovado no ${vestibular.nome}.`,
    titulo: 'Parabéns! Você foi aprovado',
    abertura: `Você foi aprovado no ${vestibular.nome} e garantiu ${vestibular.descontoGarantido} de desconto nas mensalidades do curso abaixo.`,
    d: dados(i),
    confirmacao: false,
    semProva: true,
    linhasExtras,
    blocos: [
      {
        titulo: 'Próximo passo: a matrícula',
        paragrafos: [
          `Fale com a Faculdade Vidal pelo ${instituicao.telefone} para fazer a sua matrícula com ${vestibular.descontoGarantido} de desconto.`,
        ],
      },
      documentos,
    ],
  });
};

export const enviarResultado = (i: Inscricao, bolsa: number | null) => {
  const { html, texto } = emailResultado(i, bolsa);
  const assunto = bolsa
    ? `Parabéns! Você conquistou bolsa de ${bolsa}% · ${vestibular.nome}`
    : `Parabéns! Você foi aprovado · ${vestibular.nome}`;
  return enviar(i.email, assunto, html, texto).catch(() => false);
};

// Depois de trocar o código (painel) ou o dia/horário (Minha inscrição); só se o e-mail estiver configurado
export const enviarAtualizacao = (i: Inscricao) => {
  if (!emailConfigurado()) {
    return Promise.resolve(false);
  }
  const { html, texto } = emailAtualizacao(i);
  return enviar(i.email, `Sua inscrição foi atualizada · ${vestibular.nome}`, html, texto).catch(() => false);
};

export const enviarCodigo = (i: Inscricao) => {
  const { html, texto } = emailCodigo(i);
  return enviar(i.email, `Seu código de acesso · ${vestibular.nome}`, html, texto);
};

export const enviarConfirmacao = (i: Inscricao) => {
  const { html, texto } = emailConfirmacao(i);
  return enviar(i.email, `Inscrição confirmada · ${vestibular.nome}`, html, texto);
};

import 'server-only';

import { emailConfigurado, enviarResultado } from './email';
import { atualizar, Inscricao, listarInscricoes } from './inscricoes';
import { enviarConversaoRd } from './rd';
import { resultadoPublicado } from './resultado';

// E-mail do resultado, enviado pela equipe no painel DEPOIS de publicar: só para os aprovados do resultado
// publicado (a bolsa vem dele, não da prévia). Cada envio marca resultado_email_em; o envio em lote pula quem já
// recebeu e o botão individual permite reenviar. Junto, a conversão "vestibular-2027-1-resultado" na RD (se a RD
// recusar, o e-mail vale do mesmo jeito).

export class ErroResultadoEmail extends Error {}

const aprovadosPublicados = async () => {
  const publicado = await resultadoPublicado();
  if (!publicado?.publicadoEm) {
    throw new ErroResultadoEmail('Publique o resultado antes de enviar os e-mails.');
  }
  return new Map(publicado.linhas.filter((l) => l.aprovado).map((l) => [l.numero, l.bolsa]));
};

const enviarUm = async (i: Inscricao, bolsa: number | null) => {
  if (!(await enviarResultado(i, bolsa))) {
    return false;
  }
  await enviarConversaoRd(i, 'resultado', {
    cf_vestibular_resultado: bolsa ? 'Aprovado com bolsa' : 'Aprovado 40%',
    cf_vestibular_bolsa: `${bolsa ?? 40}%`,
  });
  await atualizar(i, { resultado_email_em: new Date().toISOString() });
  return true;
};

export const enviarResultadoPara = async (numero: number) => {
  if (!emailConfigurado()) {
    throw new ErroResultadoEmail('E-mail não configurado (RESEND_API_KEY e VESTIBULAR_EMAIL_REMETENTE).');
  }
  const aprovados = await aprovadosPublicados();
  const inscricao = (await listarInscricoes()).find((i) => i.numero === numero);
  if (!inscricao || !aprovados.has(numero)) {
    throw new ErroResultadoEmail('Só aprovados do resultado publicado recebem este e-mail.');
  }
  if (!(await enviarUm(inscricao, aprovados.get(numero) ?? null))) {
    throw new ErroResultadoEmail('O Resend não aceitou o envio. Tente de novo em instantes.');
  }
};

// Aprovados do resultado publicado que ainda não receberam
export const pendentesResultado = async () => {
  const aprovados = await aprovadosPublicados();
  return (await listarInscricoes()).filter((i) => aprovados.has(i.numero) && !i.resultado_email_em);
};

// Lote: um a cada 600 ms (limite de 2/s do Resend), parando antes do limite da função; o que sobrar sai no próximo clique
export const enviarResultadoTodos = async () => {
  if (!emailConfigurado()) {
    throw new ErroResultadoEmail('E-mail não configurado (RESEND_API_KEY e VESTIBULAR_EMAIL_REMETENTE).');
  }
  const aprovados = await aprovadosPublicados();
  const lista = await pendentesResultado();
  const inicio = Date.now();
  let enviados = 0;
  let falhas = 0;
  let processados = 0;
  for (const i of lista) {
    if (Date.now() - inicio > 270_000) {
      break;
    }
    const volta = Date.now();
    processados++;
    try {
      if (await enviarUm(i, aprovados.get(i.numero) ?? null)) {
        enviados++;
      } else {
        falhas++;
      }
    } catch (e) {
      console.error('[vestibular resultado] falha na inscrição', i.numero, (e as Error).message);
      falhas++;
    }
    const espera = 600 - (Date.now() - volta);
    if (espera > 0) {
      await new Promise((r) => setTimeout(r, espera));
    }
  }
  return { pendentes: lista.length, enviados, falhas, restantes: lista.length - processados };
};

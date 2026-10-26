import 'server-only';

import { diasProva } from '@/data/inscricao';
import { emailConfigurado, enviarLembrete } from './email';
import { atualizar, listarParaLembrete } from './inscricoes';
import { enviarConversaoRd } from './rd';

// Lembrete da prova: e-mail (Resend, com o código) e conversão "vestibular-2027-1-lembrete" na RD (dispara o
// WhatsApp na Kommo, sem o código). Um envio só, em diaLembrete (19/11), para quem faz a prova em 21 ou 22/11:
// pelo cron da Vercel (/api/vestibular/lembretes) ou pelo botão do painel. Cada inscrição recebe uma vez por dia de
// prova (coluna lembrete_enviado_para); se o candidato trocar de dia depois, o botão do painel manda o do dia novo.

// Hoje no horário de Brasília (-03:00, sem horário de verão), em AAAA-MM-DD
export const hojeBrasilia = (agora = new Date()) =>
  new Date(agora.getTime() - 3 * 60 * 60 * 1000).toISOString().slice(0, 10);

// No máximo 2 envios por segundo no Resend: um candidato a cada 600 ms
const intervalo = 600;
// Para antes do limite da função na Vercel (maxDuration = 300 s); o que sobrar sai no próximo clique
const tempoMaximo = 270_000;

export type ResultadoLembretes = {
  pendentes: number;
  enviados: number;
  falhas: number;
  restantes: number;
};

export const pendentesLembrete = async () => (await Promise.all(diasProva.map((d) => listarParaLembrete(d.id)))).flat();

export const enviarLembretes = async (): Promise<ResultadoLembretes> => {
  const lista = await pendentesLembrete();
  const comEmail = emailConfigurado();
  const inicio = Date.now();
  let enviados = 0;
  let falhas = 0;
  let processados = 0;

  for (const i of lista) {
    if (Date.now() - inicio > tempoMaximo) {
      break;
    }
    const volta = Date.now();
    processados++;
    try {
      const [emailOk, rdOk] = await Promise.all([
        comEmail ? enviarLembrete(i) : Promise.resolve(false),
        enviarConversaoRd(i, 'lembrete'),
      ]);
      // Com e-mail configurado, só marca se o e-mail saiu (a próxima rodada tenta de novo); sem ele, vale a RD
      if (comEmail ? emailOk : rdOk) {
        await atualizar(i, { lembrete_enviado_para: i.dia_prova });
        enviados++;
      } else {
        falhas++;
      }
    } catch (e) {
      // Sem dados do candidato no log
      console.error('[vestibular lembrete] falha na inscrição', i.numero, (e as Error).message);
      falhas++;
    }
    const espera = intervalo - (Date.now() - volta);
    if (espera > 0) {
      await new Promise((r) => setTimeout(r, espera));
    }
  }

  return { pendentes: lista.length, enviados, falhas, restantes: lista.length - processados };
};

import 'server-only';

import { emailConfigurado, enviarLembrete } from './email';
import { atualizar, listarParaLembrete } from './inscricoes';
import { enviarConversaoRd } from './rd';

// Lembrete da véspera da prova: e-mail "Sua prova é amanhã" (Resend, com o código) e conversão
// "vestibular-2027-1-lembrete" na RD (dispara o WhatsApp na Kommo, sem o código). Roda pelo cron da Vercel
// (/api/vestibular/lembretes, 18h de Brasília) e pelo botão do painel. Cada inscrição recebe uma vez por dia de
// prova (coluna lembrete_enviado_para); se o candidato trocar de dia, sai o lembrete do dia novo.

// Dia seguinte no horário de Brasília (-03:00, sem horário de verão), em AAAA-MM-DD
export const amanha = (agora = new Date()) =>
  new Date(agora.getTime() - 3 * 60 * 60 * 1000 + 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

// No máximo 2 envios por segundo no Resend: um candidato a cada 600 ms
const intervalo = 600;
// Para antes do limite da função na Vercel (maxDuration = 300 s); o que sobrar sai no próximo clique ou execução
const tempoMaximo = 270_000;

export type ResultadoLembretes = {
  dia: string;
  pendentes: number;
  enviados: number;
  falhas: number;
  restantes: number;
};

export const enviarLembretes = async (dia: string): Promise<ResultadoLembretes> => {
  const lista = await listarParaLembrete(dia);
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
        await atualizar(i, { lembrete_enviado_para: dia });
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

  return { dia, pendentes: lista.length, enviados, falhas, restantes: lista.length - processados };
};

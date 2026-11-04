import 'server-only';

import { diaLembrete } from '@/data/inscricao';
import { emailConfigurado, enviarConfirmacao } from './email';
import { gravarConfig, Inscricao, lerConfig, listarInscricoes } from './inscricoes';
import { enviarConversaoRd } from './rd';

// Fila de avisos das inscrições importadas do SEI: e-mail de confirmação (com nº e código) e conversão de NOVA
// inscrição na RD (dispara o WhatsApp de boas-vindas na Kommo), igual a uma inscrição feita no site, mas em lotes
// pequenos para não sobrecarregar a Kommo/WhatsApp. A inscrição já existe; a fila só manda os avisos.
// Padrão: 4 a cada 10 minutos, das 8h às 21h (Brasília), configurável no painel, com pausar/retomar.
// Quem processa: o botão "Enviar próximo lote agora" do painel e, se o plano da Vercel permitir cron frequente,
// a rota /api/vestibular/fila-sei (com CRON_SECRET). Fica em vestibular_config, chave "fila-sei" (sem tabela nova).

export type ItemFila = {
  numero: number;
  status: 'pendente' | 'enviado' | 'erro';
  tentativas: number;
  em: string | null; // último envio ou tentativa
  email: boolean | null;
  rd: boolean | null;
};

export type ConfigFila = {
  pausada: boolean;
  lote: number; // inscrições por lote
  intervaloMin: number; // minutos entre lotes automáticos
  horaInicio: number; // 0–23, horário de Brasília
  horaFim: number; // lotes automáticos só antes desta hora
};

export type Fila = ConfigFila & {
  itens: ItemFila[];
  ultimoLote: string | null;
  processandoDesde: string | null;
};

const chave = 'fila-sei';
const maxTentativas = 3;
// Trava contra dois processamentos ao mesmo tempo (cron e botão); vence sozinha depois de 4 minutos
const travaMs = 4 * 60 * 1000;
// No máximo 2 e-mails por segundo no Resend
const intervaloEnvio = 600;

export const configPadrao: ConfigFila = { pausada: false, lote: 4, intervaloMin: 10, horaInicio: 8, horaFim: 21 };

const vazia = (): Fila => ({ ...configPadrao, itens: [], ultimoLote: null, processandoDesde: null });

export const lerFila = async (): Promise<Fila> => ({ ...vazia(), ...((await lerConfig<Fila>(chave)) ?? {}) });
const gravarFila = (fila: Fila) => gravarConfig(chave, fila);

export const resumoFila = (f: Fila) => ({
  pausada: f.pausada,
  lote: f.lote,
  intervaloMin: f.intervaloMin,
  horaInicio: f.horaInicio,
  horaFim: f.horaFim,
  ultimoLote: f.ultimoLote,
  total: f.itens.length,
  pendentes: f.itens.filter((i) => i.status === 'pendente').length,
  enviados: f.itens.filter((i) => i.status === 'enviado').length,
  erros: f.itens.filter((i) => i.status === 'erro').map((i) => i.numero),
});

export const adicionarNaFila = async (numeros: number[]) => {
  const fila = await lerFila();
  const ja = new Set(fila.itens.map((i) => i.numero));
  const novos = numeros
    .filter((n) => !ja.has(n))
    .map((numero): ItemFila => ({ numero, status: 'pendente', tentativas: 0, em: null, email: null, rd: null }));
  await gravarFila({ ...fila, itens: [...fila.itens, ...novos] });
  return novos.length;
};

const inteiro = (v: unknown, min: number, max: number, padrao: number) => {
  const n = Math.round(Number(v));
  return Number.isFinite(n) && n >= min && n <= max ? n : padrao;
};

// Pausar/retomar, tamanho do lote, intervalo e horário; "reprocessar" volta os itens com erro para pendente
export const configurarFila = async (dados: Record<string, unknown>) => {
  const fila = await lerFila();
  const nova: Fila = {
    ...fila,
    pausada: typeof dados.pausada === 'boolean' ? dados.pausada : fila.pausada,
    lote: inteiro(dados.lote, 1, 50, fila.lote),
    intervaloMin: inteiro(dados.intervaloMin, 1, 240, fila.intervaloMin),
    horaInicio: inteiro(dados.horaInicio, 0, 23, fila.horaInicio),
    horaFim: inteiro(dados.horaFim, 1, 24, fila.horaFim),
    itens:
      dados.reprocessar === true
        ? fila.itens.map((i) => (i.status === 'erro' ? { ...i, status: 'pendente', tentativas: 0 } : i))
        : fila.itens,
  };
  await gravarFila(nova);
  return resumoFila(nova);
};

// Hora no horário de Brasília (-03:00, sem horário de verão)
const horaBrasilia = (agora: number) => new Date(agora - 3 * 60 * 60 * 1000).getUTCHours();

export type ResultadoLote = { enviados: number; erros: number; motivo: string | null };

// Processa um lote. automatico: respeita pausa, horário e intervalo; manual (botão): só respeita a pausa.
export const processarLote = async ({ automatico }: { automatico: boolean }, agora = Date.now()) => {
  const fila = await lerFila();
  const pendentes = fila.itens.filter((i) => i.status === 'pendente');
  const sem = (motivo: string): ResultadoLote => ({ enviados: 0, erros: 0, motivo });
  if (!pendentes.length) {
    return sem('Nada pendente na fila.');
  }
  if (fila.pausada) {
    return sem('A fila está pausada.');
  }
  if (fila.processandoDesde && agora - new Date(fila.processandoDesde).getTime() < travaMs) {
    return sem('Já tem um lote sendo enviado. Espere alguns minutos.');
  }
  if (automatico) {
    const hora = horaBrasilia(agora);
    if (hora < fila.horaInicio || hora >= fila.horaFim) {
      return sem(`Fora do horário de envio (${fila.horaInicio}h às ${fila.horaFim}h).`);
    }
    // 19/11, das 10h às 11h: o lembrete da prova está saindo (limite de 2 e-mails/s do Resend é da conta toda)
    if (new Date(agora - 3 * 60 * 60 * 1000).toISOString().slice(0, 10) === diaLembrete.id && hora === 10) {
      return sem('Pausa automática: lembretes da prova saindo (19/11, 10h às 11h).');
    }
    if (fila.ultimoLote && agora - new Date(fila.ultimoLote).getTime() < fila.intervaloMin * 60 * 1000 - 30_000) {
      return sem('Ainda não deu o intervalo entre lotes.');
    }
  }
  const lote = pendentes.slice(0, fila.lote);
  await gravarFila({ ...fila, processandoDesde: new Date(agora).toISOString() });

  const porNumero = new Map((await listarInscricoes()).map((i) => [i.numero, i] as [number, Inscricao]));
  const comEmail = emailConfigurado();
  const atualizados = new Map<number, ItemFila>();
  const r: ResultadoLote = { enviados: 0, erros: 0, motivo: null };
  for (const item of lote) {
    const volta = Date.now();
    const inscricao = porNumero.get(item.numero);
    let email = false;
    let rd = false;
    if (inscricao) {
      [email, rd] = await Promise.all([
        comEmail ? enviarConfirmacao(inscricao, true).catch(() => false) : Promise.resolve(false),
        enviarConversaoRd(inscricao, 'inscricao'),
      ]);
    }
    // Com e-mail configurado, o e-mail decide (sem ele, vale a RD); a RD que falhar dá para reenviar pela ficha
    const ok = !!inscricao && (comEmail ? email : rd);
    const tentativas = item.tentativas + 1;
    atualizados.set(item.numero, {
      ...item,
      tentativas,
      em: new Date().toISOString(),
      email: comEmail ? email : null,
      rd,
      status: ok ? 'enviado' : tentativas >= maxTentativas || !inscricao ? 'erro' : 'pendente',
    });
    if (ok) {
      r.enviados++;
    } else {
      r.erros++;
    }
    const espera = intervaloEnvio - (Date.now() - volta);
    if (espera > 0) {
      await new Promise((fim) => setTimeout(fim, espera));
    }
  }

  // Relê para não perder itens adicionados por uma importação durante o lote
  const atual = await lerFila();
  await gravarFila({
    ...atual,
    itens: atual.itens.map((i) => atualizados.get(i.numero) ?? i),
    ultimoLote: new Date().toISOString(),
    processandoDesde: null,
  });
  return r;
};

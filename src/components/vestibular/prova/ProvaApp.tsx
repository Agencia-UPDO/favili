'use client';

import { rotaAreaCandidato } from '@/data/inscricao';
import { vestibular } from '@/data/vestibular';
import { cn } from '@/utils/cn';
import { useCallback, useEffect, useRef, useState } from 'react';
import { chaveSessao } from '../inscricao/AreaCandidato';
import { Seta } from '../ui';

// Prova on-line: uma questão por tela, mapa das questões, cronômetro do servidor, resposta salva a cada toque
// e entrega (manual ou automática quando o tempo acaba).

type Questao = {
  numero: number;
  id: string;
  area: string;
  textoBase: string | null;
  enunciado: string;
  fonte: string | null;
  imagem: string | null;
  alternativas: { letra: string; texto: string; imagem: string | null }[];
  resposta: string | null;
};

type Estado = {
  situacao: 'sem-prova' | 'aguardando' | 'liberada' | 'em-andamento' | 'entregue' | 'perdida';
  agora: number;
  fim: number | null;
  totalQuestoes: number;
  modoTeste: boolean;
  questoes: Questao[] | null;
};

type Salvamento = 'ok' | 'salvando' | 'erro';

const lerAcesso = (): { cpf: string; codigo: string } | null => {
  try {
    const salvo = sessionStorage.getItem(chaveSessao);
    return salvo ? JSON.parse(salvo) : null;
  } catch {
    return null;
  }
};

const relogio = (ms: number) => {
  const s = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  return `${h}:${String(m).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
};

// Trechos marcados com __assim__ no banco aparecem sublinhados (questões que pedem a palavra sublinhada)
const ComSublinhado = ({ texto }: { texto: string }) => (
  <>
    {texto.split('__').map((parte, i) =>
      i % 2 ? (
        <u key={i} className="decoration-2 underline-offset-2">
          {parte}
        </u>
      ) : (
        parte
      ),
    )}
  </>
);

// Texto de apoio: textos longos ficam num bloco rolável, com opção de abrir inteiro
const TextoBase = ({ texto }: { texto: string }) => {
  const [aberto, setAberto] = useState(false);
  const longo = texto.length > 900;
  return (
    <div className="bg-background-3 rounded-2xl">
      <div
        className={cn(
          'p-4 text-[16px] leading-relaxed whitespace-pre-line',
          longo && !aberto && 'max-h-[45vh] overflow-y-auto',
        )}>
        {texto}
      </div>
      {longo && (
        <button
          type="button"
          onClick={() => setAberto(!aberto)}
          className="text-vest-blue w-full cursor-pointer border-t border-white px-4 py-2 text-[14px] font-bold">
          {aberto ? 'Recolher texto' : 'Ver texto completo'}
        </button>
      )}
    </div>
  );
};

const Aviso = ({ titulo, children }: { titulo: string; children: React.ReactNode }) => (
  <div className="mx-auto max-w-[560px] space-y-4 rounded-[28px] bg-white p-6 text-center md:p-9">
    <h1 className="font-chamada text-vest-navy text-[34px] md:text-[42px]">{titulo}</h1>
    <div className="space-y-3 text-[16px]">{children}</div>
    <a
      href={rotaAreaCandidato}
      className="bg-vest-blue hover:bg-vest-navy inline-flex items-center gap-2 rounded-full px-6 py-3 font-bold text-white">
      Ir para Minha inscrição <Seta />
    </a>
  </div>
);

const ProvaApp = () => {
  const [acesso, setAcesso] = useState<{ cpf: string; codigo: string } | null>(null);
  const [estado, setEstado] = useState<Estado | null>(null);
  const [erro, setErro] = useState('');
  const [atual, setAtual] = useState(0);
  const [respostas, setRespostas] = useState<Record<string, string | null>>({});
  const [salvamento, setSalvamento] = useState<Salvamento>('ok');
  const [confirmar, setConfirmar] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [diferenca, setDiferenca] = useState(0); // relógio do servidor − relógio do aparelho
  const [agora, setAgora] = useState(() => Date.now());
  const fila = useRef<Promise<void>>(Promise.resolve());
  const entregando = useRef(false);

  const chamar = useCallback(
    async (corpo: Record<string, unknown>) => {
      const dados = acesso ?? lerAcesso();
      const res = await fetch('/api/vestibular/prova', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...dados, ...corpo }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.ok) {
        throw new Error(json.mensagem ?? 'Sem conexão com o servidor.');
      }
      return json;
    },
    [acesso],
  );

  const aplicar = useCallback((json: Estado) => {
    setEstado(json);
    setDiferenca(json.agora - Date.now());
    if (json.questoes) {
      setRespostas(Object.fromEntries(json.questoes.map((q) => [q.id, q.resposta])));
    }
  }, []);

  // Carrega a situação da prova com o acesso feito em Minha inscrição
  useEffect(() => {
    const dados = lerAcesso();
    if (!dados) {
      window.location.href = rotaAreaCandidato;
      return;
    }
    setAcesso(dados);
    try {
      setAtual(Number(sessionStorage.getItem('vestibular-questao-atual') ?? 0));
    } catch {
      // sem armazenamento: começa da primeira
    }
    fetch('/api/vestibular/prova', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...dados, acao: 'estado' }),
    })
      .then((r) => r.json())
      .then((json) => (json.ok ? aplicar(json) : setErro(json.mensagem)))
      .catch(() => setErro('Sem conexão. Confira sua internet e recarregue a página.'));
  }, [aplicar]);

  useEffect(() => {
    const timer = setInterval(() => setAgora(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    try {
      sessionStorage.setItem('vestibular-questao-atual', String(atual));
    } catch {
      // ignora
    }
    window.scrollTo({ top: 0 });
  }, [atual]);

  const entregar = useCallback(async () => {
    if (entregando.current) {
      return;
    }
    entregando.current = true;
    setEnviando(true);
    await fila.current;
    for (let tentativa = 0; tentativa < 5; tentativa++) {
      try {
        aplicar(await chamar({ acao: 'entregar' }));
        break;
      } catch {
        await new Promise((r) => setTimeout(r, 2000));
      }
    }
    setEnviando(false);
    setConfirmar(false);
    entregando.current = false;
  }, [aplicar, chamar]);

  const restante = estado?.fim ? estado.fim - (agora + diferenca) : null;

  // Tempo esgotado: entrega automática (o servidor também entrega sozinho na próxima consulta)
  useEffect(() => {
    if (estado?.situacao === 'em-andamento' && restante !== null && restante <= 0) {
      entregar();
    }
  }, [estado?.situacao, restante, entregar]);

  const marcar = (questao: Questao, letra: string) => {
    const nova = respostas[questao.id] === letra ? null : letra;
    setRespostas((r) => ({ ...r, [questao.id]: nova }));
    setSalvamento('salvando');
    // As gravações vão em fila, na ordem dos toques; se falhar, tenta de novo algumas vezes
    fila.current = fila.current.then(async () => {
      for (let tentativa = 0; tentativa < 4; tentativa++) {
        try {
          await chamar({ acao: 'responder', questao: questao.id, letra: nova });
          setSalvamento('ok');
          return;
        } catch {
          setSalvamento('erro');
          await new Promise((r) => setTimeout(r, 1500 * (tentativa + 1)));
        }
      }
    });
  };

  const comecar = async () => {
    setEnviando(true);
    try {
      aplicar(await chamar({ acao: 'iniciar' }));
      setAtual(0);
    } catch (e) {
      setErro((e as Error).message);
    }
    setEnviando(false);
  };

  if (erro) {
    return (
      <Aviso titulo="Não foi possível abrir a prova">
        <p>{erro}</p>
      </Aviso>
    );
  }

  if (!estado) {
    return <p className="text-secondary/60 py-20 text-center">Carregando a prova…</p>;
  }

  if (estado.situacao === 'entregue') {
    return (
      <Aviso titulo="Prova enviada!">
        <p>Suas respostas foram registradas. Obrigado por participar do {vestibular.nome}.</p>
        <p>
          O resultado com as bolsas sai em <strong>{vestibular.resultado}</strong>, em Minha inscrição.
        </p>
      </Aviso>
    );
  }

  if (estado.situacao === 'aguardando') {
    return (
      <Aviso titulo="Ainda não é a hora">
        <p>A prova abre no dia e horário que você escolheu. Volte para Minha inscrição para ver a contagem.</p>
      </Aviso>
    );
  }

  if (estado.situacao === 'perdida' || estado.situacao === 'sem-prova') {
    return (
      <Aviso titulo="Prova indisponível">
        <p>
          {estado.situacao === 'perdida'
            ? 'O prazo para fazer a prova terminou.'
            : 'Sua inscrição não tem prova agendada.'}
        </p>
      </Aviso>
    );
  }

  if (estado.situacao === 'liberada') {
    return (
      <div className="mx-auto max-w-[560px] space-y-5 rounded-[28px] bg-white p-6 md:p-9">
        <h1 className="font-chamada text-vest-navy text-center text-[34px] md:text-[42px]">Sua prova está liberada</h1>
        {estado.modoTeste && (
          <p className="rounded-xl bg-amber-100 p-3 text-center text-[14px] font-semibold text-amber-900">
            Modo de teste: prova liberada fora do horário (só no computador de desenvolvimento).
          </p>
        )}
        <ul className="space-y-2 text-[15px]">
          {[
            `${estado.totalQuestoes} questões objetivas: metade de Linguagens e Códigos, metade de Matemática.`,
            `Você tem até ${vestibular.duracaoHoras} horas a partir de agora, sem passar das 20h.`,
            'Cada resposta é salva na hora. Se a internet cair, entre de novo com CPF e código: o tempo continua correndo.',
            'Você pode voltar às questões e trocar a resposta até entregar.',
            'A prova é feita uma única vez.',
          ].map((r) => (
            <li key={r} className="flex gap-2">
              <span aria-hidden className="text-vest-blue font-bold">
                •
              </span>
              {r}
            </li>
          ))}
        </ul>
        <button
          type="button"
          onClick={comecar}
          disabled={enviando}
          className="bg-vest-yellow text-vest-navy hover:bg-vest-navy flex h-14 w-full cursor-pointer items-center justify-center gap-2 rounded-full text-[18px] font-extrabold transition-colors hover:text-white disabled:opacity-60">
          {enviando ? 'Abrindo…' : 'Começar agora'} <Seta />
        </button>
      </div>
    );
  }

  // ---------- Prova em andamento ----------
  const questoes = estado.questoes ?? [];
  const q = questoes[Math.min(atual, questoes.length - 1)];
  const respondidas = questoes.filter((x) => respostas[x.id]).length;
  const emBranco = questoes.length - respondidas;
  const poucoTempo = restante !== null && restante <= 10 * 60 * 1000;

  return (
    <div className="mx-auto max-w-[760px] pb-10">
      {/* Barra fixa: cronômetro, progresso e situação do salvamento */}
      <div
        className={cn(
          'sticky top-0 z-40 -mx-4 mb-4 flex items-center justify-between gap-3 px-4 py-3 text-white shadow-md md:mx-0 md:rounded-b-2xl',
          poucoTempo ? 'bg-red-600' : 'bg-vest-navy',
        )}>
        <div>
          <p className="text-[11px] font-bold tracking-[0.18em] text-white/80 uppercase">Tempo restante</p>
          <p className="font-condensada text-[28px] leading-none font-bold text-white tabular-nums">
            {restante !== null ? relogio(restante) : '--:--'}
          </p>
        </div>
        <div className="text-right text-[13px]">
          <p className="font-bold text-white">
            {respondidas}/{questoes.length} respondidas
          </p>
          <p className={cn('text-white/90', salvamento === 'erro' && 'text-vest-yellow font-bold')}>
            {salvamento === 'salvando'
              ? 'Salvando…'
              : salvamento === 'erro'
                ? 'Sem conexão, tentando de novo…'
                : 'Tudo salvo ✓'}
          </p>
        </div>
      </div>

      {poucoTempo && (
        <p role="alert" className="mb-4 rounded-2xl bg-red-50 p-3 text-center text-[14px] font-bold text-red-700">
          Faltam menos de 10 minutos. Ao zerar, a prova é entregue automaticamente.
        </p>
      )}

      {/* Progresso da prova (a prova segue em sequência, sem pular questões) */}
      <div className="mb-4 h-2 overflow-hidden rounded-full bg-white" aria-hidden>
        <div
          className="bg-vest-blue h-full rounded-full transition-all"
          style={{ width: `${((atual + 1) / questoes.length) * 100}%` }}
        />
      </div>

      <article className="space-y-5 rounded-[24px] bg-white p-5 md:p-8">
        <p className="text-vest-blue text-[13px] font-bold tracking-[0.12em] uppercase">
          Questão {q.numero} de {questoes.length} · {q.area}
          {q.fonte && <span className="text-secondary/50 ml-2 font-semibold normal-case">({q.fonte})</span>}
        </p>
        {q.textoBase && <TextoBase key={q.id} texto={q.textoBase} />}
        {q.imagem && <img src={q.imagem} alt="Imagem da questão" className="mx-auto max-h-[360px] w-auto rounded-xl" />}
        <p className="text-vest-navy text-[18px] leading-snug font-semibold whitespace-pre-line">
          <ComSublinhado texto={q.enunciado} />
        </p>
        <div role="radiogroup" aria-label={`Alternativas da questão ${q.numero}`} className="space-y-3">
          {q.alternativas.map((a) => {
            const marcada = respostas[q.id] === a.letra;
            return (
              <button
                key={a.letra}
                type="button"
                role="radio"
                aria-checked={marcada}
                onClick={() => marcar(q, a.letra)}
                className={cn(
                  'flex min-h-[56px] w-full cursor-pointer items-start gap-3 rounded-2xl border-2 p-3 text-left text-[16px] transition-colors',
                  marcada ? 'border-vest-blue bg-primary-50' : 'border-stroke-3 hover:border-vest-blue bg-white',
                )}>
                <span
                  className={cn(
                    'flex size-8 shrink-0 items-center justify-center rounded-full font-bold',
                    marcada ? 'bg-vest-blue text-white' : 'bg-background-3 text-vest-navy',
                  )}>
                  {a.letra}
                </span>
                {a.imagem ? (
                  <img src={a.imagem} alt={a.texto} className="max-h-[180px] w-auto rounded-lg" />
                ) : (
                  <span className="pt-1">
                    <ComSublinhado texto={a.texto} />
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </article>

      <div className="mt-4 flex gap-3">
        <button
          type="button"
          onClick={() => setAtual((n) => Math.max(0, n - 1))}
          disabled={atual === 0}
          className="border-stroke-3 text-vest-navy h-14 flex-1 cursor-pointer rounded-full border-2 bg-white font-bold disabled:opacity-40">
          ← Anterior
        </button>
        {atual < questoes.length - 1 ? (
          <button
            type="button"
            onClick={() => setAtual((n) => Math.min(questoes.length - 1, n + 1))}
            className="bg-vest-blue hover:bg-vest-navy h-14 flex-1 cursor-pointer rounded-full font-bold text-white">
            Próxima →
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setConfirmar(true)}
            className="bg-vest-yellow text-vest-navy h-14 flex-1 cursor-pointer rounded-full font-extrabold">
            Entregar prova
          </button>
        )}
      </div>

      {confirmar && (
        <div
          role="dialog"
          aria-modal
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 sm:items-center">
          <div className="w-full max-w-[440px] space-y-4 rounded-[24px] bg-white p-6 text-center">
            <p className="font-chamada text-vest-navy text-[30px]">Entregar a prova?</p>
            <p className="text-[16px]">
              {emBranco === 0
                ? 'Você respondeu todas as questões.'
                : `Você deixou ${emBranco} ${emBranco === 1 ? 'questão' : 'questões'} em branco.`}{' '}
              Depois de entregar, não dá para mudar as respostas.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() => setConfirmar(false)}
                className="border-stroke-3 text-vest-navy h-12 flex-1 cursor-pointer rounded-full border-2 font-bold">
                Voltar à prova
              </button>
              <button
                type="button"
                onClick={entregar}
                disabled={enviando}
                className="bg-vest-yellow text-vest-navy h-12 flex-1 cursor-pointer rounded-full font-extrabold disabled:opacity-60">
                {enviando ? 'Enviando…' : 'Entregar agora'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProvaApp;

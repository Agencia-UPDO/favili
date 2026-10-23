'use client';

import { diasProva, horaDeEntrar, horariosProva, minutosAntes } from '@/data/inscricao';
import { instituicao, vestibular } from '@/data/vestibular';
import { formatarCpf, soDigitos } from '@/utils/vestibular/validacao';
import { cn } from '@/utils/cn';
import { FormEvent, useEffect, useState } from 'react';
import { Seta } from '../ui';
import Confirmacao, { InscricaoConfirmada } from './Confirmacao';
import { campoClass, opcaoAtiva, opcaoClass, rotuloClass } from './estilos';

// Área do candidato: entra com CPF + código, vê o comprovante, troca o horário até o fim das inscrições e,
// na hora marcada, começa a prova. CPF e código ficam só nesta aba (sessionStorage) para sobreviver a um recarregar.

const chaveSessao = 'vestibular-acesso';
export const chaveCpf = 'vestibular-cpf';

const ler = (chave: string) => {
  try {
    return sessionStorage.getItem(chave);
  } catch {
    return null;
  }
};
const gravar = (chave: string, valor: string | null) => {
  try {
    if (valor === null) {
      sessionStorage.removeItem(chave);
    } else {
      sessionStorage.setItem(chave, valor);
    }
  } catch {
    // Navegação privada sem armazenamento: só não lembra o acesso ao recarregar
  }
};

const inicioDaProva = (i: InscricaoConfirmada) =>
  i.diaProva && i.horaProva ? new Date(`${i.diaProva}T${i.horaProva}:00-03:00`) : null;

const duracaoMs = vestibular.duracaoHoras * 60 * 60 * 1000;
const dataResultado = new Date('2026-11-24T00:00:00-03:00');

const faltam = (ms: number) => {
  const min = Math.max(0, Math.ceil(ms / 60000));
  const dias = Math.floor(min / 1440);
  const horas = Math.floor((min % 1440) / 60);
  const minutos = min % 60;
  if (dias > 0) {
    return `${dias} ${dias === 1 ? 'dia' : 'dias'} e ${horas}h`;
  }
  return horas > 0 ? `${horas}h ${minutos}min` : `${minutos} min`;
};

const StatusProva = ({ inscricao, agora }: { inscricao: InscricaoConfirmada; agora: number }) => {
  const inicio = inicioDaProva(inscricao);
  if (!inscricao.fazProva || !inicio) {
    return (
      <div className="bg-primary-50 rounded-[22px] p-5 text-[15px]">
        <p className="text-vest-navy font-bold">Sua inscrição está em análise</p>
        <p className="mt-1">
          Nossa equipe vai chamar você no WhatsApp para receber o documento. Depois da análise, você recebe a
          confirmação da vaga com {vestibular.descontoGarantido} de desconto.
        </p>
      </div>
    );
  }

  const ms = inicio.getTime() - agora;

  // Sala de espera: nos 15 minutos antes do horário, confirma os dados, lembra as regras e conta os segundos
  if (ms > 0 && ms <= minutosAntes * 60000) {
    const seg = Math.ceil(ms / 1000);
    return (
      <div className="bg-vest space-y-4 rounded-[22px] p-6 text-white">
        <div className="text-center">
          <p className="text-vest-cyan text-[12px] font-bold tracking-[0.2em] uppercase">Sala de espera</p>
          <p className="font-chamada mt-1 text-[48px] text-white">
            {Math.floor(seg / 60)}:{String(seg % 60).padStart(2, '0')}
          </p>
          <p className="text-[15px] text-white/90">para a sua prova começar. Não feche esta página.</p>
        </div>
        <ul className="space-y-2 rounded-2xl bg-white/10 p-4 text-[14px] text-white">
          {[
            `São ${vestibular.duracaoHoras} horas para responder as 20 questões, contadas a partir do início.`,
            'Use um lugar tranquilo e confira a internet e a bateria do aparelho.',
            'Suas respostas ficam salvas a cada questão; se a conexão cair, entre de novo com CPF e código.',
            'Cada candidato faz a prova uma única vez.',
          ].map((regra) => (
            <li key={regra} className="flex gap-2">
              <span aria-hidden className="text-vest-yellow">
                •
              </span>
              {regra}
            </li>
          ))}
        </ul>
      </div>
    );
  }

  if (ms > 0) {
    return (
      <div className="bg-primary-50 rounded-[22px] p-5 text-center">
        <p className="text-vest-blue text-[12px] font-bold tracking-[0.2em] uppercase">Sua prova abre em</p>
        <p className="font-chamada text-vest-navy mt-1 text-[40px]">{faltam(ms)}</p>
        <p className="text-[15px]">
          Entre aqui {minutosAntes} minutos antes do horário (às {horaDeEntrar(inscricao.horaProva ?? '00:00')}) para
          liberar a prova. Você tem até {vestibular.duracaoHoras} horas.
        </p>
      </div>
    );
  }

  if (agora < inicio.getTime() + duracaoMs) {
    return (
      <div className="bg-vest rounded-[22px] p-6 text-center text-white">
        <p className="text-[16px] text-white">Chegou a hora! Sua prova está liberada.</p>
        <a
          href="/vestibular/prova"
          className="bg-vest-yellow text-vest-navy mt-4 inline-flex items-center gap-2 rounded-full px-8 py-4 text-[18px] font-extrabold transition-colors hover:bg-white">
          Começar prova <Seta />
        </a>
      </div>
    );
  }

  return (
    <div className="bg-primary-50 rounded-[22px] p-5 text-center text-[15px]">
      <p className="text-vest-navy font-bold">
        {agora < dataResultado.getTime() ? 'Prova encerrada' : 'Resultado disponível'}
      </p>
      <p className="mt-1">
        {agora < dataResultado.getTime()
          ? `O resultado com as bolsas sai em ${vestibular.resultado}, aqui nesta página.`
          : 'Confira aqui o seu resultado.'}
      </p>
    </div>
  );
};

const TrocarHorario = ({
  inscricao,
  codigo,
  cpf,
  aoTrocar,
}: {
  inscricao: InscricaoConfirmada;
  codigo: string;
  cpf: string;
  aoTrocar: (i: InscricaoConfirmada) => void;
}) => {
  const [aberto, setAberto] = useState(false);
  const [dia, setDia] = useState(inscricao.diaProva ?? '');
  const [hora, setHora] = useState(inscricao.horaProva ?? '');
  const [status, setStatus] = useState<'idle' | 'salvando' | 'salvo'>('idle');
  const [aviso, setAviso] = useState('');

  const salvar = async () => {
    setStatus('salvando');
    setAviso('');
    const res = await fetch('/api/vestibular/acesso', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cpf, codigo, diaProva: dia, horaProva: hora }),
    }).catch(() => null);
    const resposta = res ? await res.json().catch(() => ({})) : {};
    if (res?.ok && resposta.ok) {
      aoTrocar(resposta.inscricao);
      setStatus('salvo');
      setAberto(false);
      return;
    }
    setAviso(resposta.mensagem ?? 'Não conseguimos trocar o horário. Tente de novo.');
    setStatus('idle');
  };

  if (!aberto) {
    return (
      <div className="text-center print:hidden">
        {status === 'salvo' && <p className="text-vest-blue mb-2 text-[14px] font-semibold">Horário atualizado.</p>}
        <button
          type="button"
          onClick={() => setAberto(true)}
          className="text-vest-blue cursor-pointer text-[15px] font-semibold underline-offset-4 hover:underline">
          Trocar o dia ou o horário da prova
        </button>
      </div>
    );
  }

  return (
    <div className="border-stroke-2 space-y-4 rounded-[22px] border p-5">
      <p className="text-vest-navy font-bold">Escolha o novo dia e horário</p>
      <div className="grid gap-3 sm:grid-cols-2">
        {diasProva.map((d) => (
          <button
            key={d.id}
            type="button"
            aria-pressed={dia === d.id}
            onClick={() => setDia(d.id)}
            className={cn(opcaoClass, 'h-12', dia === d.id && opcaoAtiva)}>
            {d.rotulo}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
        {horariosProva.map((h) => (
          <button
            key={h}
            type="button"
            aria-pressed={hora === h}
            onClick={() => setHora(h)}
            className={cn(opcaoClass, 'h-11', hora === h && opcaoAtiva)}>
            {h.replace(':00', 'h')}
          </button>
        ))}
      </div>
      {aviso && <p className="text-[14px] font-semibold text-red-600">{aviso}</p>}
      <div className="flex flex-wrap justify-end gap-3">
        <button
          type="button"
          onClick={() => setAberto(false)}
          className="text-secondary/70 cursor-pointer px-4 text-[15px] font-semibold">
          Cancelar
        </button>
        <button
          type="button"
          onClick={salvar}
          disabled={status === 'salvando'}
          className="bg-vest-blue hover:bg-vest-navy cursor-pointer rounded-full px-6 py-3 text-[15px] font-bold text-white disabled:opacity-60">
          {status === 'salvando' ? 'Salvando…' : 'Salvar novo horário'}
        </button>
      </div>
    </div>
  );
};

const AreaCandidato = () => {
  const [cpf, setCpf] = useState('');
  const [codigo, setCodigo] = useState('');
  const [inscricao, setInscricao] = useState<InscricaoConfirmada | null>(null);
  const [status, setStatus] = useState<'carregando' | 'idle' | 'entrando'>('carregando');
  const [aviso, setAviso] = useState('');
  const [esqueci, setEsqueci] = useState(false);
  const [agora, setAgora] = useState(() => Date.now());

  const entrar = async (cpfEntrada: string, codigoEntrada: string, silencioso = false) => {
    setStatus('entrando');
    setAviso('');
    const res = await fetch('/api/vestibular/acesso', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cpf: cpfEntrada, codigo: codigoEntrada }),
    }).catch(() => null);
    const resposta = res ? await res.json().catch(() => ({})) : {};
    setStatus('idle');
    if (res?.ok && resposta.ok) {
      setInscricao(resposta.inscricao);
      gravar(chaveSessao, JSON.stringify({ cpf: soDigitos(cpfEntrada), codigo: resposta.inscricao.codigo }));
      return;
    }
    gravar(chaveSessao, null);
    if (!silencioso) {
      setAviso(resposta.mensagem ?? 'Sem conexão. Confira sua internet e tente de novo.');
    }
  };

  // Volta direto para a inscrição se o acesso já foi feito nesta aba; senão, aproveita o CPF que veio da inscrição
  useEffect(() => {
    const salvo = ler(chaveSessao);
    if (salvo) {
      const { cpf: c, codigo: k } = JSON.parse(salvo);
      setCpf(formatarCpf(c));
      setCodigo(k);
      entrar(c, k, true);
    } else {
      setCpf(formatarCpf(ler(chaveCpf) ?? ''));
      setStatus('idle');
    }
    const timer = setInterval(() => setAgora(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const enviar = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    entrar(cpf, codigo);
  };

  const sair = () => {
    gravar(chaveSessao, null);
    setInscricao(null);
    setCodigo('');
  };

  if (status === 'carregando') {
    return <p className="text-secondary/60 py-10 text-center">Carregando…</p>;
  }

  if (inscricao) {
    const podeTrocar =
      inscricao.fazProva &&
      agora < new Date(vestibular.fimInscricoes).getTime() &&
      (inicioDaProva(inscricao)?.getTime() ?? 0) > agora;
    return (
      <div className="space-y-6">
        <Confirmacao
          inscricao={inscricao}
          modo="area"
          extra={
            <div className="space-y-4">
              <StatusProva inscricao={inscricao} agora={agora} />
              {podeTrocar && (
                <TrocarHorario inscricao={inscricao} cpf={cpf} codigo={inscricao.codigo} aoTrocar={setInscricao} />
              )}
            </div>
          }
        />
        <button
          type="button"
          onClick={sair}
          className="text-secondary/60 mx-auto block cursor-pointer text-[14px] font-semibold hover:underline print:hidden">
          Sair
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={enviar} className="space-y-5">
      <div className="space-y-2 text-center">
        <h2 className="font-chamada text-vest-navy text-[32px] md:text-[40px]">Entrar na minha inscrição</h2>
        <p className="text-[15px]">Use o CPF e o código de acesso que apareceram quando você se inscreveu.</p>
      </div>
      <div>
        <label htmlFor="cpf" className={rotuloClass}>
          CPF
        </label>
        <input
          id="cpf"
          value={cpf}
          onChange={(e) => setCpf(formatarCpf(e.target.value))}
          inputMode="numeric"
          autoComplete="off"
          placeholder="000.000.000-00"
          required
          className={cn(campoClass, 'mt-2')}
        />
      </div>
      <div>
        <label htmlFor="codigo" className={rotuloClass}>
          Código de acesso
        </label>
        <input
          id="codigo"
          value={codigo}
          onChange={(e) => setCodigo(e.target.value.toUpperCase())}
          autoComplete="off"
          autoCapitalize="characters"
          spellCheck={false}
          placeholder="VIDAL-XXXXXX"
          required
          className={cn(campoClass, 'mt-2 tracking-[0.08em] uppercase')}
        />
      </div>
      {aviso && (
        <p role="alert" className="rounded-2xl bg-red-50 p-4 text-[15px] font-semibold text-red-700">
          {aviso}
        </p>
      )}
      <button
        type="submit"
        disabled={status === 'entrando'}
        className="bg-vest-yellow text-vest-navy hover:bg-vest-navy flex h-14 w-full cursor-pointer items-center justify-center gap-2 rounded-full text-[18px] font-extrabold transition-colors duration-300 hover:text-white disabled:cursor-wait disabled:opacity-70">
        {status === 'entrando' ? 'Entrando…' : 'Entrar'}
        {status !== 'entrando' && <Seta />}
      </button>
      <div className="text-center text-[14px]">
        <button
          type="button"
          onClick={() => setEsqueci(!esqueci)}
          className="text-vest-blue cursor-pointer font-semibold underline-offset-4 hover:underline">
          Esqueci meu código
        </button>
        {esqueci && (
          <p className="mt-2">
            Fale com a Faculdade Vidal pelo{' '}
            <a href={instituicao.telefoneLink} className="text-vest-blue font-semibold">
              {instituicao.telefone}
            </a>{' '}
            com o seu CPF em mãos.
          </p>
        )}
        <p className="text-secondary/60 mt-4">
          Ainda não se inscreveu?{' '}
          <a href={vestibular.inscricao} className="text-vest-blue font-semibold">
            Faça sua inscrição grátis
          </a>
        </p>
      </div>
    </form>
  );
};

export default AreaCandidato;

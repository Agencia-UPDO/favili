'use client';

import {
  avisoFim,
  diasProva,
  fusoHorario,
  horaDeEntrar,
  horaFim,
  horariosProva,
  minutosAntes,
  ofertas,
} from '@/data/inscricao';
import { instituicao, vestibular } from '@/data/vestibular';
import { formatarCpf, soDigitos } from '@/utils/vestibular/validacao';
import { cn } from '@/utils/cn';
import { FormEvent, useEffect, useState } from 'react';
import { Seta } from '../ui';
import Confirmacao, { InscricaoConfirmada } from './Confirmacao';
import EnvioDocumentos from './EnvioDocumentos';
import { campoClass, opcaoAtiva, opcaoClass, rotuloClass } from './estilos';

// Área do candidato: entra com CPF + código, vê o comprovante, troca o horário até o fim das inscrições e,
// na hora marcada, começa a prova. CPF e código ficam só nesta aba (sessionStorage) para sobreviver a um recarregar.

export const chaveSessao = 'vestibular-acesso';
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

export type ResultadoCandidato = {
  publicado: boolean;
  classificado: boolean;
  reprovado: boolean;
  classificacaoOferta: number | null;
  totalOferta: number;
  bolsa: number | null;
};

// Resultado publicado: bolsa conquistada (ou os 40% garantidos) e o próximo passo, a matrícula no SEI.
// Reprovado: só o aviso, sem matrícula. O candidato nunca vê nota nem acertos (pedido da faculdade).
const CartaoResultado = ({ resultado }: { resultado: ResultadoCandidato }) =>
  resultado.reprovado ? (
    <div className="bg-primary-50 space-y-2 rounded-[22px] p-6 text-center">
      <p className="text-vest-blue text-[12px] font-bold tracking-[0.2em] uppercase">Seu resultado</p>
      <p className="text-vest-navy text-[20px] font-bold">Não foi desta vez</p>
      <p className="text-[15px]">Você não foi aprovado(a) no Vestibular Conquista Vidal 2027.1.</p>
      <p className="text-[15px]">
        Se quiser conversar sobre outras formas de ingresso, fale com a Faculdade Vidal pelo {instituicao.telefone}.
      </p>
    </div>
  ) : (
    <div className="bg-vest space-y-3 rounded-[22px] p-6 text-center text-white">
      <p className="text-vest-cyan text-[12px] font-bold tracking-[0.2em] uppercase">Seu resultado</p>
      {resultado.bolsa ? (
        <>
          <p className="text-[16px] text-white">Parabéns! Você conquistou uma bolsa de</p>
          <p className="font-chamada text-vest-yellow text-[64px] leading-none">{resultado.bolsa}%</p>
        </>
      ) : (
        <>
          <p className="text-[16px] text-white">Você não ficou entre os contemplados com bolsa, mas garantiu</p>
          <p className="font-chamada text-vest-yellow text-[56px] leading-none">{vestibular.descontoGarantido}</p>
          <p className="text-[15px] text-white">de desconto nas mensalidades.</p>
        </>
      )}
      {resultado.classificado && resultado.classificacaoOferta && (
        <p className="text-[14px] text-white/85">{resultado.classificacaoOferta}º lugar no seu curso</p>
      )}
      <div className="rounded-2xl bg-white/10 p-4 text-left text-[14px] text-white">
        <p className="font-bold text-white">Próximo passo: matrícula de {vestibular.matricula}</p>
        <p className="mt-1 text-white/90">
          {resultado.bolsa === 100
            ? 'Sua bolsa é integral: a matrícula é isenta da taxa.'
            : `A matrícula é de ${vestibular.taxaMatricula}.`}{' '}
          Faça pelo sistema da faculdade e leve os documentos pedidos no regulamento.
        </p>
        <a
          href={vestibular.sei}
          target="_blank"
          rel="noopener"
          className="bg-vest-yellow text-vest-navy mt-3 inline-flex items-center gap-2 rounded-full px-5 py-2.5 font-extrabold">
          Fazer minha matrícula <Seta />
        </a>
      </div>
    </div>
  );

const StatusProva = ({
  inscricao,
  agora,
  modoTeste,
  resultado,
}: {
  inscricao: InscricaoConfirmada;
  agora: number;
  modoTeste: boolean;
  resultado: ResultadoCandidato | null;
}) => {
  if (resultado?.publicado) {
    return <CartaoResultado resultado={resultado} />;
  }
  const inicio = inicioDaProva(inscricao);
  if (!inscricao.fazProva || !inicio) {
    // Sem prova: o andamento é o dos documentos, mostrado no cartão de envio
    return null;
  }

  const ms = inicio.getTime() - agora;
  // Janela do candidato: do horário dele até 2 horas depois (atraso é descontado)
  const fimDoDia = inicio.getTime() + vestibular.duracaoHoras * 60 * 60 * 1000;
  const liberada = !inscricao.provaEntregue && (inscricao.provaIniciada || (ms <= 0 && agora < fimDoDia));

  if (inscricao.provaEntregue) {
    return (
      <div className="bg-primary-50 rounded-[22px] p-5 text-center text-[15px]">
        <p className="text-vest-navy font-bold">Prova enviada ✓</p>
        <p className="mt-1">
          {agora < dataResultado.getTime()
            ? `O resultado com as bolsas sai em ${vestibular.resultado}, aqui nesta página.`
            : 'Confira aqui o seu resultado.'}
        </p>
      </div>
    );
  }

  if (liberada) {
    return (
      <div className="bg-vest rounded-[22px] p-6 text-center text-white">
        <p className="text-[16px] text-white">
          {inscricao.provaIniciada ? 'Sua prova está em andamento.' : 'Chegou a hora! Sua prova está liberada.'}
        </p>
        <a
          href="/vestibular/prova"
          className="bg-vest-yellow text-vest-navy mt-4 inline-flex items-center gap-2 rounded-full px-8 py-4 text-[18px] font-extrabold transition-colors hover:bg-white">
          {inscricao.provaIniciada ? 'Continuar prova' : 'Começar prova'} <Seta />
        </a>
        {modoTeste && !inscricao.provaIniciada && (
          <p className="mt-3 text-[13px] text-white/80">Modo de teste: liberada fora do horário.</p>
        )}
      </div>
    );
  }

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
            `São 20 questões. ${avisoFim(inscricao.horaProva ?? '00:00')}`,
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
      <div className="bg-vest rounded-[22px] p-6 text-center text-white">
        <p className="text-vest-cyan text-[12px] font-bold tracking-[0.2em] uppercase">Sua prova</p>
        <p className="font-chamada mt-1 text-[30px] leading-tight text-white md:text-[36px]">
          {diasProva.find((d) => d.id === inscricao.diaProva)?.rotulo}, às {inscricao.horaProva?.replace(':00', 'h')}
          <span className="mt-1 block font-sans text-[13px] font-normal tracking-normal text-white/70 normal-case">
            {fusoHorario}
          </span>
        </p>
        <p className="text-vest-yellow mt-2 text-[16px] font-bold">
          Entre aqui às {horaDeEntrar(inscricao.horaProva ?? '00:00')} ({minutosAntes} minutos antes) para liberar a
          prova
        </p>
        <p className="mt-4 text-[13px] text-white/80 uppercase">Faltam</p>
        <p className="font-chamada text-[40px] leading-none text-white">{faltam(ms)}</p>
      </div>
    );
  }

  return (
    <div className="bg-primary-50 rounded-[22px] p-5 text-center text-[15px]">
      <p className="text-vest-navy font-bold">
        {agora < dataResultado.getTime()
          ? `Prova encerrada: seu horário terminou às ${horaFim(inscricao.horaProva ?? '00:00')}`
          : 'Resultado disponível'}
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

// "Esqueci meu código": manda o código para o e-mail da inscrição (nunca por WhatsApp). Sem e-mail configurado no
// servidor, mostra o telefone da secretaria.
const EsqueciCodigo = ({ cpf }: { cpf: string }) => {
  const [estado, setEstado] = useState<'idle' | 'enviando' | 'pronto'>('idle');
  const [mensagem, setMensagem] = useState('');
  const [semEmail, setSemEmail] = useState(false);

  const pedir = async () => {
    if (soDigitos(cpf).length !== 11) {
      setMensagem('Digite seu CPF no campo acima e toque de novo.');
      return;
    }
    setEstado('enviando');
    const res = await fetch('/api/vestibular/recuperar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cpf }),
    }).catch(() => null);
    const resposta = res ? await res.json().catch(() => ({})) : {};
    setSemEmail(!!resposta.semEmail);
    setMensagem(resposta.mensagem ?? 'Sem conexão. Tente de novo.');
    setEstado(res?.ok ? 'pronto' : 'idle');
  };

  return (
    <div className="bg-primary-50 mt-3 space-y-3 rounded-2xl p-4 text-left text-[14px]">
      {semEmail ? (
        <p>
          Fale com a Faculdade Vidal pelo{' '}
          <a href={instituicao.telefoneLink} className="text-vest-blue font-semibold">
            {instituicao.telefone}
          </a>{' '}
          com o seu CPF em mãos.
        </p>
      ) : (
        <>
          <p>Enviamos o código para o e-mail que você usou na inscrição. Confira o CPF acima e toque no botão.</p>
          {estado !== 'pronto' && (
            <button
              type="button"
              onClick={pedir}
              disabled={estado === 'enviando'}
              className="bg-vest-blue min-h-11 cursor-pointer rounded-full px-5 py-2.5 font-bold text-white disabled:opacity-60">
              {estado === 'enviando' ? 'Enviando…' : 'Enviar meu código por e-mail'}
            </button>
          )}
          {mensagem && (
            <p role="status" className={cn('font-semibold', estado === 'pronto' ? 'text-vest-navy' : 'text-red-700')}>
              {mensagem}
            </p>
          )}
        </>
      )}
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
  const [modoTeste, setModoTeste] = useState(false);
  const [detalhes, setDetalhes] = useState(false);
  const [resultado, setResultado] = useState<ResultadoCandidato | null>(null);
  const [relogio, setRelogio] = useState(() => Date.now());
  // Diferença entre o relógio do servidor e o do aparelho: contagem, sala de espera e botão "Começar" seguem o servidor
  const [diferenca, setDiferenca] = useState(0);
  const agora = relogio + diferenca;

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
      if (typeof resposta.agora === 'number') {
        setDiferenca(resposta.agora - Date.now());
      }
      setModoTeste(!!resposta.modoTeste);
      setResultado(resposta.resultado ?? null);
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
    const timer = setInterval(() => setRelogio(Date.now()), 1000);
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
      !inscricao.provaIniciada &&
      !inscricao.provaEntregue &&
      agora < new Date(vestibular.fimInscricoes).getTime() &&
      (inicioDaProva(inscricao)?.getTime() ?? 0) > agora;
    const oferta = ofertas.find((o) => o.id === inscricao.ofertaId);
    const envio = (
      <EnvioDocumentos
        inscricao={inscricao}
        cpf={soDigitos(cpf)}
        codigo={inscricao.codigo}
        aoAtualizar={(i) => setInscricao({ ...inscricao, ...i })}
      />
    );
    return (
      <div className="space-y-5">
        <div className="space-y-4 print:hidden">
          <h2 className="font-chamada text-vest-navy text-center text-[32px] md:text-[40px]">
            Olá, {inscricao.nome.split(' ')[0]}!
          </h2>
          {/* Documentos pendentes vêm antes de tudo; aprovados descem para depois do status da prova */}
          {inscricao.documentoStatus !== 'aprovado' && envio}
          <StatusProva inscricao={inscricao} agora={agora} modoTeste={modoTeste} resultado={resultado} />
          {inscricao.documentoStatus === 'aprovado' && envio}
          {modoTeste && inscricao.fazProva && !inscricao.provaIniciada && !inscricao.provaEntregue && (
            <a
              href="/vestibular/prova"
              className="block rounded-2xl border-2 border-dashed border-amber-400 bg-amber-50 p-3 text-center text-[14px] font-bold text-amber-900">
              Modo de teste (só neste computador): começar a prova agora →
            </a>
          )}
          <p className="text-secondary/70 text-center text-[14px]">
            {inscricao.nome} · {oferta ? `${oferta.curso} (${oferta.modalidade})` : ''} · Inscrição nº{' '}
            {inscricao.numero}
          </p>
        </div>

        <div className="border-stroke-2 rounded-[22px] border print:border-0">
          <button
            type="button"
            onClick={() => setDetalhes(!detalhes)}
            aria-expanded={detalhes}
            className="text-vest-navy flex w-full cursor-pointer items-center justify-between gap-3 px-5 py-4 text-left text-[16px] font-bold print:hidden">
            Ver comprovante e opções
            <span aria-hidden className={cn('text-[22px] transition-transform', detalhes && 'rotate-45')}>
              +
            </span>
          </button>
          {/* Fechado na tela, mas sempre aparece na impressão do comprovante */}
          <div className={cn('space-y-6 px-5 pb-6 print:block print:px-0', !detalhes && 'hidden')}>
            <Confirmacao inscricao={inscricao} modo="area" />
            {podeTrocar && (
              <div className="print:hidden">
                <TrocarHorario inscricao={inscricao} cpf={cpf} codigo={inscricao.codigo} aoTrocar={setInscricao} />
              </div>
            )}
          </div>
        </div>

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
          placeholder="Ex.: 7K3PQX"
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
        {esqueci && <EsqueciCodigo cpf={cpf} />}
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

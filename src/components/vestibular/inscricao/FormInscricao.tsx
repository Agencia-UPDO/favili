'use client';

import { formatPhone } from '@/components/empreend/formStyles';
import { diasProva, horariosProva, nomeOferta, Oferta, ofertas } from '@/data/inscricao';
import { FormaId, formas, vestibular } from '@/data/vestibular';
import { celularValido, cpfValido, emailValido, formatarCpf, idadeEm, soDigitos } from '@/utils/vestibular/validacao';
import { cn } from '@/utils/cn';
import { FormEvent, ReactNode, useMemo, useState } from 'react';
import IconeForma from '../Icones';
import { Seta } from '../ui';
import { chaveCpf } from './AreaCandidato';
import Confirmacao, { InscricaoConfirmada, rotaAreaCandidato } from './Confirmacao';
import { campoClass, opcaoAtiva, opcaoClass, rotuloClass } from './estilos';

type Campos = {
  cpf: string;
  nome: string;
  nascimento: string;
  celular: string;
  email: string;
  diaProva: string;
  horaProva: string;
  instituicaoOrigem: string;
  cursoOrigem: string;
  periodoAtual: string;
  atendimentoEspecial: string;
};

const vazio: Campos = {
  cpf: '',
  nome: '',
  nascimento: '',
  celular: '',
  email: '',
  diaProva: '',
  horaProva: '',
  instituicaoOrigem: '',
  cursoOrigem: '',
  periodoAtual: '',
  atendimentoEspecial: '',
};

// Agrupa os cursos do select por unidade e modalidade, na ordem da LP
const grupos = (lista: Oferta[]) => {
  const mapa = new Map<string, Oferta[]>();
  for (const o of lista) {
    const chave = o.modalidade === 'Presencial' ? `Presenciais · ${o.unidade}` : `EAD e semipresencial · ${o.unidade}`;
    mapa.set(chave, [...(mapa.get(chave) ?? []), o]);
  }
  return [...mapa.entries()];
};

// Cada bloco tem um id para o formulário rolar até o próximo passo; scroll-mt deixa espaço para o cabeçalho fixo
const Bloco = ({
  id,
  numero,
  titulo,
  children,
}: {
  id: string;
  numero: number;
  titulo: string;
  children: ReactNode;
}) => (
  <fieldset
    id={id}
    tabIndex={-1}
    className="border-stroke-2 scroll-mt-24 space-y-4 border-t pt-7 outline-none first:border-t-0 first:pt-0">
    <legend className="flex items-center gap-3">
      <span className="font-chamada bg-vest-blue flex size-9 items-center justify-center rounded-xl text-[19px] text-white">
        {numero}
      </span>
      <span className="font-chamada text-vest-navy text-[26px] md:text-[30px]">{titulo}</span>
    </legend>
    {children}
  </fieldset>
);

const Erro = ({ id, children }: { id: string; children?: string }) =>
  children ? (
    <p id={id} className="mt-1.5 text-[13px] font-semibold text-red-600">
      {children}
    </p>
  ) : null;

// Leva o candidato ao próximo passo: rola suave (ou direto, para quem pede menos movimento) e põe o foco no bloco,
// sem abrir o teclado do celular
const irPara = (id: string, bloco: ScrollLogicalPosition = 'start') =>
  requestAnimationFrame(() => {
    const alvo = document.getElementById(id);
    if (!alvo) {
      return;
    }
    const suave = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    alvo.scrollIntoView({ behavior: suave ? 'smooth' : 'auto', block: bloco });
    alvo.focus({ preventScroll: true });
  });

const FormInscricao = ({ formaInicial, ofertaInicial }: { formaInicial?: FormaId; ofertaInicial?: string }) => {
  const [forma, setForma] = useState<FormaId>(formaInicial ?? 'vestibular');
  const [ofertaId, setOfertaId] = useState(ofertaInicial ?? '');
  const [enemComProva, setEnemComProva] = useState(false);
  const [atendimento, setAtendimento] = useState(false);
  const [aceite, setAceite] = useState(false);
  const [campos, setCampos] = useState<Campos>(vazio);
  const [erros, setErros] = useState<Partial<Record<string, string>>>({});
  const [status, setStatus] = useState<'idle' | 'enviando'>('idle');
  const [aviso, setAviso] = useState('');
  const [jaInscrito, setJaInscrito] = useState(false);
  const [confirmada, setConfirmada] = useState<InscricaoConfirmada | null>(null);

  const disponiveis = useMemo(() => ofertas.filter((o) => o.formas.includes(forma)), [forma]);
  const oferta = disponiveis.find((o) => o.id === ofertaId);
  const fazProva = forma === 'vestibular' || (forma === 'enem' && enemComProva);
  const deOutraFaculdade = forma === 'segunda-graduacao' || forma === 'transferencia';

  const set = (campo: keyof Campos, valor: string) => {
    setCampos((c) => ({ ...c, [campo]: valor }));
    setErros((e) => ({ ...e, [campo]: undefined }));
  };

  const trocarForma = (id: FormaId) => {
    setForma(id);
    setErros({});
    // Transferência não existe em todas as ofertas: limpa o curso se ele deixar de valer
    if (ofertaId && !ofertas.find((o) => o.id === ofertaId)?.formas.includes(id)) {
      setOfertaId('');
    }
    // Enem tem a opção "fazer a prova também" logo abaixo: mostra ela; nas outras formas, segue para o curso
    irPara(id === 'enem' ? 'enem-com-prova' : 'passo-curso', id === 'enem' ? 'nearest' : 'start');
  };

  // Próximo bloco depois do curso e depois do horário
  const depoisDoCurso = () => (fazProva ? 'passo-prova' : deOutraFaculdade ? 'passo-origem' : 'passo-dados');
  const depoisDaProva = () => (deOutraFaculdade ? 'passo-origem' : 'passo-dados');

  const validar = () => {
    const e: Record<string, string> = {};
    if (!oferta) {
      e.oferta = 'Escolha o curso.';
    }
    if (fazProva && !campos.diaProva) {
      e.diaProva = 'Escolha o dia da prova.';
    }
    if (fazProva && !campos.horaProva) {
      e.horaProva = 'Escolha o horário da prova.';
    }
    if (deOutraFaculdade && !campos.instituicaoOrigem.trim()) {
      e.instituicaoOrigem = 'Informe a faculdade de origem.';
    }
    if (deOutraFaculdade && !campos.cursoOrigem.trim()) {
      e.cursoOrigem = 'Informe o curso de origem.';
    }
    if (forma === 'transferencia' && !campos.periodoAtual) {
      e.periodoAtual = 'Informe o período em que você está.';
    }
    if (!cpfValido(campos.cpf)) {
      e.cpf = 'CPF inválido. Confira os números.';
    }
    if (campos.nome.trim().split(/\s+/).length < 2) {
      e.nome = 'Escreva seu nome completo.';
    }
    const idade = idadeEm(campos.nascimento);
    if (!(idade >= 14 && idade <= 100)) {
      e.nascimento = 'Confira a data de nascimento.';
    }
    if (!celularValido(campos.celular)) {
      e.celular = 'Informe o WhatsApp com DDD.';
    }
    if (!emailValido(campos.email)) {
      e.email = 'Confira o e-mail.';
    }
    if (!aceite) {
      e.aceite = 'Para continuar, marque que leu e aceita o regulamento.';
    }
    return e;
  };

  const enviar = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setAviso('');
    const encontrados = validar();
    setErros(encontrados);
    // Leva ao primeiro erro, no meio da tela (o cabeçalho fixo não cobre)
    const primeiro = Object.keys(encontrados)[0];
    if (primeiro) {
      const alvo = document.getElementById(primeiro);
      alvo?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      alvo?.focus({ preventScroll: true });
      return;
    }

    setStatus('enviando');
    try {
      const res = await fetch('/api/vestibular/inscricao', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          forma,
          oferta: ofertaId,
          fazProva: forma === 'enem' ? enemComProva : undefined,
          ...campos,
          atendimentoEspecial: atendimento ? campos.atendimentoEspecial : '',
          aceite,
          origem: window.location.search.slice(1) || document.referrer || '',
        }),
      });
      const resposta = await res.json().catch(() => ({}));
      if (res.ok && resposta.ok) {
        setConfirmada(resposta.inscricao);
        // Conversão para o GTM (GTM-W6VKJFX6), sem dados pessoais
        const w = window as typeof window & { dataLayer?: Record<string, unknown>[] };
        w.dataLayer = w.dataLayer || [];
        w.dataLayer.push({
          event: 'generate_lead',
          form_id: 'vestibular-inscricao',
          forma_ingresso: forma,
          curso: oferta?.curso,
          modalidade: oferta?.modalidade,
          unidade: oferta?.unidade,
          faz_prova: fazProva,
        });
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }
      if (resposta.campo) {
        setErros({ [resposta.campo]: resposta.mensagem });
      }
      // CPF já inscrito: guarda o CPF nesta aba para a área do candidato abrir com ele preenchido
      setJaInscrito(!!resposta.jaInscrito);
      if (resposta.jaInscrito) {
        try {
          sessionStorage.setItem(chaveCpf, soDigitos(campos.cpf));
        } catch {
          // Sem armazenamento: o candidato digita o CPF de novo
        }
      }
      setAviso(resposta.mensagem ?? 'Não conseguimos concluir sua inscrição. Tente de novo.');
    } catch {
      setAviso('Sem conexão. Confira sua internet e tente de novo.');
    } finally {
      setStatus('idle');
    }
  };

  if (confirmada) {
    return <Confirmacao inscricao={confirmada} cpf={soDigitos(campos.cpf)} />;
  }

  const campo = (
    id: keyof Campos,
    rotulo: string,
    props: React.InputHTMLAttributes<HTMLInputElement> & { formatar?: (v: string) => string },
  ) => {
    const { formatar, className, ...resto } = props;
    return (
      <div className={className}>
        <label htmlFor={id} className={rotuloClass}>
          {rotulo}
        </label>
        <input
          id={id}
          name={id}
          value={campos[id]}
          onChange={(e) => set(id, formatar ? formatar(e.target.value) : e.target.value)}
          aria-invalid={!!erros[id]}
          aria-describedby={erros[id] ? `${id}-erro` : undefined}
          className={cn(campoClass, 'mt-2')}
          {...resto}
        />
        <Erro id={`${id}-erro`}>{erros[id]}</Erro>
      </div>
    );
  };

  let n = 0;

  return (
    <form onSubmit={enviar} noValidate className="space-y-8">
      <Bloco id="passo-forma" numero={++n} titulo="Como você quer entrar?">
        <div role="radiogroup" aria-label="Forma de ingresso" className="grid gap-3 sm:grid-cols-2">
          {formas.map((f) => {
            const ativa = forma === f.id;
            return (
              <button
                key={f.id}
                type="button"
                role="radio"
                aria-checked={ativa}
                onClick={() => trocarForma(f.id)}
                className={cn(
                  'flex items-start gap-3 rounded-2xl border p-4 text-left transition-colors',
                  ativa
                    ? 'border-vest-blue bg-primary-50 ring-vest-blue ring-1'
                    : 'border-stroke-3 hover:border-vest-blue bg-white',
                )}>
                <span
                  className={cn(
                    'flex size-10 shrink-0 items-center justify-center rounded-xl',
                    ativa ? 'bg-vest-blue text-white' : 'bg-primary-50 text-vest-blue',
                  )}>
                  <IconeForma id={f.id} className="size-5" />
                </span>
                <span>
                  <span className="text-vest-navy block text-[16px] font-bold">{f.rotulo}</span>
                  <span className="text-secondary/70 block text-[13px] leading-snug">{f.destaque}</span>
                </span>
              </button>
            );
          })}
        </div>
        {forma === 'enem' && (
          <label
            id="enem-com-prova"
            tabIndex={-1}
            className="flex cursor-pointer scroll-mt-24 items-start gap-3 rounded-2xl bg-white p-4 outline-none">
            <input
              type="checkbox"
              checked={enemComProva}
              onChange={(e) => setEnemComProva(e.target.checked)}
              className="accent-vest-blue mt-1 size-5 shrink-0"
            />
            <span className="text-[15px]">
              <strong className="text-vest-navy">Quero fazer a prova também.</strong> Com a nota do Enem você já tem
              40%; fazendo a prova em 21 ou 22/11 você concorre às bolsas de 50% a 100% (vale a maior).
            </span>
          </label>
        )}
      </Bloco>

      <Bloco id="passo-curso" numero={++n} titulo="Escolha o curso">
        <div>
          <label htmlFor="oferta" className={rotuloClass}>
            Curso, modalidade e unidade
          </label>
          <select
            id="oferta"
            value={oferta ? ofertaId : ''}
            onChange={(e) => {
              setOfertaId(e.target.value);
              setErros((x) => ({ ...x, oferta: undefined }));
              if (e.target.value) {
                irPara(depoisDoCurso());
              }
            }}
            aria-invalid={!!erros.oferta}
            className={cn(campoClass, 'mt-2 cursor-pointer pr-10')}>
            <option value="">Selecione</option>
            {grupos(disponiveis).map(([grupo, lista]) => (
              <optgroup key={grupo} label={grupo}>
                {lista.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.curso} ({o.modalidade}, {o.turno.toLowerCase()})
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
          <Erro id="oferta-erro">{erros.oferta}</Erro>
          {forma === 'transferencia' && (
            <p className="text-secondary/60 mt-2 text-[13px]">
              Transferência só para os cursos da unidade de Limoeiro do Norte.
            </p>
          )}
        </div>
      </Bloco>

      {fazProva && (
        <Bloco id="passo-prova" numero={++n} titulo="Dia e horário da prova">
          <p className="-mt-1 text-[15px]">
            A prova é on-line e dura até {vestibular.duracaoHoras} horas. Escolha quando vai começar.
          </p>
          <div>
            <span className={rotuloClass} id="diaProva-rotulo">
              Dia
            </span>
            <div role="radiogroup" aria-labelledby="diaProva-rotulo" className="mt-2 grid gap-3 sm:grid-cols-2">
              {diasProva.map((d, i) => (
                <button
                  key={d.id}
                  id={i === 0 ? 'diaProva' : undefined}
                  type="button"
                  role="radio"
                  aria-checked={campos.diaProva === d.id}
                  onClick={() => {
                    set('diaProva', d.id);
                    if (!campos.horaProva) {
                      irPara('grupo-hora', 'center');
                    }
                  }}
                  className={cn(opcaoClass, 'h-12', campos.diaProva === d.id && opcaoAtiva)}>
                  {d.rotulo}
                </button>
              ))}
            </div>
            <Erro id="diaProva-erro">{erros.diaProva}</Erro>
          </div>
          <div id="grupo-hora" tabIndex={-1} className="scroll-mt-24 outline-none">
            <span className={rotuloClass} id="horaProva-rotulo">
              Horário de início
            </span>
            <div
              role="radiogroup"
              aria-labelledby="horaProva-rotulo"
              className="mt-2 grid grid-cols-3 gap-3 sm:grid-cols-6">
              {horariosProva.map((h, i) => (
                <button
                  key={h}
                  id={i === 0 ? 'horaProva' : undefined}
                  type="button"
                  role="radio"
                  aria-checked={campos.horaProva === h}
                  onClick={() => {
                    set('horaProva', h);
                    irPara(depoisDaProva());
                  }}
                  className={cn(opcaoClass, 'h-11', campos.horaProva === h && opcaoAtiva)}>
                  {h.replace(':00', 'h')}
                </button>
              ))}
            </div>
            <Erro id="horaProva-erro">{erros.horaProva}</Erro>
          </div>
        </Bloco>
      )}

      {deOutraFaculdade && (
        <Bloco
          id="passo-origem"
          numero={++n}
          titulo={forma === 'transferencia' ? 'Onde você estuda hoje' : 'Sua graduação'}>
          <div className="grid gap-4 sm:grid-cols-2">
            {campo('instituicaoOrigem', 'Faculdade de origem', {
              placeholder: 'Nome da instituição',
              autoComplete: 'organization',
            })}
            {campo('cursoOrigem', 'Curso', { placeholder: 'Ex.: Administração' })}
            {forma === 'transferencia' && (
              <div>
                <label htmlFor="periodoAtual" className={rotuloClass}>
                  Período em que você está
                </label>
                <select
                  id="periodoAtual"
                  value={campos.periodoAtual}
                  onChange={(e) => set('periodoAtual', e.target.value)}
                  aria-invalid={!!erros.periodoAtual}
                  className={cn(campoClass, 'mt-2 cursor-pointer')}>
                  <option value="">Selecione</option>
                  {Array.from({ length: 10 }, (_, i) => `${i + 1}º período`).map((p) => (
                    <option key={p}>{p}</option>
                  ))}
                </select>
                <Erro id="periodoAtual-erro">{erros.periodoAtual}</Erro>
              </div>
            )}
          </div>
        </Bloco>
      )}

      <Bloco id="passo-dados" numero={++n} titulo="Seus dados">
        <div className="grid gap-4 sm:grid-cols-2">
          {campo('cpf', 'CPF', {
            inputMode: 'numeric',
            autoComplete: 'off',
            placeholder: '000.000.000-00',
            formatar: formatarCpf,
          })}
          {campo('nascimento', 'Data de nascimento', {
            type: 'date',
            autoComplete: 'bday',
            max: '2012-12-31',
            min: '1926-01-01',
          })}
          {campo('nome', 'Nome completo', {
            autoComplete: 'name',
            placeholder: 'Seu nome',
            className: 'sm:col-span-2',
          })}
          {campo('celular', 'WhatsApp', {
            type: 'tel',
            inputMode: 'tel',
            autoComplete: 'tel',
            placeholder: '(88) 90000-0000',
            formatar: formatPhone,
          })}
          {campo('email', 'E-mail', {
            type: 'email',
            inputMode: 'email',
            autoComplete: 'email',
            placeholder: 'voce@email.com',
          })}
        </div>
        <p className="text-secondary/60 text-[13px]">
          É por esse WhatsApp e e-mail que você recebe o acesso à prova e o resultado.
        </p>
      </Bloco>

      <div className="space-y-4">
        <label className="flex cursor-pointer items-start gap-3">
          <input
            type="checkbox"
            checked={atendimento}
            onChange={(e) => setAtendimento(e.target.checked)}
            className="accent-vest-blue mt-0.5 size-6 shrink-0"
          />
          <span className="text-[15px]">
            Preciso de atendimento especial na prova (ex.: tempo adicional, fonte ampliada).
          </span>
        </label>
        {atendimento && (
          <textarea
            id="atendimentoEspecial"
            value={campos.atendimentoEspecial}
            onChange={(e) => set('atendimentoEspecial', e.target.value)}
            rows={3}
            maxLength={500}
            placeholder="Conte o que você precisa. A Faculdade Vidal entra em contato antes da prova."
            className={cn(campoClass, 'h-auto py-3')}
          />
        )}

        <label className="flex cursor-pointer items-start gap-3">
          <input
            id="aceite"
            type="checkbox"
            checked={aceite}
            onChange={(e) => {
              setAceite(e.target.checked);
              setErros((x) => ({ ...x, aceite: undefined }));
            }}
            className="accent-vest-blue mt-0.5 size-6 shrink-0"
          />
          <span className="text-[15px]">
            Li e aceito o{' '}
            <a
              href={vestibular.regulamento}
              target="_blank"
              rel="noopener"
              className="text-vest-blue font-semibold underline">
              regulamento do vestibular
            </a>{' '}
            e autorizo a Faculdade Vidal a falar comigo por WhatsApp e e-mail sobre a inscrição.
          </span>
        </label>
        <Erro id="aceite-erro">{erros.aceite}</Erro>
      </div>

      {aviso && (
        <div role="alert" className="space-y-3 rounded-2xl bg-red-50 p-4 text-[15px] font-semibold text-red-700">
          <p>{aviso}</p>
          {jaInscrito && (
            <a
              href={rotaAreaCandidato}
              className="bg-vest-blue hover:bg-vest-navy inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-white transition-colors">
              Entrar na minha inscrição <Seta />
            </a>
          )}
        </div>
      )}

      <button
        type="submit"
        disabled={status === 'enviando'}
        className="bg-vest-yellow text-vest-navy hover:bg-vest-navy flex h-14 w-full cursor-pointer items-center justify-center gap-2 rounded-full text-[18px] font-extrabold transition-colors duration-300 hover:text-white disabled:cursor-wait disabled:opacity-70">
        {status === 'enviando' ? 'Enviando…' : 'Confirmar inscrição grátis'}
        {status !== 'enviando' && <Seta />}
      </button>
      {oferta && <p className="text-secondary/60 -mt-4 text-center text-[13px]">{nomeOferta(oferta)}</p>}
    </form>
  );
};

export default FormInscricao;

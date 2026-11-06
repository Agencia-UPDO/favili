'use client';

import { areasEnem, enemAprovado, enemMediaMinima, mediaEnem, notaMinimaBolsa, NotasEnem } from '@/data/bolsas';
import { diasProva, horariosProva, nomeOferta, ofertas, ofertasAtivas, StatusDocumento } from '@/data/inscricao';
import { FormaId, formas } from '@/data/vestibular';
import { cn } from '@/utils/cn';
import { formatarCpf } from '@/utils/vestibular/validacao';
import { FormEvent, Fragment, ReactNode, useCallback, useEffect, useState } from 'react';
import Resumo, { DadosResumo } from './Resumo';

// Painel interno da faculdade: acompanhar inscrições, conferir a prévia do resultado, publicar e baixar planilhas

type Dados = {
  resumo: {
    inscricoes: number;
    fazemProva: number;
    iniciaram: number;
    entregaram: number;
    documentosParaAnalisar: number;
    porForma: { forma: string; total: number }[];
  };
  estatisticas: DadosResumo;
  inscricoes: {
    numero: number;
    criadoEm: string;
    nome: string;
    cpf: string;
    nascimento: string | null;
    celular: string;
    email: string;
    forma: string;
    origemAcademica: string;
    origemValida: boolean;
    curso: string;
    prova: string;
    situacao: string;
    nota: number | null;
    edicao: {
      ofertaId: string;
      fazProva: boolean;
      dia: string | null;
      hora: string | null;
      instituicaoOrigem: string;
      cursoOrigem: string;
      periodoAtual: string;
      trava: string | null;
      historico: RegistroEdicao[];
      contatos: { por: string; em: string; campos: ('email' | 'celular' | 'nascimento')[]; codigoReenviado: boolean }[];
    };
    atendimentoEspecial: string | null;
    documentoStatus: StatusDocumento | null;
    documentoObs: string | null;
    documentoRevisadoEm: string | null;
    documentoRevisadoPor: string | null;
    documentoEnviadoEm: string | null;
    formaId: string;
    enemAno: number | null;
    enemNotas: Partial<NotasEnem> | null;
    enemMedia: number | null;
    documentos: { id: string; item: string; nome: string; tamanho: number }[];
  }[];
  previa: {
    numero: number;
    iniciais: string;
    oferta: string;
    nota: number;
    notaMatematica: number;
    aprovado: boolean;
    ajuste: Ajuste | null;
    nome: string;
    cpf: string;
    email: string;
    celular: string;
    classificacaoGeral: number | null;
    classificacaoOferta: number | null;
    bolsa: number | null;
    bolsaRegra?: number | null;
    avisos?: string[];
    resultadoEmailEm: string | null;
  }[];
  publicadoEm: string | null;
  importacoes?: { por: string; em: string; criadas: number; avisar: boolean }[];
  filaSei?: ResumoFila;
};

type ResumoEdicao = { oferta?: string; forma: FormaId; fazProva: boolean; dia: string | null; hora: string | null };
type RegistroEdicao = {
  por: string;
  em: string;
  antes: ResumoEdicao;
  depois: ResumoEdicao;
  avisouPorEmail: boolean;
  rd: boolean;
};
type Ajuste = { situacao: 'aprovado' | 'reprovado' | null; bolsa: number | null; obs: string; em: string };
type Linha = Dados['previa'][number];

const faixasBolsa = Object.keys(notaMinimaBolsa)
  .map(Number)
  .sort((a, b) => b - a);

// Ajuste manual de uma linha (só antes de publicar): situação, faixa de bolsa e observação.
// A bolsa pode ser escolhida mesmo com a situação "pela nota": para quem a nota reprovou, escolher uma bolsa aprova.
// Reprovar limpa a bolsa. Fugir da nota mínima ou da cota só gera aviso (vem do servidor em linha.avisos).
const AjusteLinha = ({
  linha,
  travado,
  salvar,
}: {
  linha: Linha;
  travado: boolean;
  salvar: (ajuste: Omit<Ajuste, 'em'>) => void;
}) => {
  const atual = {
    situacao: linha.ajuste?.situacao ?? null,
    bolsa: linha.ajuste?.bolsa ?? null,
    obs: linha.ajuste?.obs ?? '',
  };
  const [obs, setObs] = useState(atual.obs);
  const campo = 'border-stroke-3 rounded-lg border bg-white px-2 py-1 text-[13px] disabled:opacity-60';
  return (
    <div className="flex min-w-[300px] flex-wrap items-center gap-1.5">
      <select
        value={atual.situacao ?? ''}
        disabled={travado}
        aria-label={`Situação da inscrição ${linha.numero}`}
        onChange={(e) => {
          const situacao = (e.target.value || null) as Ajuste['situacao'];
          salvar({ ...atual, obs, situacao, bolsa: situacao === 'reprovado' ? null : atual.bolsa });
        }}
        className={cn(campo, atual.situacao && 'border-vest-blue text-vest-blue font-bold')}>
        <option value="">Situação: pela nota</option>
        <option value="aprovado">Aprovar</option>
        <option value="reprovado">Reprovar</option>
      </select>
      <select
        value={atual.bolsa ?? ''}
        disabled={travado || atual.situacao === 'reprovado'}
        title={atual.situacao === 'reprovado' ? 'Reprovado não tem bolsa' : undefined}
        aria-label={`Bolsa da inscrição ${linha.numero}`}
        onChange={(e) => {
          const bolsa = e.target.value === '' ? null : Number(e.target.value);
          // Bolsa para quem a nota reprovou: passa a ser aprovado
          const situacao = bolsa !== null && !linha.aprovado ? 'aprovado' : atual.situacao;
          salvar({ ...atual, obs, situacao, bolsa });
        }}
        className={cn(campo, atual.bolsa !== null && 'border-vest-blue text-vest-blue font-bold')}>
        <option value="">
          {linha.aprovado
            ? `Pela regra (${linha.bolsaRegra ? `${linha.bolsaRegra}%` : 'sem bolsa, 40%'})`
            : 'Pela regra (reprovado)'}
        </option>
        {faixasBolsa.map((p) => (
          <option key={p} value={p}>
            {p}%
          </option>
        ))}
        <option value="0">Sem bolsa (40%)</option>
      </select>
      <input
        value={obs}
        disabled={travado}
        maxLength={300}
        placeholder="Observação"
        aria-label={`Observação da inscrição ${linha.numero}`}
        onChange={(e) => setObs(e.target.value)}
        onBlur={() => obs !== atual.obs && salvar({ ...atual, obs })}
        className={cn(campo, 'w-[140px]')}
      />
      {(linha.avisos ?? []).map((a) => (
        <span key={a} className="w-full rounded-md bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-900">
          ⚠ {a}
        </span>
      ))}
      {linha.ajuste && (
        <span
          title={`Ajustado em ${dataHora(linha.ajuste.em)}`}
          className="bg-vest-blue rounded-full px-2 py-0.5 text-[11px] font-bold text-white">
          ajustado manualmente
        </span>
      )}
    </div>
  );
};

const rotuloDocumento: Record<StatusDocumento, { texto: string; cor: string }> = {
  pendente: { texto: 'Falta enviar', cor: 'bg-stroke-2 text-secondary' },
  enviado: { texto: 'Para analisar', cor: 'bg-amber-100 text-amber-900' },
  aprovado: { texto: 'Aprovado', cor: 'bg-green-100 text-green-900' },
  recusado: { texto: 'Pediu outro', cor: 'bg-red-100 text-red-800' },
  reprovado: { texto: 'Não aprovado (Enem)', cor: 'bg-red-100 text-red-800' },
};

// Enem: a equipe confere as notas com o boletim (pré-preenchidas pelo candidato) e confirma; o sistema decide
const ConferirEnem = ({
  inscricao,
  travado,
  confirmar,
}: {
  inscricao: Dados['inscricoes'][number];
  travado: boolean;
  confirmar: (ano: string, notas: Record<string, string>) => void;
}) => {
  const [ano, setAno] = useState(inscricao.enemAno ? String(inscricao.enemAno) : '');
  const [notas, setNotas] = useState<Record<string, string>>(() =>
    Object.fromEntries(areasEnem.map((a) => [a.id, inscricao.enemNotas?.[a.id]?.toString() ?? ''])),
  );
  const numeros = Object.fromEntries(areasEnem.map((a) => [a.id, Number(notas[a.id].replace(',', '.'))])) as NotasEnem;
  const completas = areasEnem.every((a) => notas[a.id].trim() !== '' && numeros[a.id] >= 0 && numeros[a.id] <= 1000);
  const campo = 'border-stroke-3 h-8 w-full rounded-lg border bg-white px-1.5 text-[12px]';
  return (
    <div className="space-y-1.5 rounded-xl border border-dashed border-amber-300 p-2">
      <div className="grid grid-cols-3 gap-1">
        <input
          value={ano}
          onChange={(e) => setAno(e.target.value)}
          placeholder="Ano"
          aria-label="Ano do Enem"
          className={campo}
        />
        {areasEnem.map((a) => (
          <input
            key={a.id}
            value={notas[a.id]}
            onChange={(e) => setNotas({ ...notas, [a.id]: e.target.value })}
            placeholder={a.rotulo.split(' ').pop()}
            title={a.rotulo}
            aria-label={a.rotulo}
            inputMode="decimal"
            className={campo}
          />
        ))}
      </div>
      {completas && (
        <p className={cn('text-[12px] font-bold', enemAprovado(numeros) ? 'text-green-700' : 'text-red-700')}>
          Média {mediaEnem(numeros).toFixed(1).replace('.', ',')} — {enemAprovado(numeros) ? 'aprovado' : 'reprovado'}{' '}
          <span className="font-normal opacity-70">(mín. {enemMediaMinima}, redação &gt; 0)</span>
        </p>
      )}
      <button
        type="button"
        disabled={travado || !completas}
        onClick={() => confirmar(ano, notas)}
        className="bg-vest-blue cursor-pointer rounded-full px-2.5 py-1 text-[12px] font-bold text-white disabled:opacity-50">
        Confirmar notas
      </button>
    </div>
  );
};

type LinhaInscricao = Dados['inscricoes'][number];

// "Notas informadas: média prévia 488,0 · redação 0" (ou quantas notas faltam)
const notasInformadas = (i: LinhaInscricao) => {
  const preenchidas = areasEnem.filter((a) => typeof i.enemNotas?.[a.id] === 'number');
  if (!preenchidas.length) {
    return '';
  }
  if (preenchidas.length < areasEnem.length) {
    return `Notas informadas pelo candidato: ${preenchidas.length} de ${areasEnem.length}`;
  }
  const notas = i.enemNotas as NotasEnem;
  return `Notas informadas: média prévia ${mediaEnem(notas).toFixed(1).replace('.', ',')}${
    notas.redacao > 0 ? '' : ' · redação zerada'
  }${i.documentos.length ? '' : ' · sem boletim ainda'}`;
};

const Detalhe = ({ rotulo, children }: { rotulo: string; children: ReactNode }) =>
  children ? (
    <div className="flex gap-2">
      <dt className="text-secondary/60 shrink-0">{rotulo}:</dt>
      <dd>{children}</dd>
    </div>
  ) : null;

// Situação dos documentos e as ações do dia (aprovar, pedir outro, conferir notas do Enem)
// Código de acesso do candidato: ver ou gerar um novo (o anterior deixa de valer). Fica registrado quem e quando.
const CodigoAcesso = ({ numero, revisor }: { numero: number; revisor: string }) => {
  const [codigo, setCodigo] = useState('');
  const [historico, setHistorico] = useState<{ acao: string; por: string; em: string }[]>([]);
  const [aviso, setAviso] = useState('');
  const [ocupado, setOcupado] = useState(false);

  const pedir = async (acao: 'ver-codigo' | 'novo-codigo' | 'reenviar-codigo') => {
    if (
      acao === 'novo-codigo' &&
      !window.confirm(
        'Gerar um código novo? O código antigo deixa de funcionar e o candidato recebe o novo por e-mail.',
      )
    ) {
      return;
    }
    if (
      acao === 'reenviar-codigo' &&
      !window.confirm('Reenviar o código atual para o e-mail cadastrado do candidato?')
    ) {
      return;
    }
    setOcupado(true);
    setAviso('');
    const res = await fetch('/api/vestibular/painel', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ acao, numero, por: revisor }),
    }).catch(() => null);
    const json = res ? await res.json().catch(() => ({})) : {};
    setOcupado(false);
    if (!res?.ok) {
      setAviso(json.mensagem ?? 'Não deu certo. Tente de novo.');
      return;
    }
    if (acao === 'reenviar-codigo') {
      setAviso(`Código reenviado para ${json.email}.`);
    } else {
      setCodigo(json.codigo);
    }
    setHistorico(json.historico ?? []);
  };

  return (
    <div className="space-y-1.5 text-[13px]">
      <p className="text-secondary/60">Código de acesso</p>
      {codigo ? <p className="text-vest-navy font-mono text-[18px] font-bold tracking-[0.15em]">{codigo}</p> : null}
      <div className="flex flex-wrap gap-1.5">
        {!codigo && (
          <button
            type="button"
            disabled={ocupado}
            onClick={() => pedir('ver-codigo')}
            className="border-stroke-3 cursor-pointer rounded-full border px-2.5 py-1 text-[12px] font-bold">
            Ver código
          </button>
        )}
        <button
          type="button"
          disabled={ocupado}
          onClick={() => pedir('reenviar-codigo')}
          className="bg-vest-blue cursor-pointer rounded-full px-2.5 py-1 text-[12px] font-bold text-white">
          Reenviar código por e-mail
        </button>
        <button
          type="button"
          disabled={ocupado}
          onClick={() => pedir('novo-codigo')}
          className="border-stroke-3 cursor-pointer rounded-full border px-2.5 py-1 text-[12px] font-bold">
          Gerar novo código
        </button>
      </div>
      <p className="text-secondary/60 text-[11px]">O código vai só por e-mail (não mande por WhatsApp).</p>
      {aviso && (
        <p
          className={cn(
            'text-[12px] font-semibold',
            aviso.startsWith('Código reenviado') ? 'text-green-700' : 'text-red-700',
          )}>
          {aviso}
        </p>
      )}
      {historico.length > 0 && (
        <ul className="text-secondary/60 text-[11px]">
          {historico.map((h) => (
            <li key={h.em}>
              {h.acao === 'gerar' ? 'Gerado' : h.acao === 'reenviar' ? 'Reenviado por e-mail' : 'Visto'} por {h.por} em{' '}
              {dataHora(h.em)}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

const CelulaDocumentos = ({
  inscricao: i,
  ocupado,
  revisar,
  conferir,
}: {
  inscricao: LinhaInscricao;
  ocupado: boolean;
  revisar: (numero: number, decisao: 'aprovado' | 'recusado' | 'enviado') => void;
  conferir: () => void;
}) => {
  if (!i.documentoStatus) {
    return <span className="text-secondary/40">—</span>;
  }
  const analisado = i.documentoStatus === 'aprovado' || i.documentoStatus === 'reprovado';
  const botao = 'cursor-pointer rounded-full px-2.5 py-1 text-[12px] font-bold disabled:opacity-50';
  return (
    <div className="space-y-1.5">
      <div className="flex flex-wrap items-center gap-1.5">
        <span className={cn('rounded-full px-2 py-0.5 text-[12px] font-bold', rotuloDocumento[i.documentoStatus].cor)}>
          {rotuloDocumento[i.documentoStatus].texto}
        </span>
        {i.documentos.length > 0 && (
          <span className="text-secondary/60 text-[12px]">
            {i.documentos.length} arquivo{i.documentos.length > 1 && 's'}
          </span>
        )}
        {i.enemMedia !== null && (
          <span className="text-[12px] font-semibold">média {Number(i.enemMedia).toFixed(1).replace('.', ',')}</span>
        )}
      </div>
      {/* Notas que o candidato digitou, antes da conferência da equipe (podem chegar antes do boletim) */}
      {i.formaId === 'enem' && i.enemMedia === null && notasInformadas(i) && (
        <p className="text-secondary/70 text-[12px]">{notasInformadas(i)}</p>
      )}
      <div className="flex flex-wrap gap-1.5">
        {!analisado && i.documentos.length > 0 && i.formaId === 'enem' && (
          <button type="button" onClick={conferir} className={cn(botao, 'bg-vest-blue text-white')}>
            Conferir notas
          </button>
        )}
        {!analisado && i.documentos.length > 0 && i.formaId !== 'enem' && (
          <button
            type="button"
            disabled={ocupado}
            onClick={() => revisar(i.numero, 'aprovado')}
            className={cn(botao, 'bg-green-600 text-white')}>
            Aprovar
          </button>
        )}
        {!analisado && i.documentoStatus !== 'recusado' && i.documentos.length > 0 && (
          <button
            type="button"
            disabled={ocupado}
            onClick={() => revisar(i.numero, 'recusado')}
            className={cn(botao, 'border-stroke-3 border')}>
            Pedir outro
          </button>
        )}
        {analisado && (
          <button
            type="button"
            disabled={ocupado}
            onClick={() => revisar(i.numero, 'enviado')}
            className="text-secondary/70 cursor-pointer text-[12px] underline">
            Desfazer decisão
          </button>
        )}
      </div>
    </div>
  );
};

const rotuloCampoContato = { email: 'e-mail', celular: 'WhatsApp', nascimento: 'data de nascimento' };

// Corrigir dados de contato (equipe): e-mail, WhatsApp e data de nascimento, com antes → depois e a senha do painel.
// O registro guarda só quais campos mudaram. Opção de reenviar o código para o e-mail (novo).
const EditarContato = ({
  inscricao: i,
  revisor,
  salvo,
}: {
  inscricao: LinhaInscricao;
  revisor: string;
  salvo: () => void;
}) => {
  const [aberto, setAberto] = useState(false);
  const [email, setEmail] = useState(i.email);
  const [celular, setCelular] = useState(i.celular);
  const [nascimento, setNascimento] = useState(i.nascimento ?? '');
  const [reenviarCodigo, setReenviarCodigo] = useState(true);
  const [senha, setSenha] = useState('');
  const [previa, setPrevia] = useState<{
    antes: { email: string; celular: string; nascimento: string | null };
    depois: { email: string; celular: string; nascimento: string | null };
    mudou: ('email' | 'celular' | 'nascimento')[];
  } | null>(null);
  const [aviso, setAviso] = useState('');
  const [ocupado, setOcupado] = useState(false);

  const mudar = (set: (v: string) => void) => (v: string) => {
    set(v);
    setPrevia(null);
    setAviso('');
  };

  const enviar = async (etapa: 'previa' | 'salvar') => {
    setOcupado(true);
    setAviso('');
    const res = await fetch('/api/vestibular/painel', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        acao: 'editar-contato',
        etapa,
        numero: i.numero,
        por: revisor,
        email,
        celular,
        nascimento,
        reenviarCodigo,
        senha: etapa === 'salvar' ? senha : undefined,
      }),
    }).catch(() => null);
    const json = res ? await res.json().catch(() => ({})) : {};
    setOcupado(false);
    if (!res?.ok) {
      setAviso(json.mensagem ?? 'Não deu certo. Tente de novo.');
      return;
    }
    if (etapa === 'previa') {
      setPrevia(json);
      return;
    }
    setSenha('');
    setPrevia(null);
    setAberto(false);
    window.alert(
      [
        'Dados corrigidos.',
        json.mudou.some((c: string) => c !== 'nascimento')
          ? json.rd
            ? 'RD: atualizada.'
            : 'RD: não confirmou o envio (dá para usar "Reenviar para a RD").'
          : '',
        reenviarCodigo
          ? json.codigo
            ? 'Código reenviado por e-mail.'
            : 'O código NÃO foi reenviado (e-mail falhou ou não configurado).'
          : '',
      ]
        .filter(Boolean)
        .join('\n'),
    );
    salvo();
  };

  const campo = 'border-stroke-3 h-9 w-full rounded-lg border bg-white px-2 text-[13px]';
  const linha = (rotulo: string, a: string, d: string) =>
    a === d ? null : (
      <p key={rotulo}>
        <span className="text-secondary/70">{rotulo}:</span> {a || '(vazio)'} → <strong>{d}</strong>
      </p>
    );
  return (
    <div className="border-vest-blue/40 mb-3 space-y-2 rounded-xl border border-dashed p-3 text-[13px]">
      <div className="flex items-center justify-between gap-2">
        <p className="text-vest-navy font-bold">Dados de contato</p>
        <button
          type="button"
          onClick={() => setAberto(!aberto)}
          className="text-vest-blue cursor-pointer text-[12px] font-bold hover:underline">
          {aberto ? 'Fechar' : 'Corrigir e-mail, WhatsApp ou nascimento'}
        </button>
      </div>
      {aberto && (
        <div className="space-y-2">
          <div className="grid gap-2 sm:grid-cols-3">
            <label className="block">
              <span className="text-secondary/60 text-[12px]">E-mail</span>
              <input value={email} onChange={(e) => mudar(setEmail)(e.target.value)} className={campo} />
            </label>
            <label className="block">
              <span className="text-secondary/60 text-[12px]">WhatsApp (com DDD)</span>
              <input value={celular} onChange={(e) => mudar(setCelular)(e.target.value)} className={campo} />
            </label>
            <label className="block">
              <span className="text-secondary/60 text-[12px]">Data de nascimento</span>
              <input
                type="date"
                value={nascimento}
                onChange={(e) => mudar(setNascimento)(e.target.value)}
                className={campo}
              />
            </label>
          </div>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={reenviarCodigo} onChange={(e) => setReenviarCodigo(e.target.checked)} />
            Reenviar o código de acesso para o e-mail {email !== i.email ? 'novo' : 'cadastrado'}
          </label>
          {!previa ? (
            <button
              type="button"
              disabled={ocupado}
              onClick={() => enviar('previa')}
              className="bg-vest-blue cursor-pointer rounded-full px-3 py-1.5 text-[12px] font-bold text-white disabled:opacity-50">
              Revisar correção
            </button>
          ) : (
            <div className="space-y-2 rounded-lg bg-amber-50 p-2">
              <p className="font-bold">Confirme a correção da inscrição nº {i.numero}:</p>
              {linha('E-mail', previa.antes.email, previa.depois.email)}
              {linha('WhatsApp', celular_(previa.antes.celular), celular_(previa.depois.celular))}
              {linha(
                'Nascimento',
                previa.antes.nascimento ? dataBr(previa.antes.nascimento) : '',
                previa.depois.nascimento ? dataBr(previa.depois.nascimento) : '',
              )}
              <p className="text-secondary/70 text-[12px]">
                {previa.mudou.some((c) => c !== 'nascimento')
                  ? 'O e-mail/WhatsApp novo vai para a RD como atualização (sem WhatsApp). A data de nascimento nunca vai para a RD.'
                  : 'A data de nascimento fica só no nosso sistema (não vai para a RD).'}
              </p>
              <input
                type="password"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                placeholder="Senha do painel para confirmar"
                aria-label="Senha do painel"
                autoComplete="current-password"
                className={campo}
              />
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={ocupado || !senha}
                  onClick={() => enviar('salvar')}
                  className="cursor-pointer rounded-full bg-green-600 px-3 py-1.5 text-[12px] font-bold text-white disabled:opacity-50">
                  Salvar correção
                </button>
                <button
                  type="button"
                  onClick={() => setPrevia(null)}
                  className="border-stroke-3 cursor-pointer rounded-full border px-3 py-1.5 text-[12px] font-bold">
                  Voltar
                </button>
              </div>
            </div>
          )}
          {aviso && <p className="text-[12px] font-semibold text-red-700">{aviso}</p>}
        </div>
      )}
      {i.edicao.contatos.length > 0 && (
        <ul className="text-secondary/60 space-y-0.5 text-[11px]">
          {i.edicao.contatos.map((h) => (
            <li key={h.em}>
              {dataHora(h.em)} · {h.por}: corrigiu {h.campos.map((c) => rotuloCampoContato[c]).join(', ')}
              {h.codigoReenviado ? ' · código reenviado' : ''}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
const celular_ = (c: string) => c.replace(/^(\d{2})(\d{5})(\d{4})$/, '($1) $2-$3');

const rotuloForma = (id: string) => formas.find((f) => f.id === id)?.rotulo ?? id;
const rotuloOferta = (id: string) => {
  const o = ofertas.find((x) => x.id === id);
  return o ? nomeOferta(o) : id;
};
// "Psicologia · Presencial · Limoeiro do Norte · Vestibular · prova 21/11 às 8h" / "… · 2ª graduação · sem prova"
const descreverEdicao = (r: ResumoEdicao) =>
  `${r.oferta ? `${rotuloOferta(r.oferta)} · ` : ''}${rotuloForma(r.forma)} · ${
    r.fazProva && r.dia && r.hora ? `prova ${dataBr(r.dia).slice(0, 5)} às ${Number(r.hora.slice(0, 2))}h` : 'sem prova'
  }`;

type PreviaEdicao = { antes: ResumoEdicao; depois: ResumoEdicao; emailConfigurado: boolean };

// Editar inscrição (equipe): curso, forma de ingresso e dia/horário da prova, com as regras da inscrição pública.
// 1) "Revisar alteração" valida no servidor e mostra antes → depois; 2) "Salvar" pede a senha do painel de novo.
// Número de inscrição e código de acesso não mudam; documentos, origem e notas do Enem antigas ficam no histórico.
const EditarInscricao = ({
  inscricao: i,
  revisor,
  salvo,
}: {
  inscricao: LinhaInscricao;
  revisor: string;
  salvo: () => void;
}) => {
  const e = i.edicao;
  const [aberto, setAberto] = useState(false);
  const [oferta, setOferta] = useState(e.ofertaId);
  const [forma, setForma] = useState<FormaId>(i.formaId as FormaId);
  // Formas aceitas pelo curso escolhido (o atual, mesmo fora desta edição, ou um dos abertos)
  const formasDoCurso = ofertas.find((o) => o.id === oferta)?.formas ?? formas.map((f) => f.id);
  const [fazProva, setFazProva] = useState(e.fazProva);
  const [dia, setDia] = useState(e.dia ?? '');
  const [hora, setHora] = useState(e.hora ?? '');
  const [instituicaoOrigem, setInstituicaoOrigem] = useState(e.instituicaoOrigem);
  const [cursoOrigem, setCursoOrigem] = useState(e.cursoOrigem);
  const [periodoAtual, setPeriodoAtual] = useState(e.periodoAtual);
  const [avisar, setAvisar] = useState(true);
  const [senha, setSenha] = useState('');
  const [previa, setPrevia] = useState<PreviaEdicao | null>(null);
  const [aviso, setAviso] = useState('');
  const [ocupado, setOcupado] = useState(false);

  const comProva = forma === 'vestibular' || (forma === 'enem' && fazProva);
  const deOutraFaculdade = forma === 'segunda-graduacao' || forma === 'transferencia';

  // Qualquer mudança no formulário desfaz a revisão: precisa revisar de novo antes de salvar
  const mudar =
    <T,>(set: (v: T) => void) =>
    (v: T) => {
      set(v);
      setPrevia(null);
      setAviso('');
    };

  const enviar = async (etapa: 'previa' | 'salvar') => {
    setOcupado(true);
    setAviso('');
    const res = await fetch('/api/vestibular/painel', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        acao: 'editar-inscricao',
        etapa,
        numero: i.numero,
        por: revisor,
        oferta,
        forma,
        fazProva: comProva,
        dia: comProva ? dia : null,
        hora: comProva ? hora : null,
        instituicaoOrigem,
        cursoOrigem,
        periodoAtual,
        avisar,
        senha: etapa === 'salvar' ? senha : undefined,
      }),
    }).catch(() => null);
    const json = res ? await res.json().catch(() => ({})) : {};
    setOcupado(false);
    if (!res?.ok) {
      setAviso(json.mensagem ?? 'Não deu certo. Tente de novo.');
      return;
    }
    if (etapa === 'previa') {
      setPrevia({ antes: json.antes, depois: json.depois, emailConfigurado: json.emailConfigurado });
      return;
    }
    setSenha('');
    setPrevia(null);
    setAberto(false);
    window.alert(
      [
        'Inscrição atualizada.',
        json.rd ? 'RD: atualizada.' : 'RD: não confirmou o envio (dá para usar "Reenviar para a RD").',
        json.avisar
          ? json.email
            ? 'E-mail enviado ao candidato.'
            : 'O e-mail ao candidato NÃO saiu (não configurado ou falhou): avise por outro canal.'
          : 'O candidato não foi avisado por e-mail.',
      ].join('\n'),
    );
    salvo();
  };

  const campo = 'border-stroke-3 h-9 w-full rounded-lg border bg-white px-2 text-[13px]';
  return (
    <div className="border-vest-blue/40 space-y-2 rounded-xl border border-dashed p-3 text-[13px]">
      <div className="flex items-center justify-between gap-2">
        <p className="text-vest-navy font-bold">Editar inscrição</p>
        {!e.trava && (
          <button
            type="button"
            onClick={() => setAberto(!aberto)}
            className="text-vest-blue cursor-pointer text-[12px] font-bold hover:underline">
            {aberto ? 'Fechar' : 'Mudar curso, forma ou horário'}
          </button>
        )}
      </div>
      {e.trava && <p className="text-secondary/70 text-[12px]">Bloqueada: {e.trava}</p>}

      {aberto && !e.trava && (
        <div className="space-y-2">
          <label className="block">
            <span className="text-secondary/60 text-[12px]">Curso</span>
            <select value={oferta} onChange={(ev) => mudar(setOferta)(ev.target.value)} className={campo}>
              {!ofertasAtivas.some((o) => o.id === e.ofertaId) && (
                <option value={e.ofertaId}>{rotuloOferta(e.ofertaId)} (atual, fora desta edição)</option>
              )}
              {ofertasAtivas.map((o) => (
                <option key={o.id} value={o.id}>
                  {nomeOferta(o)} · {o.turno}
                </option>
              ))}
            </select>
          </label>
          {oferta !== e.ofertaId && (
            <p className="text-secondary/70 text-[12px]">
              Muda o curso. O dia e o horário da prova continuam os escolhidos abaixo (confira se o candidato quer
              outro).
            </p>
          )}
          <label className="block">
            <span className="text-secondary/60 text-[12px]">Forma de ingresso</span>
            <select value={forma} onChange={(ev) => mudar(setForma)(ev.target.value as FormaId)} className={campo}>
              {formas.map((f) => (
                <option key={f.id} value={f.id} disabled={!formasDoCurso.includes(f.id)}>
                  {f.rotulo}
                  {formasDoCurso.includes(f.id) ? '' : ' (não disponível no curso)'}
                </option>
              ))}
            </select>
          </label>
          {forma === 'enem' && (
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={fazProva} onChange={(ev) => mudar(setFazProva)(ev.target.checked)} />
              Também faz a prova (para tentar bolsa por nota)
            </label>
          )}
          {comProva && (
            <div className="grid grid-cols-2 gap-2">
              <label className="block">
                <span className="text-secondary/60 text-[12px]">Dia da prova</span>
                <select value={dia} onChange={(ev) => mudar(setDia)(ev.target.value)} className={campo}>
                  <option value="">Escolha</option>
                  {diasProva.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.rotulo}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="text-secondary/60 text-[12px]">Horário (Brasília)</span>
                <select value={hora} onChange={(ev) => mudar(setHora)(ev.target.value)} className={campo}>
                  <option value="">Escolha</option>
                  {horariosProva.map((h) => (
                    <option key={h} value={h}>
                      {Number(h.slice(0, 2))}h às {Number(h.slice(0, 2)) + 2}h
                    </option>
                  ))}
                </select>
              </label>
            </div>
          )}
          {deOutraFaculdade && (
            <div className="grid gap-2">
              <input
                value={instituicaoOrigem}
                onChange={(ev) => mudar(setInstituicaoOrigem)(ev.target.value)}
                placeholder="Faculdade de origem"
                aria-label="Faculdade de origem"
                className={campo}
              />
              <input
                value={cursoOrigem}
                onChange={(ev) => mudar(setCursoOrigem)(ev.target.value)}
                placeholder="Curso de origem"
                aria-label="Curso de origem"
                className={campo}
              />
              {forma === 'transferencia' && (
                <input
                  value={periodoAtual}
                  onChange={(ev) => mudar(setPeriodoAtual)(ev.target.value)}
                  placeholder="Período atual (ex.: 3º)"
                  aria-label="Período atual"
                  className={campo}
                />
              )}
            </div>
          )}
          {forma !== i.formaId && (
            <p className="text-secondary/70 text-[12px]">
              {forma === 'vestibular'
                ? 'Passa a fazer a prova. Documentos, origem acadêmica e notas do Enem ficam guardados como histórico, mas deixam de valer.'
                : 'Os dados da forma anterior ficam guardados como histórico.'}{' '}
              Número de inscrição e código de acesso não mudam.
            </p>
          )}
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={avisar} onChange={(ev) => setAvisar(ev.target.checked)} />
            Avisar o candidato por e-mail
          </label>

          {!previa ? (
            <button
              type="button"
              disabled={ocupado}
              onClick={() => enviar('previa')}
              className="bg-vest-blue cursor-pointer rounded-full px-3 py-1.5 text-[12px] font-bold text-white disabled:opacity-50">
              Revisar alteração
            </button>
          ) : (
            <div className="space-y-2 rounded-lg bg-amber-50 p-2">
              <p className="font-bold">Confirme a alteração da inscrição nº {i.numero}:</p>
              <p>
                <span className="text-secondary/70">Antes:</span> {descreverEdicao(previa.antes)}
                <br />
                <span className="text-secondary/70">Depois:</span> <strong>{descreverEdicao(previa.depois)}</strong>
              </p>
              <p className="text-secondary/70 text-[12px]">
                Vai para a RD como atualização (sem WhatsApp).{' '}
                {avisar
                  ? previa.emailConfigurado
                    ? 'O candidato recebe um e-mail com os dados novos.'
                    : 'Atenção: o e-mail não está configurado neste ambiente, o candidato não será avisado.'
                  : 'O candidato NÃO será avisado por e-mail.'}
              </p>
              <input
                type="password"
                value={senha}
                onChange={(ev) => setSenha(ev.target.value)}
                placeholder="Senha do painel para confirmar"
                aria-label="Senha do painel"
                autoComplete="current-password"
                className={campo}
              />
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={ocupado || !senha}
                  onClick={() => enviar('salvar')}
                  className="cursor-pointer rounded-full bg-green-600 px-3 py-1.5 text-[12px] font-bold text-white disabled:opacity-50">
                  Salvar alteração
                </button>
                <button
                  type="button"
                  onClick={() => setPrevia(null)}
                  className="border-stroke-3 cursor-pointer rounded-full border px-3 py-1.5 text-[12px] font-bold">
                  Voltar
                </button>
              </div>
            </div>
          )}
          {aviso && <p className="text-[12px] font-semibold text-red-700">{aviso}</p>}
        </div>
      )}

      {e.historico.length > 0 && (
        <ul className="text-secondary/60 space-y-0.5 text-[11px]">
          {e.historico.map((h) => (
            <li key={h.em}>
              {dataHora(h.em)} · {h.por}: {descreverEdicao(h.antes)} → {descreverEdicao(h.depois)}
              {h.avisouPorEmail ? ' · e-mail enviado' : ' · sem e-mail'}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

type LinhaImportacao = {
  linha: number;
  nome: string;
  inscricaoSei: string;
  curso: string;
  prova: string;
  status: 'criar' | 'existe' | 'problema' | 'descartada';
  motivo: string;
  numeroExistente: number | null;
};
type PreviaImportacao = {
  resumo: {
    total: number;
    criar: number;
    semNascimento: number;
    existe: number;
    problema: number;
    descartada: number;
  };
  emailConfigurado: boolean;
  linhas: LinhaImportacao[];
};

const rotuloStatusImportacao: Record<LinhaImportacao['status'], { texto: string; cor: string }> = {
  criar: { texto: 'Criar', cor: 'bg-green-100 text-green-900' },
  existe: { texto: 'Já existe', cor: 'bg-stroke-2 text-secondary' },
  problema: { texto: 'Problema', cor: 'bg-red-100 text-red-800' },
  descartada: { texto: 'Descartada', cor: 'bg-amber-100 text-amber-900' },
};

type ResumoFila = {
  pausada: boolean;
  lote: number;
  intervaloMin: number;
  horaInicio: number;
  horaFim: number;
  ultimoLote: string | null;
  total: number;
  pendentes: number;
  enviados: number;
  erros: number[];
};

// Fila de avisos das inscrições importadas do SEI: andamento, pausar/retomar, ritmo e "enviar próximo lote agora"
const FilaSei = ({ fila, atualizar }: { fila: ResumoFila; atualizar: () => void }) => {
  const [lote, setLote] = useState(String(fila.lote));
  const [intervaloMin, setIntervaloMin] = useState(String(fila.intervaloMin));
  const [horaInicio, setHoraInicio] = useState(String(fila.horaInicio));
  const [horaFim, setHoraFim] = useState(String(fila.horaFim));
  const [aviso, setAviso] = useState('');
  const [ocupado, setOcupado] = useState(false);

  const chamar = async (corpo: Record<string, unknown>) => {
    setOcupado(true);
    setAviso('');
    const res = await fetch('/api/vestibular/painel', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(corpo),
    }).catch(() => null);
    const json = res ? await res.json().catch(() => ({})) : {};
    setOcupado(false);
    if (!res?.ok) {
      setAviso(json.mensagem ?? 'Não deu certo. Tente de novo.');
      return;
    }
    if (corpo.acao === 'fila-sei-lote') {
      setAviso(
        json.motivo ?? `Lote enviado: ${json.enviados} avisados${json.erros ? `, ${json.erros} com erro` : ''}.`,
      );
    }
    atualizar();
  };

  const campo = 'border-stroke-3 h-8 w-14 rounded-lg border bg-white px-2 text-[12px]';
  const botao =
    'border-stroke-3 cursor-pointer rounded-full border px-3 py-1.5 text-[12px] font-bold disabled:opacity-50';
  return (
    <div className="space-y-2 rounded-2xl bg-amber-50 p-4 text-[13px]">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-vest-navy font-bold">
          Fila de avisos do SEI {fila.pausada && <span className="text-red-700">(pausada)</span>}
        </p>
        <p>
          <strong>{fila.enviados}</strong> enviados · <strong>{fila.pendentes}</strong> pendentes ·{' '}
          <strong className={fila.erros.length ? 'text-red-700' : ''}>{fila.erros.length}</strong> com erro
          {fila.ultimoLote && <span className="text-secondary/60"> · último lote {dataHora(fila.ultimoLote)}</span>}
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          disabled={ocupado || !fila.pendentes || fila.pausada}
          onClick={() => chamar({ acao: 'fila-sei-lote' })}
          className="bg-vest-blue cursor-pointer rounded-full px-3 py-1.5 text-[12px] font-bold text-white disabled:opacity-50">
          {ocupado ? 'Enviando…' : `Enviar próximo lote agora (${Math.min(fila.lote, fila.pendentes)})`}
        </button>
        <button
          type="button"
          disabled={ocupado}
          onClick={() => chamar({ acao: 'fila-sei-config', config: { pausada: !fila.pausada } })}
          className={botao}>
          {fila.pausada ? 'Retomar' : 'Pausar'}
        </button>
        {fila.erros.length > 0 && (
          <button
            type="button"
            disabled={ocupado}
            onClick={() => chamar({ acao: 'fila-sei-config', config: { reprocessar: true } })}
            className={botao}>
            Tentar de novo os com erro
          </button>
        )}
        <span className="text-secondary/70 ml-2">Ritmo automático:</span>
        <input value={lote} onChange={(e) => setLote(e.target.value)} aria-label="Por lote" className={campo} />
        <span>a cada</span>
        <input
          value={intervaloMin}
          onChange={(e) => setIntervaloMin(e.target.value)}
          aria-label="Minutos entre lotes"
          className={campo}
        />
        <span>min, das</span>
        <input
          value={horaInicio}
          onChange={(e) => setHoraInicio(e.target.value)}
          aria-label="Hora de início"
          className={campo}
        />
        <span>às</span>
        <input
          value={horaFim}
          onChange={(e) => setHoraFim(e.target.value)}
          aria-label="Hora de fim"
          className={campo}
        />
        <span>h</span>
        <button
          type="button"
          disabled={ocupado}
          onClick={() => chamar({ acao: 'fila-sei-config', config: { lote, intervaloMin, horaInicio, horaFim } })}
          className={botao}>
          Salvar ritmo
        </button>
      </div>
      {fila.erros.length > 0 && (
        <p className="text-[12px] text-red-800">Com erro (3 tentativas): nº {fila.erros.join(', ')}</p>
      )}
      {aviso && <p className="text-[12px] font-semibold">{aviso}</p>}
    </div>
  );
};

// Importar do SEI: planilha CSV já cruzada (um candidato por linha) → prévia → senha → cria, e-mail e RD
const ImportarSei = ({
  revisor,
  importacoes,
  fechar,
  concluido,
}: {
  revisor: string;
  importacoes: NonNullable<Dados['importacoes']>;
  fechar: () => void;
  concluido: () => void;
}) => {
  const [csv, setCsv] = useState('');
  const [arquivo, setArquivo] = useState('');
  const [unidadeEad, setUnidadeEad] = useState<'limoeiro' | 'fortaleza'>('limoeiro');
  const [duplicados, setDuplicados] = useState<'maior-inscricao' | 'menor-inscricao' | 'pular'>('maior-inscricao');
  const [avisar, setAvisar] = useState(true);
  const [aceitarSemNascimento, setAceitarSemNascimento] = useState(false);
  const [previa, setPrevia] = useState<PreviaImportacao | null>(null);
  const [filtro, setFiltro] = useState<LinhaImportacao['status'] | ''>('');
  const [senha, setSenha] = useState('');
  const [aviso, setAviso] = useState('');
  const [ocupado, setOcupado] = useState(false);

  // Mudar arquivo ou opção desfaz a prévia
  const mudar =
    <T,>(set: (v: T) => void) =>
    (v: T) => {
      set(v);
      setPrevia(null);
      setAviso('');
    };

  const [arrastando, setArrastando] = useState(false);
  const carregarArquivo = async (f?: File) => {
    if (f && !/\.csv$/i.test(f.name)) {
      setAviso('Escolha um arquivo .csv (no Excel: Salvar como → CSV).');
      return;
    }
    mudar(setCsv)(f ? await f.text() : '');
    setArquivo(f?.name ?? '');
  };

  const chamar = async (etapa: 'previa' | 'importar') => {
    setOcupado(true);
    setAviso('');
    const res = await fetch('/api/vestibular/painel', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        acao: 'importar-sei',
        etapa,
        por: revisor,
        csv,
        opcoes: { unidadeEad, duplicados, avisar, aceitarSemNascimento },
        senha: etapa === 'importar' ? senha : undefined,
      }),
    }).catch(() => null);
    const json = res ? await res.json().catch(() => ({})) : {};
    setOcupado(false);
    if (!res?.ok) {
      setAviso(json.mensagem ?? 'Não deu certo. Tente de novo.');
      return;
    }
    if (etapa === 'previa') {
      setPrevia(json);
      return;
    }
    setSenha('');
    setPrevia(null);
    window.alert(
      [
        `Inscrições criadas: ${json.criadas}.`,
        json.jaExistiam ? `Já existiam: ${json.jaExistiam}.` : '',
        json.falhas ? `Falharam: ${json.falhas} (tente de novo).` : '',
        avisar
          ? `${json.naFila} na fila de avisos (e-mail + RD nova inscrição), que sai em lotes: acompanhe no quadro "Fila de avisos do SEI".`
          : 'Ninguém foi avisado (opção desmarcada).',
        json.restantes ? `Faltaram ${json.restantes}: carregue a mesma planilha e importe de novo para continuar.` : '',
      ]
        .filter(Boolean)
        .join('\n'),
    );
    concluido();
  };

  const campo = 'border-stroke-3 h-10 rounded-full border bg-white px-3 text-[13px]';
  const linhas = (previa?.linhas ?? []).filter((l) => !filtro || l.status === filtro);
  return (
    <div className="border-vest-blue/40 space-y-3 rounded-2xl border border-dashed p-4 text-[13px]">
      <div className="flex items-center justify-between gap-2">
        <p className="text-vest-navy text-[15px] font-bold">Importar inscrições do SEI</p>
        <button type="button" onClick={fechar} className="text-secondary/70 cursor-pointer text-[12px] font-bold">
          Fechar
        </button>
      </div>
      <p className="text-secondary/70">
        Planilha CSV com uma linha por candidato e as colunas cpf; nome; email; celular; nascimento; curso_sei;
        inscricao_sei; tipo; dia; hora. Quem já tem inscrição no nosso sistema (mesmo CPF) não é alterado. Cada
        inscrição criada ganha nº e código do nosso sistema e mantém o dia e o horário do SEI.
      </p>
      {/* Área de arrastar e soltar; clicar abre a escolha de arquivo */}
      <label
        onDragOver={(e) => {
          e.preventDefault();
          setArrastando(true);
        }}
        onDragLeave={() => setArrastando(false)}
        onDrop={async (e) => {
          e.preventDefault();
          setArrastando(false);
          await carregarArquivo(e.dataTransfer.files?.[0]);
        }}
        className={cn(
          'flex cursor-pointer flex-col items-center gap-1 rounded-2xl border-2 border-dashed p-5 text-center',
          arrastando ? 'border-vest-blue bg-primary-50' : 'border-vest-blue/50 bg-white',
        )}>
        <span className="bg-vest-blue rounded-full px-5 py-2.5 text-[14px] font-bold text-white">
          {arquivo ? 'Trocar planilha (.csv)' : 'Escolher planilha (.csv)'}
        </span>
        <span className="text-secondary/70 text-[12px]">
          {arquivo ? `Escolhida: ${arquivo}` : 'ou arraste o arquivo para cá'}
        </span>
        <input
          type="file"
          accept=".csv,text/csv"
          aria-label="Planilha CSV do SEI"
          onChange={(e) => carregarArquivo(e.target.files?.[0])}
          className="sr-only"
        />
      </label>
      <div className="flex flex-wrap items-center gap-2">
        <select
          value={unidadeEad}
          onChange={(e) => mudar(setUnidadeEad)(e.target.value as typeof unidadeEad)}
          aria-label="Unidade dos cursos EAD e semipresencial"
          className={campo}>
          <option value="limoeiro">EAD/semi: Limoeiro do Norte</option>
          <option value="fortaleza">EAD/semi: Fortaleza (Tauape)</option>
        </select>
        <select
          value={duplicados}
          onChange={(e) => mudar(setDuplicados)(e.target.value as typeof duplicados)}
          aria-label="Quem está em 2 cursos"
          className={campo}>
          <option value="maior-inscricao">Em 2 cursos: fica o de maior nº SEI (mais recente)</option>
          <option value="menor-inscricao">Em 2 cursos: fica o de menor nº SEI</option>
          <option value="pular">Em 2 cursos: não importar (decidir depois)</option>
        </select>
        <label className="flex items-center gap-1.5">
          <input type="checkbox" checked={avisar} onChange={(e) => mudar(setAvisar)(e.target.checked)} />
          Avisar (e-mail + RD nova inscrição, pela fila)
        </label>
        <label
          className="flex items-center gap-1.5"
          title="Só depois de rodar o SQL do nascimento opcional no Supabase">
          <input
            type="checkbox"
            checked={aceitarSemNascimento}
            onChange={(e) => mudar(setAceitarSemNascimento)(e.target.checked)}
          />
          Aceitar sem data de nascimento
        </label>
      </div>
      {!previa && (
        <button
          type="button"
          disabled={ocupado || !csv}
          onClick={() => chamar('previa')}
          className="bg-vest-blue cursor-pointer rounded-full px-4 py-2 text-[13px] font-bold text-white disabled:opacity-50">
          {ocupado ? 'Analisando…' : 'Ver prévia'}
        </button>
      )}
      {previa && (
        <div className="space-y-2">
          <p className="font-semibold">
            {arquivo}: {previa.resumo.total} linhas ·{' '}
            <span className="text-green-800">{previa.resumo.criar} a criar</span>
            {previa.resumo.semNascimento > 0 && ` (${previa.resumo.semNascimento} sem data de nascimento)`} ·{' '}
            {previa.resumo.existe} já existem · {previa.resumo.descartada} descartadas (2 cursos) ·{' '}
            <span className="text-red-800">{previa.resumo.problema} com problema</span>
          </p>
          <select
            value={filtro}
            onChange={(e) => setFiltro(e.target.value as typeof filtro)}
            aria-label="Filtrar a prévia"
            className={campo}>
            <option value="">Mostrar todas</option>
            <option value="criar">Só a criar</option>
            <option value="existe">Só as que já existem</option>
            <option value="problema">Só com problema</option>
            <option value="descartada">Só as descartadas (2 cursos)</option>
          </select>
          <div className="border-stroke-2 max-h-[320px] overflow-auto rounded-xl border">
            <table className="w-full text-left text-[12px]">
              <thead className="text-secondary/60 sticky top-0 bg-white">
                <tr>
                  {['Linha', 'Situação', 'Nome', 'Nº SEI', 'Curso', 'Prova', 'Observação'].map((c) => (
                    <th key={c} className="px-2 py-1 font-semibold">
                      {c}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {linhas.map((l) => (
                  <tr key={l.linha} className="border-stroke-2 border-t align-top">
                    <td className="px-2 py-1">{l.linha}</td>
                    <td className="px-2 py-1">
                      <span
                        className={cn('rounded-full px-1.5 py-0.5 font-bold', rotuloStatusImportacao[l.status].cor)}>
                        {rotuloStatusImportacao[l.status].texto}
                      </span>
                    </td>
                    <td className="px-2 py-1">{l.nome}</td>
                    <td className="px-2 py-1">{l.inscricaoSei}</td>
                    <td className="px-2 py-1">{l.curso}</td>
                    <td className="px-2 py-1 whitespace-nowrap">{l.prova}</td>
                    <td className="px-2 py-1">
                      {l.numeroExistente ? `nº ${l.numeroExistente} · ` : ''}
                      {l.motivo}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="space-y-2 rounded-lg bg-amber-50 p-3">
            <p>
              Vai criar <strong>{previa.resumo.criar}</strong> inscrições.{' '}
              {avisar
                ? `Os avisos não saem agora: entram na fila (e-mail de confirmação com nº e código + RD como nova inscrição, que dispara o WhatsApp) e saem em lotes.${previa.emailConfigurado ? '' : ' Atenção: o e-mail não está configurado neste ambiente.'}`
                : 'Ninguém será avisado (opção desmarcada).'}
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <input
                type="password"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                placeholder="Senha do painel para confirmar"
                aria-label="Senha do painel"
                autoComplete="current-password"
                className={cn(campo, 'w-[260px]')}
              />
              <button
                type="button"
                disabled={ocupado || !senha || !previa.resumo.criar}
                onClick={() => chamar('importar')}
                className="cursor-pointer rounded-full bg-green-600 px-4 py-2 text-[13px] font-bold text-white disabled:opacity-50">
                {ocupado ? 'Importando… (não feche a página)' : `Importar ${previa.resumo.criar} inscrições`}
              </button>
              <button
                type="button"
                onClick={() => setPrevia(null)}
                className="border-stroke-3 cursor-pointer rounded-full border px-4 py-2 text-[13px] font-bold">
                Voltar
              </button>
            </div>
          </div>
        </div>
      )}
      {aviso && <p className="font-semibold text-red-700">{aviso}</p>}
      {importacoes.length > 0 && (
        <ul className="text-secondary/60 text-[11px]">
          {importacoes.map((h) => (
            <li key={h.em}>
              {dataHora(h.em)} · {h.por}: {h.criadas} criadas{h.avisar ? ' · avisos na fila' : ' · sem avisos'}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

// Faixa de cada candidato no resultado
const faixa = (l: Linha) => (!l.aprovado ? 'Reprovado' : l.bolsa ? `Bolsa ${l.bolsa}%` : '40% garantido');

const dataHora = (iso: string) => new Date(iso).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });
const celular = (c: string) => c.replace(/^(\d{2})(\d{5})(\d{4})$/, '($1) $2-$3');
const dataBr = (iso: string) => iso.slice(0, 10).split('-').reverse().join('/');
const idade = (nascimento: string) => {
  const hoje = new Date();
  const [a, m, d] = nascimento.split('-').map(Number);
  return (
    hoje.getFullYear() - a - (hoje.getMonth() + 1 < m || (hoje.getMonth() + 1 === m && hoje.getDate() < d) ? 1 : 0)
  );
};

const LinkWhats = ({ numero }: { numero: string }) => (
  <a href={`https://wa.me/55${numero}`} target="_blank" rel="noopener" className="text-vest-blue whitespace-nowrap">
    {celular(numero)}
  </a>
);

const Cartao = ({ titulo, valor }: { titulo: string; valor: number | string }) => (
  <div className="rounded-2xl bg-white p-4">
    <p className="text-secondary/60 text-[13px]">{titulo}</p>
    <p className="font-chamada text-vest-navy text-[34px] leading-none">{valor}</p>
  </div>
);

const Painel = () => {
  const [dados, setDados] = useState<Dados | null>(null);
  const [status, setStatus] = useState<'carregando' | 'login' | 'ok' | 'fechado'>('carregando');
  const [senha, setSenha] = useState('');
  const [aviso, setAviso] = useState('');
  const [aba, setAba] = useState<'inscricoes' | 'resultado' | 'resumo'>('inscricoes');
  const [busca, setBusca] = useState('');
  const [ocupado, setOcupado] = useState(false);
  const [filtroDocumento, setFiltroDocumento] = useState<StatusDocumento | ''>('');
  const [abertas, setAbertas] = useState<Set<number>>(new Set());
  const [importando, setImportando] = useState(false);
  // Link direto para um candidato (ex.: vindo da Kommo): /vestibular/painel?inscricao=2027100003.
  // O parâmetro fica na URL durante o login (a senha não muda de página), então abre assim que os dados chegam.
  const [destino, setDestino] = useState<number | null>(null);
  useEffect(() => {
    const numero = Number(new URLSearchParams(window.location.search).get('inscricao'));
    if (Number.isInteger(numero) && numero > 0) {
      setDestino(numero);
    }
  }, []);
  const alternar = (numero: number, abrir?: boolean) =>
    setAbertas((atual) => {
      const nova = new Set(atual);
      if (abrir ?? !nova.has(numero)) {
        nova.add(numero);
      } else {
        nova.delete(numero);
      }
      return nova;
    });
  // Nome de quem está revisando (fica neste navegador) para registrar quem aprovou ou pediu outro documento
  const [revisor, setRevisor] = useState('');
  useEffect(() => {
    try {
      setRevisor(localStorage.getItem('vestibular-painel-revisor') ?? '');
    } catch {
      // sem armazenamento: digita de novo
    }
  }, []);

  useEffect(() => {
    if (!dados || destino === null) {
      return;
    }
    setAba('inscricoes');
    setBusca(String(destino));
    setFiltroDocumento('');
    setAbertas(new Set([destino]));
    setDestino(null);
    requestAnimationFrame(() =>
      document.getElementById(`inscricao-${destino}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' }),
    );
  }, [dados, destino]);

  const carregar = useCallback(async () => {
    const res = await fetch('/api/vestibular/painel', { cache: 'no-store' });
    if (res.status === 401) {
      return setStatus('login');
    }
    if (res.status === 503) {
      return setStatus('fechado');
    }
    const json = await res.json();
    setDados(json);
    setStatus('ok');
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  const acao = async (corpo: Record<string, unknown>) => {
    setOcupado(true);
    setAviso('');
    const res = await fetch('/api/vestibular/painel', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(corpo),
    });
    const json = await res.json().catch(() => ({}));
    setOcupado(false);
    if (!res.ok) {
      setAviso(json.mensagem ?? 'Não deu certo. Tente de novo.');
      return false;
    }
    return true;
  };

  const entrar = async (e: FormEvent) => {
    e.preventDefault();
    if (await acao({ acao: 'entrar', senha })) {
      setSenha('');
      await carregar();
    }
  };

  if (status === 'carregando') {
    return <p className="text-secondary/60 py-20 text-center">Carregando…</p>;
  }

  if (status === 'fechado') {
    return (
      <p className="mx-auto max-w-[480px] rounded-2xl bg-white p-6 text-center">
        O painel está desativado. Defina a variável VESTIBULAR_PAINEL_SENHA (8 caracteres ou mais) para usá-lo.
      </p>
    );
  }

  if (status === 'login' || !dados) {
    return (
      <form onSubmit={entrar} className="mx-auto max-w-[400px] space-y-4 rounded-[24px] bg-white p-6">
        <h1 className="font-chamada text-vest-navy text-center text-[32px]">Painel do vestibular</h1>
        <p className="text-secondary/70 text-center text-[14px]">Acesso restrito à Faculdade Vidal.</p>
        <input
          type="password"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          placeholder="Senha do painel"
          autoComplete="current-password"
          className="border-stroke-3 focus:border-vest-blue h-12 w-full rounded-2xl border px-4 focus:outline-none"
        />
        {aviso && <p className="text-center text-[14px] font-semibold text-red-600">{aviso}</p>}
        <button
          type="submit"
          disabled={ocupado}
          className="bg-vest-blue hover:bg-vest-navy h-12 w-full cursor-pointer rounded-full font-bold text-white disabled:opacity-60">
          Entrar
        </button>
      </form>
    );
  }

  const filtradas = dados.inscricoes
    .filter(
      (i) =>
        (!filtroDocumento || i.documentoStatus === filtroDocumento) &&
        `${i.numero} ${i.nome} ${i.cpf} ${formatarCpf(i.cpf)} ${i.email} ${i.celular} ${i.curso}`
          .toLowerCase()
          .includes(busca.trim().toLowerCase()),
    )
    // Fila do dia: documentos para analisar, do envio mais antigo para o mais novo
    .sort((a, b) =>
      filtroDocumento === 'enviado' ? (a.documentoEnviadoEm ?? '').localeCompare(b.documentoEnviadoEm ?? '') : 0,
    );

  const revisar = async (numero: number, decisao: 'aprovado' | 'recusado' | 'enviado') => {
    let obs = '';
    if (decisao === 'recusado') {
      obs = window.prompt('O que está faltando ou errado? O candidato vai ver este texto.')?.trim() ?? '';
      if (!obs) {
        return;
      }
    }
    if (await acao({ acao: 'documento', numero, decisao, obs, por: revisor })) {
      await carregar();
    }
  };

  const confirmarEnem = async (numero: number, ano: string, notas: Record<string, string>) => {
    if (await acao({ acao: 'enem', numero, ano, notas, por: revisor })) {
      await carregar();
    }
  };
  const contemplados = dados.previa.filter((l) => l.bolsa);
  const aprovados = dados.previa.filter((l) => l.aprovado);

  return (
    <div className="w-full space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-chamada text-vest-navy text-[34px]">Painel do vestibular 2027.1</h1>
        <input
          value={revisor}
          onChange={(e) => {
            setRevisor(e.target.value);
            try {
              localStorage.setItem('vestibular-painel-revisor', e.target.value);
            } catch {
              // sem armazenamento
            }
          }}
          placeholder="Seu nome (registra quem revisou)"
          aria-label="Seu nome"
          className="border-stroke-3 ml-auto h-10 w-[260px] rounded-full border bg-white px-4 text-[14px]"
        />
        <button
          type="button"
          onClick={async () => (await acao({ acao: 'sair' })) && setStatus('login')}
          className="text-secondary/70 cursor-pointer text-[14px] font-semibold hover:underline">
          Sair
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        <Cartao titulo="Inscrições" valor={dados.resumo.inscricoes} />
        <Cartao titulo="Com prova agendada" valor={dados.resumo.fazemProva} />
        <Cartao titulo="Começaram a prova" valor={dados.resumo.iniciaram} />
        <Cartao titulo="Entregaram" valor={dados.resumo.entregaram} />
        <button
          type="button"
          onClick={() => {
            setAba('inscricoes');
            setFiltroDocumento('enviado');
          }}
          className="cursor-pointer text-left">
          <Cartao titulo="Documentos para analisar" valor={dados.resumo.documentosParaAnalisar} />
        </button>
      </div>
      <p className="text-secondary/70 text-[14px]">
        {dados.resumo.porForma.map((f) => `${f.forma}: ${f.total}`).join(' · ')}
      </p>

      <div className="flex flex-wrap gap-2">
        {(['inscricoes', 'resultado', 'resumo'] as const).map((a) => (
          <button
            key={a}
            type="button"
            onClick={() => setAba(a)}
            className={cn(
              'cursor-pointer rounded-full px-5 py-2.5 text-[15px] font-bold',
              aba === a ? 'bg-vest-navy text-white' : 'text-vest-navy bg-white',
            )}>
            {{ inscricoes: 'Inscrições', resultado: 'Resultado', resumo: 'Resumo' }[a]}
          </button>
        ))}
      </div>

      {aba === 'resumo' ? (
        <Resumo dados={dados.estatisticas} />
      ) : aba === 'inscricoes' ? (
        <div className="space-y-3 rounded-[24px] bg-white p-4 md:p-6">
          <div className="flex flex-wrap items-center gap-3">
            <input
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar por nome, CPF, e-mail, WhatsApp, curso ou nº"
              className="border-stroke-3 h-11 min-w-[240px] flex-1 rounded-full border px-4"
            />
            <select
              value={filtroDocumento}
              onChange={(e) => setFiltroDocumento(e.target.value as StatusDocumento | '')}
              aria-label="Filtrar por documentos"
              className="border-stroke-3 h-11 rounded-full border bg-white px-4 text-[14px]">
              <option value="">Documentos: todos</option>
              {(Object.keys(rotuloDocumento) as StatusDocumento[]).map((s) => (
                <option key={s} value={s}>
                  Documentos:{' '}
                  {s === 'enviado' ? 'para analisar (mais antigos primeiro)' : rotuloDocumento[s].texto.toLowerCase()}
                </option>
              ))}
            </select>
            <a
              href="/api/vestibular/painel?planilha=inscricoes"
              className="bg-vest-blue rounded-full px-5 py-2.5 text-[14px] font-bold text-white">
              Baixar planilha (CSV)
            </a>
            <button
              type="button"
              disabled={ocupado}
              onClick={async () => {
                if (
                  !window.confirm(
                    'Reenviar os dados de todas as inscrições para a RD? Vai como atualização (não dispara o WhatsApp).',
                  )
                ) {
                  return;
                }
                const res = await fetch('/api/vestibular/painel', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ acao: 'reenviar-rd' }),
                }).catch(() => null);
                const json = res ? await res.json().catch(() => ({})) : {};
                window.alert(
                  res?.ok ? `${json.enviadas} inscrições atualizadas na RD.` : (json.mensagem ?? 'Não deu certo.'),
                );
              }}
              className="border-stroke-3 cursor-pointer rounded-full border px-4 py-2.5 text-[14px] font-bold">
              Reenviar para a RD
            </button>
            <button
              type="button"
              disabled={ocupado}
              onClick={async () => {
                const chamar = async (acao: string) => {
                  const res = await fetch('/api/vestibular/painel', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ acao }),
                  }).catch(() => null);
                  return { ok: !!res?.ok, json: res ? await res.json().catch(() => ({})) : {} };
                };
                const previa = await chamar('lembretes-previa');
                if (!previa.ok) {
                  window.alert(previa.json.mensagem ?? 'Não deu certo.');
                  return;
                }
                if (!previa.json.pendentes) {
                  window.alert('Ninguém para lembrar: todos os inscritos com prova já receberam o lembrete.');
                  return;
                }
                if (
                  !window.confirm(
                    `Enviar agora o lembrete da prova (e-mail + WhatsApp pela RD) para ${previa.json.pendentes} candidato(s) que ainda não receberam? O envio automático é em 19/11, às 10h.`,
                  )
                ) {
                  return;
                }
                const envio = await chamar('lembretes-enviar');
                window.alert(
                  envio.ok
                    ? `Lembretes enviados: ${envio.json.enviados}. Falhas: ${envio.json.falhas}.${envio.json.restantes ? ` Faltaram ${envio.json.restantes}: clique de novo.` : ''}`
                    : (envio.json.mensagem ?? 'Não deu certo.'),
                );
              }}
              className="border-stroke-3 cursor-pointer rounded-full border px-4 py-2.5 text-[14px] font-bold">
              Enviar lembretes da prova agora
            </button>
            <button
              type="button"
              onClick={() => setImportando(!importando)}
              className="border-stroke-3 cursor-pointer rounded-full border px-4 py-2.5 text-[14px] font-bold">
              Importar do SEI
            </button>
          </div>
          {dados.filaSei && dados.filaSei.total > 0 && <FilaSei fila={dados.filaSei} atualizar={carregar} />}
          {importando && (
            <ImportarSei
              revisor={revisor}
              importacoes={dados.importacoes ?? []}
              fechar={() => setImportando(false)}
              concluido={carregar}
            />
          )}
          {/* Cabeçalho e coluna do candidato fixos; detalhes menos usados abrem numa linha abaixo */}
          <div className="border-stroke-2 max-h-[75vh] overflow-auto rounded-2xl border">
            <table className="w-full min-w-[980px] border-separate border-spacing-0 text-left text-[13px]">
              <thead className="text-secondary/60">
                <tr>
                  {['Candidato', 'Contato', 'Curso e forma', 'Prova', 'Documentos'].map((c, idx) => (
                    <th
                      key={c}
                      className={cn(
                        'border-stroke-2 sticky top-0 z-10 border-b bg-white px-3 py-2 font-semibold',
                        idx === 0 && 'left-0 z-20',
                      )}>
                      {c}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtradas.map((i) => {
                  const aberta = abertas.has(i.numero);
                  const celula = 'border-stroke-2 border-b px-3 py-2 align-top';
                  return (
                    <Fragment key={i.numero}>
                      <tr id={`inscricao-${i.numero}`} className="hover:bg-primary-50/40">
                        <td className={cn(celula, 'sticky left-0 z-[1] min-w-[240px] bg-white')}>
                          <button
                            type="button"
                            onClick={() => alternar(i.numero)}
                            aria-expanded={aberta}
                            aria-label={`Detalhes da inscrição ${i.numero}`}
                            className="border-vest-blue text-vest-blue float-left mt-0.5 mr-2 flex size-5 cursor-pointer items-center justify-center rounded-full border text-[14px] leading-none font-bold">
                            {aberta ? '−' : '+'}
                          </button>
                          <span className="text-vest-navy font-semibold">{i.nome}</span>
                          <span className="text-secondary/60 block text-[12px]">
                            nº {i.numero} · CPF {formatarCpf(i.cpf)}
                          </span>
                          {i.atendimentoEspecial && (
                            <span className="mt-1 inline-block rounded bg-amber-100 px-1.5 text-[11px] text-amber-900">
                              Atendimento especial
                            </span>
                          )}
                        </td>
                        <td className={celula}>
                          <a href={`mailto:${i.email}`} className="text-vest-blue block max-w-[220px] truncate">
                            {i.email}
                          </a>
                          <LinkWhats numero={i.celular} />
                        </td>
                        <td className={celula}>
                          <span className="block max-w-[260px]">{i.curso}</span>
                          <span className="text-secondary/60 block text-[12px]">{i.forma}</span>
                        </td>
                        <td className={cn(celula, 'whitespace-nowrap')}>
                          {i.prova}
                          <span className="text-secondary/60 block text-[12px]">
                            {i.situacao}
                            {i.nota !== null && ` · nota ${i.nota}`}
                          </span>
                        </td>
                        <td className={cn(celula, 'min-w-[200px]')}>
                          <CelulaDocumentos
                            inscricao={i}
                            ocupado={ocupado}
                            revisar={revisar}
                            conferir={() => alternar(i.numero, true)}
                          />
                        </td>
                      </tr>
                      {aberta && (
                        <tr>
                          <td colSpan={5} className="border-stroke-2 bg-primary-50/50 border-b px-3 py-3">
                            <div className="grid gap-4 md:grid-cols-[1fr_1fr_1.4fr]">
                              <dl className="space-y-1 text-[13px]">
                                <Detalhe rotulo="Inscrição">{dataHora(i.criadoEm)}</Detalhe>
                                <Detalhe rotulo="Nascimento">
                                  {i.nascimento
                                    ? `${dataBr(i.nascimento)} (${idade(i.nascimento)} anos)`
                                    : 'não informado (importado do SEI; o candidato informa em Minha inscrição)'}
                                </Detalhe>
                                <Detalhe
                                  rotulo={i.origemValida ? 'Origem acadêmica' : 'Origem acadêmica (forma anterior)'}>
                                  {i.origemAcademica}
                                </Detalhe>
                                <Detalhe rotulo="Atendimento especial">{i.atendimentoEspecial}</Detalhe>
                                <div className="pt-2">
                                  <CodigoAcesso numero={i.numero} revisor={revisor} />
                                  <button
                                    type="button"
                                    disabled={ocupado}
                                    onClick={async () => {
                                      if (
                                        window.confirm(
                                          `Reenviar a inscrição nº ${i.numero} para a RD como NOVA INSCRIÇÃO? Use quando o lead não chegou à Kommo: refaz o fluxo de entrada e o WhatsApp de boas-vindas.`,
                                        ) &&
                                        (await acao({ acao: 'reenviar-inscricao-rd', numero: i.numero }))
                                      ) {
                                        window.alert('Enviado para a RD como nova inscrição.');
                                      }
                                    }}
                                    className="text-vest-blue mt-2 block cursor-pointer text-[12px] font-bold underline-offset-2 hover:underline disabled:opacity-50">
                                    Reenviar para a RD como nova inscrição
                                  </button>
                                </div>
                              </dl>
                              <div className="space-y-1 text-[13px]">
                                {!i.documentoStatus && i.documentos.length > 0 && (
                                  <p className="text-secondary/60 text-[12px]">
                                    Documentos da forma anterior (histórico, não valem mais):
                                  </p>
                                )}
                                {i.documentos.map((d) => (
                                  <a
                                    key={d.id}
                                    href={`/api/vestibular/painel?documento=${i.numero}&id=${d.id}`}
                                    target="_blank"
                                    rel="noopener"
                                    className="text-vest-blue block truncate underline">
                                    {d.item}: {d.nome}
                                  </a>
                                ))}
                                {i.documentoStatus === 'recusado' && i.documentoObs && (
                                  <p className="text-red-800">Motivo do pedido: {i.documentoObs}</p>
                                )}
                                {i.documentoRevisadoEm && (
                                  <p className="text-secondary/60 text-[12px]">
                                    Revisado em {dataHora(i.documentoRevisadoEm)}
                                    {i.documentoRevisadoPor && ` por ${i.documentoRevisadoPor}`}
                                  </p>
                                )}
                              </div>
                              {i.formaId === 'enem' &&
                                (i.documentos.length > 0 &&
                                (i.documentoStatus === 'enviado' || i.documentoStatus === 'recusado') ? (
                                  <ConferirEnem
                                    inscricao={i}
                                    travado={ocupado}
                                    confirmar={(ano, notas) => confirmarEnem(i.numero, ano, notas)}
                                  />
                                ) : (
                                  // Sem boletim (ou já decidido): só mostra o que foi informado ou confirmado
                                  <dl className="space-y-0.5 text-[13px]">
                                    <Detalhe rotulo="Ano do Enem">{i.enemAno}</Detalhe>
                                    {areasEnem.map((a) => (
                                      <Detalhe key={a.id} rotulo={a.rotulo}>
                                        {i.enemNotas?.[a.id]?.toString().replace('.', ',')}
                                      </Detalhe>
                                    ))}
                                    {!i.documentos.length && (
                                      <p className="text-secondary/60 text-[12px]">
                                        A conferência abre quando o boletim chegar.
                                      </p>
                                    )}
                                  </dl>
                                ))}
                            </div>
                            <div className="sticky left-3 mt-4 max-w-[620px]">
                              <EditarContato
                                key={`contato-${i.email}-${i.celular}-${i.nascimento}`}
                                inscricao={i}
                                revisor={revisor}
                                salvo={carregar}
                              />
                              <EditarInscricao
                                key={`${i.formaId}-${i.prova}-${i.edicao.historico.length}`}
                                inscricao={i}
                                revisor={revisor}
                                salvo={carregar}
                              />
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
            {filtradas.length === 0 && <p className="text-secondary/60 py-6 text-center">Nenhuma inscrição.</p>}
          </div>
        </div>
      ) : (
        <div className="space-y-4 rounded-[24px] bg-white p-4 md:p-6">
          <div
            className={cn(
              'rounded-2xl p-4 text-[15px]',
              dados.publicadoEm ? 'bg-green-50 text-green-900' : 'bg-amber-50 text-amber-900',
            )}>
            {dados.publicadoEm
              ? `Resultado publicado em ${dataHora(dados.publicadoEm)}. Os candidatos já veem em Minha inscrição e na página pública. A lista abaixo é a prévia com as notas de agora; o que foi publicado fica congelado.`
              : 'Prévia: o resultado ainda não foi publicado. Confira a classificação e as bolsas antes de publicar.'}{' '}
            {dados.publicadoEm
              ? 'Os ajustes manuais estão travados. Para mudar alguma coisa, tire do ar, ajuste e publique de novo.'
              : 'Na coluna Ajuste manual dá para aprovar ou reprovar alguém, trocar a faixa de bolsa e anotar o motivo. O ajuste vale mais que a regra da nota.'}
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              disabled={ocupado}
              onClick={async () => {
                if (
                  window.confirm(
                    dados.publicadoEm
                      ? 'Publicar de novo com as notas atuais? O resultado divulgado será substituído.'
                      : 'Publicar o resultado? Os candidatos passam a ver na hora.',
                  ) &&
                  (await acao({ acao: 'publicar' }))
                ) {
                  await carregar();
                }
              }}
              className="bg-vest-yellow text-vest-navy cursor-pointer rounded-full px-6 py-3 font-extrabold disabled:opacity-60">
              {dados.publicadoEm ? 'Publicar de novo' : 'Publicar resultado'}
            </button>
            {dados.publicadoEm && (
              <button
                type="button"
                disabled={ocupado}
                onClick={async () => {
                  if (window.confirm('Tirar o resultado do ar?') && (await acao({ acao: 'despublicar' }))) {
                    await carregar();
                  }
                }}
                className="border-stroke-3 text-vest-navy cursor-pointer rounded-full border-2 px-6 py-3 font-bold">
                Tirar do ar
              </button>
            )}
            {dados.publicadoEm && (
              <button
                type="button"
                disabled={ocupado}
                onClick={async () => {
                  const chamar = async (corpo: Record<string, unknown>) => {
                    const res = await fetch('/api/vestibular/painel', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify(corpo),
                    }).catch(() => null);
                    return { ok: !!res?.ok, json: res ? await res.json().catch(() => ({})) : {} };
                  };
                  const previa = await chamar({ acao: 'resultado-email-previa' });
                  if (!previa.ok) {
                    window.alert(previa.json.mensagem ?? 'Não deu certo.');
                    return;
                  }
                  if (!previa.json.pendentes) {
                    window.alert('Todos os aprovados já receberam o e-mail do resultado.');
                    return;
                  }
                  if (
                    !window.confirm(
                      `Enviar o e-mail do resultado para ${previa.json.pendentes} aprovado(s) que ainda não receberam? Vai também para a RD (WhatsApp).`,
                    )
                  ) {
                    return;
                  }
                  setOcupado(true);
                  const envio = await chamar({ acao: 'resultado-email-todos' });
                  setOcupado(false);
                  window.alert(
                    envio.ok
                      ? `E-mails enviados: ${envio.json.enviados}. Falhas: ${envio.json.falhas}.${envio.json.restantes ? ` Faltaram ${envio.json.restantes}: clique de novo.` : ''}`
                      : (envio.json.mensagem ?? 'Não deu certo.'),
                  );
                  await carregar();
                }}
                className="bg-vest-blue cursor-pointer rounded-full px-6 py-3 font-bold text-white disabled:opacity-60">
                Enviar e-mail aos aprovados que ainda não receberam
              </button>
            )}
            <a
              href="/api/vestibular/painel?planilha=resultado"
              className="bg-vest-blue rounded-full px-6 py-3 font-bold text-white">
              Baixar classificação (CSV)
            </a>
          </div>
          {aviso && <p className="text-[14px] font-semibold text-red-600">{aviso}</p>}
          <p className="text-secondary/70 text-[14px]">
            {aprovados.length} aprovados · {contemplados.length} contemplados com bolsa ·{' '}
            {dados.previa.length - aprovados.length} reprovados · {dados.previa.filter((l) => l.ajuste).length} com
            ajuste manual
          </p>
          {dados.previa.some((l) => l.avisos?.length) && (
            <div className="rounded-2xl bg-amber-50 p-3 text-[13px] text-amber-900">
              <p className="font-bold">Ajustes fora da regra (confira antes de publicar):</p>
              <ul className="mt-1 space-y-0.5">
                {dados.previa
                  .filter((l) => l.avisos?.length)
                  .map((l) => (
                    <li key={l.numero}>
                      nº {l.numero} · {l.nome}: {l.avisos?.join('; ')}
                    </li>
                  ))}
              </ul>
            </div>
          )}
          <div className="border-stroke-2 max-h-[75vh] overflow-auto rounded-2xl border">
            <table className="w-full min-w-[1240px] text-left text-[13px]">
              <thead className="text-secondary/60 border-stroke-2 sticky top-0 z-10 border-b bg-white">
                <tr>
                  {['Geral', 'No curso', 'Nº', 'Candidato', 'Curso', 'Nota', 'Mat.', 'Faixa', 'Ajuste manual'].map(
                    (c) => (
                      <th key={c} className="px-2 py-2 font-semibold">
                        {c}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody>
                {dados.previa.map((l) => (
                  <tr
                    key={l.numero}
                    className={cn(
                      'border-stroke-2 border-b',
                      l.bolsa && 'bg-primary-50',
                      !l.aprovado && 'text-secondary/50',
                    )}>
                    <td className="px-2 py-2 font-semibold">
                      {l.classificacaoGeral ? `${l.classificacaoGeral}º` : '—'}
                    </td>
                    <td className="px-2 py-2">{l.classificacaoOferta ? `${l.classificacaoOferta}º` : '—'}</td>
                    <td className="px-2 py-2">{l.numero}</td>
                    <td className="px-2 py-2">
                      <span className="font-semibold">{l.nome}</span>
                      <span className="block text-[12px] opacity-70">CPF {formatarCpf(l.cpf)}</span>
                      <span className="block text-[12px] opacity-70">{l.email}</span>
                      <LinkWhats numero={l.celular} />
                    </td>
                    <td className="px-2 py-2">{l.oferta}</td>
                    <td className="px-2 py-2">{l.nota.toFixed(1)}</td>
                    <td className="px-2 py-2">{l.notaMatematica.toFixed(1)}</td>
                    <td className="px-2 py-2 font-bold">
                      {faixa(l)}
                      {dados.publicadoEm && l.aprovado && (
                        <span className="mt-1 block font-normal">
                          {l.resultadoEmailEm && (
                            <span className="block text-[11px] text-green-700">
                              E-mail enviado em {dataHora(l.resultadoEmailEm)}
                            </span>
                          )}
                          <button
                            type="button"
                            disabled={ocupado}
                            onClick={async () => {
                              if (
                                l.resultadoEmailEm &&
                                !window.confirm(`${l.nome} já recebeu o e-mail do resultado. Enviar de novo?`)
                              ) {
                                return;
                              }
                              if (await acao({ acao: 'resultado-email', numero: l.numero })) {
                                await carregar();
                              }
                            }}
                            className="text-vest-blue cursor-pointer text-[12px] font-bold underline-offset-2 hover:underline disabled:opacity-50">
                            {l.resultadoEmailEm ? 'Reenviar e-mail' : 'Enviar e-mail do resultado'}
                          </button>
                        </span>
                      )}
                    </td>
                    <td className="px-2 py-2">
                      <AjusteLinha
                        key={JSON.stringify(l.ajuste)}
                        linha={l}
                        travado={ocupado || !!dados.publicadoEm}
                        salvar={async (ajuste) => {
                          if (await acao({ acao: 'ajustar', numero: l.numero, ...ajuste })) {
                            await carregar();
                          }
                        }}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {dados.previa.length === 0 && (
              <p className="text-secondary/60 py-6 text-center">Ninguém entregou a prova ainda.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Painel;

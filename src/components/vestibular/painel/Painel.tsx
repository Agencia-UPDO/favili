'use client';

import { notaMinimaBolsa } from '@/data/bolsas';
import { cn } from '@/utils/cn';
import { FormEvent, useCallback, useEffect, useState } from 'react';

// Painel interno da faculdade: acompanhar inscrições, conferir a prévia do resultado, publicar e baixar planilhas

type Dados = {
  resumo: {
    inscricoes: number;
    fazemProva: number;
    iniciaram: number;
    entregaram: number;
    porForma: { forma: string; total: number }[];
  };
  inscricoes: {
    numero: number;
    criadoEm: string;
    nome: string;
    celular: string;
    email: string;
    forma: string;
    curso: string;
    prova: string;
    situacao: string;
    nota: number | null;
    atendimentoEspecial: string | null;
  }[];
  previa: {
    numero: number;
    iniciais: string;
    oferta: string;
    nota: number;
    notaMatematica: number;
    aprovado: boolean;
    ajuste: Ajuste | null;
    classificacaoGeral: number | null;
    classificacaoOferta: number | null;
    bolsa: number | null;
  }[];
  publicadoEm: string | null;
};

type Ajuste = { situacao: 'aprovado' | 'reprovado' | null; bolsa: number | null; obs: string; em: string };
type Linha = Dados['previa'][number];

const faixasBolsa = Object.keys(notaMinimaBolsa)
  .map(Number)
  .sort((a, b) => b - a);

// Ajuste manual de uma linha (só antes de publicar): situação, faixa de bolsa e observação
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
        onChange={(e) => salvar({ ...atual, obs, situacao: (e.target.value || null) as Ajuste['situacao'] })}
        className={cn(campo, atual.situacao && 'border-vest-blue text-vest-blue font-bold')}>
        <option value="">Situação: pela nota</option>
        <option value="aprovado">Aprovar</option>
        <option value="reprovado">Reprovar</option>
      </select>
      <select
        value={atual.bolsa ?? ''}
        disabled={travado || !linha.aprovado}
        aria-label={`Bolsa da inscrição ${linha.numero}`}
        onChange={(e) => salvar({ ...atual, obs, bolsa: e.target.value === '' ? null : Number(e.target.value) })}
        className={cn(campo, atual.bolsa !== null && 'border-vest-blue text-vest-blue font-bold')}>
        <option value="">Bolsa: pela nota</option>
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

// Faixa de cada candidato no resultado
const faixa = (l: Linha) => (!l.aprovado ? 'Reprovado' : l.bolsa ? `Bolsa ${l.bolsa}%` : '40% garantido');

const dataHora = (iso: string) => new Date(iso).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });
const celular = (c: string) => c.replace(/^(\d{2})(\d{5})(\d{4})$/, '($1) $2-$3');

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
  const [aba, setAba] = useState<'inscricoes' | 'resultado'>('inscricoes');
  const [busca, setBusca] = useState('');
  const [ocupado, setOcupado] = useState(false);

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

  const filtradas = dados.inscricoes.filter((i) =>
    `${i.numero} ${i.nome} ${i.email} ${i.curso}`.toLowerCase().includes(busca.toLowerCase()),
  );
  const contemplados = dados.previa.filter((l) => l.bolsa);
  const aprovados = dados.previa.filter((l) => l.aprovado);

  return (
    <div className="mx-auto max-w-[1200px] space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-chamada text-vest-navy text-[34px]">Painel do vestibular 2027.1</h1>
        <button
          type="button"
          onClick={async () => (await acao({ acao: 'sair' })) && setStatus('login')}
          className="text-secondary/70 cursor-pointer text-[14px] font-semibold hover:underline">
          Sair
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Cartao titulo="Inscrições" valor={dados.resumo.inscricoes} />
        <Cartao titulo="Com prova agendada" valor={dados.resumo.fazemProva} />
        <Cartao titulo="Começaram a prova" valor={dados.resumo.iniciaram} />
        <Cartao titulo="Entregaram" valor={dados.resumo.entregaram} />
      </div>
      <p className="text-secondary/70 text-[14px]">
        {dados.resumo.porForma.map((f) => `${f.forma}: ${f.total}`).join(' · ')}
      </p>

      <div className="flex gap-2">
        {(['inscricoes', 'resultado'] as const).map((a) => (
          <button
            key={a}
            type="button"
            onClick={() => setAba(a)}
            className={cn(
              'cursor-pointer rounded-full px-5 py-2.5 text-[15px] font-bold',
              aba === a ? 'bg-vest-navy text-white' : 'text-vest-navy bg-white',
            )}>
            {a === 'inscricoes' ? 'Inscrições' : 'Resultado'}
          </button>
        ))}
      </div>

      {aba === 'inscricoes' ? (
        <div className="space-y-3 rounded-[24px] bg-white p-4 md:p-6">
          <div className="flex flex-wrap items-center gap-3">
            <input
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar por nome, e-mail, curso ou nº"
              className="border-stroke-3 h-11 min-w-[240px] flex-1 rounded-full border px-4"
            />
            <a
              href="/api/vestibular/painel?planilha=inscricoes"
              className="bg-vest-blue rounded-full px-5 py-2.5 text-[14px] font-bold text-white">
              Baixar planilha (CSV)
            </a>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-[14px]">
              <thead className="text-secondary/60 border-stroke-2 border-b">
                <tr>
                  {['Nº', 'Data', 'Nome', 'WhatsApp', 'Forma', 'Curso', 'Prova', 'Situação', 'Nota'].map((c) => (
                    <th key={c} className="px-2 py-2 font-semibold">
                      {c}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtradas.map((i) => (
                  <tr key={i.numero} className="border-stroke-2 border-b align-top">
                    <td className="px-2 py-2 font-semibold">{i.numero}</td>
                    <td className="px-2 py-2 whitespace-nowrap">{dataHora(i.criadoEm)}</td>
                    <td className="px-2 py-2">
                      {i.nome}
                      <span className="text-secondary/60 block text-[12px]">{i.email}</span>
                      {i.atendimentoEspecial && (
                        <span className="mt-1 block rounded bg-amber-100 px-1.5 text-[12px] text-amber-900">
                          Atendimento especial: {i.atendimentoEspecial}
                        </span>
                      )}
                    </td>
                    <td className="px-2 py-2 whitespace-nowrap">
                      <a
                        href={`https://wa.me/55${i.celular}`}
                        target="_blank"
                        rel="noopener"
                        className="text-vest-blue">
                        {celular(i.celular)}
                      </a>
                    </td>
                    <td className="px-2 py-2">{i.forma}</td>
                    <td className="px-2 py-2">{i.curso}</td>
                    <td className="px-2 py-2 whitespace-nowrap">{i.prova}</td>
                    <td className="px-2 py-2">{i.situacao}</td>
                    <td className="px-2 py-2">{i.nota ?? '—'}</td>
                  </tr>
                ))}
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
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1080px] text-left text-[14px]">
              <thead className="text-secondary/60 border-stroke-2 border-b">
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
                    <td className="px-2 py-2">{l.iniciais}</td>
                    <td className="px-2 py-2">{l.oferta}</td>
                    <td className="px-2 py-2">{l.nota.toFixed(1)}</td>
                    <td className="px-2 py-2">{l.notaMatematica.toFixed(1)}</td>
                    <td className="px-2 py-2 font-bold">{faixa(l)}</td>
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

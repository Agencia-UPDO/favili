'use client';

import { areasEnem, enemMediaMinima, NotasEnem } from '@/data/bolsas';
import { documentoTamanhoMaximo, documentoTipos, itensDocumento, StatusDocumento } from '@/data/inscricao';
import { FormaId, instituicao, vestibular } from '@/data/vestibular';
import { cn } from '@/utils/cn';
import { useRef, useState } from 'react';
import { Check, Seta } from '../ui';

// Envio dos documentos do Enem, da segunda graduação e da transferência, item a item.
// O arquivo vai direto do navegador para a pasta privada (link de envio do servidor) e depois o servidor confere.
// Mobile first: "Tirar foto" abre a câmera; "Escolher arquivo" abre a galeria ou os arquivos.

export type DocumentoEnviado = { id: string; item: string; nome: string; tamanho: number };

export type InscricaoComDocumentos = {
  forma: FormaId;
  documentoStatus?: StatusDocumento | null;
  documentoObs?: string | null;
  documentos?: DocumentoEnviado[];
  enemAno?: number | null;
  enemNotas?: Partial<NotasEnem> | null;
};

const tamanhoBr = (bytes: number) =>
  bytes >= 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1).replace('.', ',')} MB` : `${Math.ceil(bytes / 1024)} KB`;

// Alguns celulares não informam o tipo das fotos HEIC: deduz pela extensão
const tipoDoArquivo = (arquivo: File) => {
  if (arquivo.type) {
    return arquivo.type;
  }
  const ext = arquivo.name.split('.').pop()?.toLowerCase();
  return ext === 'heic' || ext === 'heif' ? 'image/heic' : ext === 'pdf' ? 'application/pdf' : '';
};

const enviarComProgresso = (url: string, arquivo: File, tipo: string, aoProgredir: (p: number) => void) =>
  new Promise<boolean>((resolve) => {
    const xhr = new XMLHttpRequest();
    xhr.open('PUT', url);
    xhr.setRequestHeader('Content-Type', tipo);
    xhr.upload.onprogress = (e) => e.lengthComputable && aoProgredir(e.loaded / e.total);
    xhr.onload = () => resolve(xhr.status >= 200 && xhr.status < 300);
    xhr.onerror = () => resolve(false);
    xhr.send(arquivo);
  });

const cabecalhos: Record<StatusDocumento, { titulo: string; texto: string; tom: string }> = {
  pendente: {
    titulo: 'Falta enviar seu documento',
    texto: `Sua aprovação (com ${vestibular.descontoGarantido} de desconto) só acontece depois que a equipe conferir o documento. Pode tirar foto do papel ou mandar o PDF.`,
    tom: 'bg-vest text-white',
  },
  enviado: {
    titulo: 'Em análise',
    texto:
      'Recebemos seus documentos. Respondemos em até 1 dia útil, aqui nesta página. Enquanto isso, ainda dá para trocar algum arquivo.',
    tom: 'bg-primary-50 text-vest-navy',
  },
  aprovado: {
    titulo: 'Aprovado! Faça sua matrícula',
    texto: `Sua vaga está confirmada com ${vestibular.descontoGarantido} de desconto. A matrícula vai de ${vestibular.matricula}, pelo sistema da faculdade.`,
    tom: 'bg-green-50 text-green-900',
  },
  recusado: {
    titulo: 'Precisamos de outro documento',
    texto: 'Veja o motivo abaixo e mande de novo. Os arquivos antigos podem ser removidos.',
    tom: 'bg-amber-50 text-amber-950',
  },
  reprovado: {
    titulo: 'Não aprovado',
    texto: `Suas notas do Enem ficaram abaixo do mínimo exigido (média de ${enemMediaMinima} pontos e redação acima de zero). Se quiser conversar sobre outras formas de ingresso, fale com a Faculdade Vidal pelo ${instituicao.telefone}.`,
    tom: 'bg-primary-50 text-vest-navy',
  },
};

// Enem: ano e notas do boletim, opcionais, para a equipe só conferir
const NotasDoEnem = ({
  inscricao,
  salvar,
}: {
  inscricao: InscricaoComDocumentos;
  salvar: (ano: string, notas: Record<string, string>) => Promise<string | null>;
}) => {
  const [ano, setAno] = useState(inscricao.enemAno ? String(inscricao.enemAno) : '');
  const [notas, setNotas] = useState<Record<string, string>>(() =>
    Object.fromEntries(areasEnem.map((a) => [a.id, inscricao.enemNotas?.[a.id]?.toString().replace('.', ',') ?? ''])),
  );
  const [estado, setEstado] = useState<'idle' | 'salvando' | 'salvo'>('idle');
  const [erro, setErro] = useState('');
  const campo = 'border-stroke-3 h-11 w-full rounded-xl border bg-white px-3 text-[16px]';
  return (
    <div className="bg-primary-50 space-y-3 rounded-2xl p-4">
      <div>
        <p className="text-vest-navy text-[15px] font-bold">Adiante a conferência (opcional)</p>
        <p className="text-secondary/70 text-[13px]">Digite o ano e as notas que estão no seu boletim.</p>
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        <label className="text-[13px]">
          Ano do Enem
          <input
            value={ano}
            onChange={(e) => setAno(e.target.value.replace(/\D/g, '').slice(0, 4))}
            inputMode="numeric"
            placeholder="2025"
            className={campo}
          />
        </label>
        {areasEnem.map((a) => (
          <label key={a.id} className="text-[13px]">
            {a.rotulo}
            <input
              value={notas[a.id]}
              onChange={(e) => setNotas({ ...notas, [a.id]: e.target.value.replace(/[^\d,.]/g, '').slice(0, 6) })}
              inputMode="decimal"
              placeholder="0 a 1000"
              className={campo}
            />
          </label>
        ))}
      </div>
      {erro && <p className="text-[13px] font-semibold text-red-600">{erro}</p>}
      <button
        type="button"
        disabled={estado === 'salvando'}
        onClick={async () => {
          setEstado('salvando');
          const falha = await salvar(ano, notas);
          setErro(falha ?? '');
          setEstado(falha ? 'idle' : 'salvo');
        }}
        className="border-vest-blue text-vest-blue cursor-pointer rounded-full border-2 px-5 py-2 text-[14px] font-bold disabled:opacity-60">
        {estado === 'salvando' ? 'Salvando…' : estado === 'salvo' ? 'Notas salvas ✓' : 'Salvar notas'}
      </button>
    </div>
  );
};

const EnvioDocumentos = ({
  inscricao,
  cpf,
  codigo,
  aoAtualizar,
}: {
  inscricao: InscricaoComDocumentos;
  cpf: string;
  codigo: string;
  aoAtualizar: (i: InscricaoComDocumentos) => void;
}) => {
  const itens = itensDocumento[inscricao.forma] ?? [];
  const status = inscricao.documentoStatus ?? 'pendente';
  const documentos = inscricao.documentos ?? [];
  const [enviando, setEnviando] = useState<{ item: string; nome: string; progresso: number } | null>(null);
  const [aviso, setAviso] = useState<{ item: string; texto: string } | null>(null);
  const prazoAberto = Date.now() < new Date(vestibular.fimInscricoes).getTime();
  const analisado = status === 'aprovado' || status === 'reprovado';
  const editavel = !analisado && prazoAberto;
  const camera = useRef<Record<string, HTMLInputElement | null>>({});
  const galeria = useRef<Record<string, HTMLInputElement | null>>({});

  if (!itens.length) {
    return null;
  }

  const chamar = async (corpo: Record<string, unknown>) => {
    const res = await fetch('/api/vestibular/documento', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cpf, codigo, ...corpo }),
    }).catch(() => null);
    const json = res ? await res.json().catch(() => ({})) : {};
    return res?.ok && json.ok ? json : { ok: false, mensagem: json.mensagem ?? 'Sem conexão. Tente de novo.' };
  };

  const enviar = async (item: string, arquivos: FileList | null) => {
    setAviso(null);
    for (const arquivo of Array.from(arquivos ?? [])) {
      const tipo = tipoDoArquivo(arquivo);
      if (!documentoTipos.includes(tipo)) {
        setAviso({ item, texto: `${arquivo.name}: mande em PDF ou como foto (JPG, PNG, HEIC).` });
        continue;
      }
      if (arquivo.size > documentoTamanhoMaximo) {
        setAviso({ item, texto: `${arquivo.name} passa de 10 MB. Mande uma foto ou um PDF menor.` });
        continue;
      }
      setEnviando({ item, nome: arquivo.name, progresso: 0 });
      const envio = await chamar({ acao: 'preparar', item, tipo, tamanho: arquivo.size });
      if (!envio.ok) {
        setAviso({ item, texto: envio.mensagem });
        break;
      }
      const chegou = await enviarComProgresso(envio.url, arquivo, tipo, (p) =>
        setEnviando({ item, nome: arquivo.name, progresso: p }),
      );
      if (!chegou) {
        setAviso({ item, texto: 'O envio falhou. Confira sua internet e tente de novo.' });
        break;
      }
      const confirmado = await chamar({ acao: 'confirmar', caminho: envio.caminho, nome: arquivo.name });
      if (!confirmado.ok) {
        setAviso({ item, texto: confirmado.mensagem });
        break;
      }
      aoAtualizar(confirmado.inscricao);
    }
    setEnviando(null);
  };

  const remover = async (id: string, item: string) => {
    const resposta = await chamar({ acao: 'remover', id });
    if (resposta.ok) {
      aoAtualizar(resposta.inscricao);
    } else {
      setAviso({ item, texto: resposta.mensagem });
    }
  };

  const cabecalho = cabecalhos[status];

  return (
    <section className="border-stroke-2 overflow-hidden rounded-[22px] border bg-white print:hidden" aria-live="polite">
      <div className={cn('space-y-1 p-5 [&>p]:text-current', cabecalho.tom)}>
        <p className="text-[19px] font-bold">{cabecalho.titulo}</p>
        <p className="text-[14px] opacity-90">{cabecalho.texto}</p>
        {status === 'recusado' && inscricao.documentoObs && (
          <p className="mt-2 rounded-xl bg-white p-3 text-[14px] font-semibold">Motivo: {inscricao.documentoObs}</p>
        )}
        {status === 'aprovado' && (
          <a
            href={vestibular.sei}
            target="_blank"
            rel="noopener"
            className="bg-vest-yellow text-vest-navy mt-3 inline-flex items-center gap-2 rounded-full px-5 py-2.5 font-extrabold">
            Fazer minha matrícula <Seta />
          </a>
        )}
      </div>

      {!analisado && (
        <>
          <ul className="divide-stroke-2 divide-y">
            {itens.map((item) => {
              const doItem = documentos.filter((d) => d.item === item.id);
              const ativo = enviando?.item === item.id;
              return (
                <li key={item.id} className="space-y-3 p-5">
                  <div className="flex items-start gap-3">
                    <span
                      className={cn(
                        'mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full border-2',
                        doItem.length ? 'border-vest-blue bg-vest-blue text-white' : 'border-stroke-3',
                      )}>
                      {doItem.length > 0 && <Check className="size-3.5" />}
                    </span>
                    <div>
                      <p className="text-vest-navy text-[16px] font-bold">{item.rotulo}</p>
                      <p className="text-secondary/70 text-[13px]">{item.dica}</p>
                    </div>
                  </div>

                  {doItem.length > 0 && (
                    <ul className="space-y-2 pl-9">
                      {doItem.map((d) => (
                        <li
                          key={d.id}
                          className="bg-primary-50 flex items-center gap-2 rounded-xl px-3 py-2 text-[14px]">
                          <span className="min-w-0 flex-1 truncate">{d.nome}</span>
                          <span className="text-secondary/60 shrink-0 text-[12px]">{tamanhoBr(d.tamanho)}</span>
                          {editavel && (
                            <button
                              type="button"
                              onClick={() => remover(d.id, item.id)}
                              disabled={!!enviando}
                              aria-label={`Remover ${d.nome}`}
                              className="text-secondary/60 shrink-0 cursor-pointer px-1 text-[18px] leading-none hover:text-red-600">
                              ×
                            </button>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}

                  {ativo && (
                    <div className="space-y-1 pl-9">
                      <p className="truncate text-[13px]">Enviando {enviando.nome}…</p>
                      <div className="bg-primary-50 h-2 overflow-hidden rounded-full">
                        <div
                          className="bg-vest-blue h-full rounded-full transition-[width]"
                          style={{ width: `${Math.round(enviando.progresso * 100)}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {aviso?.item === item.id && (
                    <p role="alert" className="pl-9 text-[14px] font-semibold text-red-600">
                      {aviso.texto}
                    </p>
                  )}

                  {editavel && !ativo && (
                    <div className="flex flex-wrap gap-2 pl-9">
                      <input
                        ref={(el) => {
                          camera.current[item.id] = el;
                        }}
                        type="file"
                        accept="image/*"
                        capture="environment"
                        className="hidden"
                        onChange={(e) => {
                          enviar(item.id, e.target.files);
                          e.target.value = '';
                        }}
                      />
                      <input
                        ref={(el) => {
                          galeria.current[item.id] = el;
                        }}
                        type="file"
                        accept="application/pdf,image/*,.heic,.heif"
                        multiple
                        className="hidden"
                        onChange={(e) => {
                          enviar(item.id, e.target.files);
                          e.target.value = '';
                        }}
                      />
                      <button
                        type="button"
                        disabled={!!enviando}
                        onClick={() => camera.current[item.id]?.click()}
                        className="bg-vest-yellow text-vest-navy cursor-pointer rounded-full px-5 py-2.5 text-[15px] font-extrabold disabled:opacity-60">
                        Tirar foto
                      </button>
                      <button
                        type="button"
                        disabled={!!enviando}
                        onClick={() => galeria.current[item.id]?.click()}
                        className="border-vest-blue text-vest-blue cursor-pointer rounded-full border-2 px-5 py-2 text-[15px] font-bold disabled:opacity-60">
                        {doItem.length ? 'Adicionar arquivo' : 'Escolher arquivo'}
                      </button>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>

          {inscricao.forma === 'enem' && editavel && (
            <div className="px-5 pb-5">
              <NotasDoEnem
                inscricao={inscricao}
                salvar={async (ano, notas) => {
                  const resposta = await chamar({ acao: 'notas', ano, notas });
                  if (resposta.ok) {
                    aoAtualizar(resposta.inscricao);
                    return null;
                  }
                  return resposta.mensagem;
                }}
              />
            </div>
          )}
        </>
      )}

      <div className="text-secondary/70 border-stroke-2 space-y-1 border-t px-5 py-4 text-[13px]">
        {!analisado &&
          (prazoAberto ? (
            <p>
              PDF ou foto, até 10 MB cada. Se não tiver o documento agora, pode enviar depois em Minha inscrição, até
              20/11 às 18h.
            </p>
          ) : (
            <p>O prazo para enviar pelo site terminou. Fale com a Faculdade Vidal.</p>
          ))}
        <p>
          {instituicao.whatsapp ? (
            <>
              Prefere mandar pelo WhatsApp?{' '}
              <a
                href={`https://wa.me/${instituicao.whatsapp}`}
                target="_blank"
                rel="noopener"
                className="text-vest-blue font-semibold">
                Fale com a secretaria
              </a>
            </>
          ) : (
            <>
              Dúvidas? Fale com a Faculdade Vidal pelo{' '}
              <a href={instituicao.telefoneLink} className="text-vest-blue font-semibold">
                {instituicao.telefone}
              </a>
            </>
          )}
          .
        </p>
      </div>
    </section>
  );
};

export default EnvioDocumentos;

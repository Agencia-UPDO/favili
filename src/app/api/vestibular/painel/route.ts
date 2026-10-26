import { areasEnem, notaMinimaBolsa } from '@/data/bolsas';
import { formas } from '@/data/vestibular';
import { itensDocumento } from '@/data/inscricao';
import {
  confirmarNotasEnem,
  ErroDocumento,
  lerLocal,
  linkDeLeitura,
  revisarDocumentos,
} from '@/utils/vestibular/documentos';
import { enviarLembretes, pendentesLembrete } from '@/utils/vestibular/lembretes';
import {
  historicoCodigo,
  listarInscricoes,
  registrarCodigo,
  statusDocumento,
  trocarCodigo,
} from '@/utils/vestibular/inscricoes';
import { enviarAtualizacao } from '@/utils/vestibular/email';
import { enviarConversaoRd } from '@/utils/vestibular/rd';
import { bloqueado, ipDe, limites, mensagemBloqueio, registrarErro } from '@/utils/vestibular/limite';
import { abrirSessao, fecharSessao, painelConfigurado, senhaCorreta, sessaoValida } from '@/utils/vestibular/painel';
import {
  ajustar,
  despublicarResultado,
  previaResultado,
  publicarResultado,
  resultadoPublicado,
} from '@/utils/vestibular/resultado';
import { NextResponse } from 'next/server';

// O envio dos lembretes pelo painel espera ~0,6 s por candidato
export const maxDuration = 300;

// Painel interno da faculdade: inscrições, prévia do resultado, publicação e planilhas (CSV).
// Só responde com a sessão aberta pela senha de VESTIBULAR_PAINEL_SENHA.

const negar = (mensagem: string, status: number) => NextResponse.json({ ok: false, mensagem }, { status });

const celulaCsv = (v: unknown) => {
  const t = v === null || v === undefined ? '' : String(v);
  return /[";\n]/.test(t) ? `"${t.replace(/"/g, '""')}"` : t;
};
// Separador ";" e BOM para o Excel em português abrir com acentos e colunas certas
const csv = (linhas: unknown[][]) => '﻿' + linhas.map((l) => l.map(celulaCsv).join(';')).join('\r\n');

const baixar = (nome: string, conteudo: string) =>
  new NextResponse(conteudo, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${nome}"`,
      'Cache-Control': 'no-store',
    },
  });

const nomeForma = (id: string) => formas.find((f) => f.id === id)?.rotulo ?? id;
const dataBr = (iso?: string | null) => (iso ? iso.slice(0, 10).split('-').reverse().join('/') : '');
const brasilia = (iso?: string | null) =>
  iso ? new Date(iso).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' }) : '';

export async function GET(request: Request) {
  if (!painelConfigurado()) {
    return negar('Painel desativado: defina VESTIBULAR_PAINEL_SENHA.', 503);
  }
  if (!(await sessaoValida())) {
    return negar('Entre com a senha do painel.', 401);
  }

  const params = new URL(request.url).searchParams;
  const planilha = params.get('planilha');
  const inscricoes = await listarInscricoes();

  // Abrir um documento: link da pasta privada que expira em 5 minutos (em desenvolvimento, o próprio arquivo)
  if (params.has('documento')) {
    const doc = inscricoes
      .find((i) => String(i.numero) === params.get('documento'))
      ?.documentos?.find((d) => d.id === params.get('id'));
    if (!doc) {
      return negar('Documento não encontrado.', 404);
    }
    const link = await linkDeLeitura(doc.caminho);
    if (link) {
      return NextResponse.redirect(link);
    }
    return new NextResponse(new Uint8Array(await lerLocal(doc.caminho)), {
      headers: {
        'Content-Type': doc.tipo,
        'Content-Disposition': `inline; filename="${encodeURIComponent(doc.nome)}"`,
        'Cache-Control': 'no-store',
      },
    });
  }

  if (planilha === 'inscricoes') {
    return baixar(
      'vestibular-2027-1-inscricoes.csv',
      csv([
        [
          'Nº inscrição',
          'Data',
          'Nome',
          'CPF',
          'Nascimento',
          'E-mail',
          'WhatsApp',
          'Forma de ingresso',
          'Curso',
          'Modalidade',
          'Unidade',
          'Turno',
          'Processo SEI',
          'Faz prova',
          'Dia da prova',
          'Horário',
          'Faculdade de origem',
          'Curso de origem',
          'Período atual',
          'Atendimento especial',
          'Prova iniciada',
          'Prova entregue',
          'Acertos',
          'Nota',
          'Nota Matemática',
          'Origem',
          'Documentos',
          'Situação dos documentos',
          'Motivo (documento recusado)',
          'Revisado por',
          'Ano do Enem',
          ...areasEnem.map((a) => `Enem ${a.rotulo}`),
          'Média do Enem',
        ],
        ...inscricoes.map((i) => [
          i.numero,
          brasilia(i.criado_em),
          i.nome,
          i.cpf,
          dataBr(i.nascimento),
          i.email,
          i.celular,
          nomeForma(i.forma),
          i.curso,
          i.modalidade,
          i.unidade,
          i.turno,
          i.processo_sei,
          i.faz_prova ? 'sim' : 'não',
          i.dia_prova,
          i.hora_prova,
          i.instituicao_origem,
          i.curso_origem,
          i.periodo_atual,
          i.atendimento_especial,
          brasilia(i.prova_inicio),
          brasilia(i.prova_entregue_em),
          i.acertos,
          i.nota,
          i.nota_matematica,
          i.origem,
          (i.documentos ?? []).length,
          statusDocumento(i),
          i.documento_obs,
          i.documento_revisado_por,
          i.enem_ano,
          ...areasEnem.map((a) => i.enem_notas?.[a.id]),
          i.enem_media,
        ]),
      ]),
    );
  }

  const previa = await previaResultado();
  const porNumero = new Map(inscricoes.map((i) => [i.numero, i]));
  if (planilha === 'resultado') {
    return baixar(
      'vestibular-2027-1-resultado.csv',
      csv([
        [
          'Classificação geral',
          'Classificação no curso',
          'Nº inscrição',
          'Nome',
          'CPF',
          'Nascimento',
          'E-mail',
          'WhatsApp',
          'Forma de ingresso',
          'Curso',
          'Nota',
          'Nota Matemática',
          'Bolsa',
          'Ajuste manual',
        ],
        ...previa.linhas.map((l) => [
          l.classificacaoGeral,
          l.classificacaoOferta,
          l.numero,
          porNumero.get(l.numero)?.nome,
          porNumero.get(l.numero)?.cpf,
          dataBr(porNumero.get(l.numero)?.nascimento),
          porNumero.get(l.numero)?.email,
          porNumero.get(l.numero)?.celular,
          nomeForma(porNumero.get(l.numero)?.forma ?? ''),
          l.oferta,
          l.nota,
          l.notaMatematica,
          !l.aprovado ? 'Reprovado' : l.bolsa ? `${l.bolsa}%` : '40% garantido',
          l.ajuste
            ? [
                l.ajuste.situacao && `${l.ajuste.situacao} manualmente`,
                l.ajuste.bolsa !== null && `bolsa ${l.ajuste.bolsa ? `${l.ajuste.bolsa}%` : 'retirada'} manualmente`,
                l.ajuste.obs,
              ]
                .filter(Boolean)
                .join(' · ')
            : '',
        ]),
      ]),
    );
  }

  const publicado = await resultadoPublicado();
  return NextResponse.json({
    ok: true,
    resumo: {
      inscricoes: inscricoes.length,
      fazemProva: inscricoes.filter((i) => i.faz_prova).length,
      iniciaram: inscricoes.filter((i) => i.prova_inicio).length,
      entregaram: inscricoes.filter((i) => i.prova_entregue_em).length,
      documentosParaAnalisar: inscricoes.filter((i) => statusDocumento(i) === 'enviado').length,
      porForma: formas.map((f) => ({ forma: f.rotulo, total: inscricoes.filter((i) => i.forma === f.id).length })),
    },
    inscricoes: inscricoes
      .slice()
      .reverse()
      .map((i) => ({
        numero: i.numero,
        criadoEm: i.criado_em,
        nome: i.nome,
        cpf: i.cpf,
        nascimento: i.nascimento,
        celular: i.celular,
        email: i.email,
        forma: nomeForma(i.forma),
        formaId: i.forma,
        curso: `${i.curso} · ${i.modalidade} · ${i.unidade} · ${i.turno}`,
        origemAcademica: [i.instituicao_origem, i.curso_origem, i.periodo_atual && `${i.periodo_atual} período`]
          .filter(Boolean)
          .join(' · '),
        prova: i.faz_prova
          ? `${i.dia_prova?.split('-').reverse().slice(0, 2).join('/')} ${i.hora_prova?.slice(0, 5)}`
          : '—',
        situacao: i.prova_entregue_em
          ? 'Entregue'
          : i.prova_inicio
            ? 'Fazendo'
            : i.faz_prova
              ? 'Agendada'
              : 'Em análise',
        nota: i.nota ?? null,
        atendimentoEspecial: i.atendimento_especial,
        documentoStatus: statusDocumento(i),
        documentoObs: i.documento_obs ?? null,
        documentoRevisadoEm: i.documento_revisado_em ?? null,
        documentoRevisadoPor: i.documento_revisado_por ?? null,
        enemAno: i.enem_ano ?? null,
        enemNotas: i.enem_notas ?? null,
        enemMedia: i.enem_media ?? null,
        // envio mais recente, para a fila "para analisar" (mais antigo primeiro)
        documentoEnviadoEm: (i.documentos ?? []).reduce<string | null>(
          (ultimo, d) => (!ultimo || d.enviadoEm > ultimo ? d.enviadoEm : ultimo),
          null,
        ),
        documentos: (i.documentos ?? []).map(({ id, item, nome, tamanho }) => ({
          id,
          item: itensDocumento[i.forma as keyof typeof itensDocumento]?.find((it) => it.id === item)?.rotulo ?? item,
          nome,
          tamanho,
        })),
      })),
    // A prévia leva os dados completos do candidato: o painel é interno (a página pública usa só as iniciais)
    previa: previa.linhas.map((l) => {
      const i = porNumero.get(l.numero);
      return { ...l, nome: i?.nome ?? '', cpf: i?.cpf ?? '', email: i?.email ?? '', celular: i?.celular ?? '' };
    }),
    publicadoEm: publicado?.publicadoEm ?? null,
  });
}

export async function POST(request: Request) {
  if (!painelConfigurado()) {
    return negar('Painel desativado: defina VESTIBULAR_PAINEL_SENHA.', 503);
  }
  const corpo = await request.json().catch(() => ({}));

  if (corpo.acao === 'entrar') {
    const chave = `painel:${ipDe(request)}`;
    if (await bloqueado({ [chave]: limites.ipPainel })) {
      return negar(mensagemBloqueio, 429);
    }
    if (!senhaCorreta(typeof corpo.senha === 'string' ? corpo.senha : '')) {
      await registrarErro([chave]);
      await new Promise((r) => setTimeout(r, 1000));
      return negar('Senha incorreta.', 401);
    }
    await abrirSessao();
    return NextResponse.json({ ok: true });
  }

  if (!(await sessaoValida())) {
    return negar('Entre com a senha do painel.', 401);
  }

  if (corpo.acao === 'sair') {
    await fecharSessao();
    return NextResponse.json({ ok: true });
  }
  // Quem está usando o painel (nome digitado na tela), para registrar quem revisou
  const por = typeof corpo.por === 'string' ? corpo.por.trim().slice(0, 60) : '';
  if (corpo.acao === 'documento') {
    const inscricao = (await listarInscricoes()).find((i) => i.numero === Number(corpo.numero));
    const decisao = corpo.decisao;
    if (!inscricao || !statusDocumento(inscricao)) {
      return negar('Inscrição não encontrada ou sem documentos.', 400);
    }
    if (decisao !== 'aprovado' && decisao !== 'recusado' && decisao !== 'enviado') {
      return negar('Decisão inválida.', 400);
    }
    const obs = typeof corpo.obs === 'string' ? corpo.obs.trim().slice(0, 300) : '';
    if (decisao === 'recusado' && !obs) {
      return negar('Escreva o motivo para o candidato saber o que mandar.', 400);
    }
    // Situação do documento chega à RD (conversão de atualização, sem disparar WhatsApp)
    await enviarConversaoRd(await revisarDocumentos(inscricao, decisao, obs, por), 'atualizacao');
    return NextResponse.json({ ok: true });
  }
  if (corpo.acao === 'enem') {
    const inscricao = (await listarInscricoes()).find((i) => i.numero === Number(corpo.numero));
    if (!inscricao || inscricao.forma !== 'enem') {
      return negar('Inscrição do Enem não encontrada.', 400);
    }
    try {
      await enviarConversaoRd(await confirmarNotasEnem(inscricao, corpo.ano, corpo.notas, por), 'atualizacao');
    } catch (e) {
      if (e instanceof ErroDocumento) {
        return negar(e.message, 400);
      }
      throw e;
    }
    return NextResponse.json({ ok: true });
  }
  if (corpo.acao === 'ver-codigo' || corpo.acao === 'novo-codigo') {
    if (!por) {
      return negar('Digite seu nome no topo do painel: fica registrado quem viu ou trocou o código.', 400);
    }
    let inscricao = (await listarInscricoes()).find((i) => i.numero === Number(corpo.numero));
    if (!inscricao) {
      return negar('Inscrição não encontrada.', 404);
    }
    if (corpo.acao === 'novo-codigo') {
      inscricao = await trocarCodigo(inscricao);
      // Código novo para o aluno (e-mail) e para o lead na RD (conversão de atualização, sem disparar WhatsApp)
      await Promise.all([enviarAtualizacao(inscricao), enviarConversaoRd(inscricao, 'atualizacao')]);
    }
    await registrarCodigo(inscricao.numero, corpo.acao === 'novo-codigo' ? 'gerar' : 'ver', por);
    return NextResponse.json({
      ok: true,
      codigo: inscricao.codigo,
      historico: await historicoCodigo(inscricao.numero),
    });
  }
  if (corpo.acao === 'reenviar-rd') {
    // Reenvia todas as inscrições como "atualização" (não dispara o WhatsApp), em sequência para não sobrecarregar a RD
    let enviadas = 0;
    for (const i of await listarInscricoes()) {
      if (await enviarConversaoRd(i, 'atualizacao')) {
        enviadas++;
      }
    }
    return NextResponse.json({ ok: true, enviadas });
  }
  // Plano B do cron do lembrete (19/11): primeiro conta quem vai receber, depois envia (só quem ainda não recebeu)
  if (corpo.acao === 'lembretes-previa') {
    return NextResponse.json({ ok: true, pendentes: (await pendentesLembrete()).length });
  }
  if (corpo.acao === 'lembretes-enviar') {
    return NextResponse.json({ ok: true, ...(await enviarLembretes()) });
  }
  if (corpo.acao === 'publicar') {
    const resultado = await publicarResultado();
    return NextResponse.json({ ok: true, publicadoEm: resultado.publicadoEm });
  }
  if (corpo.acao === 'ajustar') {
    // Depois de publicado, o resultado fica travado: é preciso tirar do ar para ajustar
    if ((await resultadoPublicado())?.publicadoEm) {
      return negar('O resultado já foi publicado. Tire do ar antes de fazer ajustes.', 409);
    }
    const numero = Number(corpo.numero);
    if (!(await listarInscricoes()).some((i) => i.numero === numero && i.prova_entregue_em)) {
      return negar('Inscrição não encontrada ou sem prova entregue.', 400);
    }
    const bolsa = corpo.bolsa === null || corpo.bolsa === undefined || corpo.bolsa === '' ? null : Number(corpo.bolsa);
    if (bolsa !== null && bolsa !== 0 && !(bolsa in notaMinimaBolsa)) {
      return negar('Faixa de bolsa inválida.', 400);
    }
    await ajustar(numero, {
      situacao: corpo.situacao === 'aprovado' || corpo.situacao === 'reprovado' ? corpo.situacao : null,
      bolsa,
      obs: typeof corpo.obs === 'string' ? corpo.obs.trim().slice(0, 300) : '',
    });
    return NextResponse.json({ ok: true });
  }
  if (corpo.acao === 'despublicar') {
    await despublicarResultado();
    return NextResponse.json({ ok: true, publicadoEm: null });
  }
  return negar('Ação inválida.', 400);
}

import { notaMinimaBolsa } from '@/data/bolsas';
import { formas } from '@/data/vestibular';
import { listarInscricoes } from '@/utils/vestibular/inscricoes';
import { abrirSessao, fecharSessao, painelConfigurado, senhaCorreta, sessaoValida } from '@/utils/vestibular/painel';
import {
  ajustar,
  despublicarResultado,
  previaResultado,
  publicarResultado,
  resultadoPublicado,
} from '@/utils/vestibular/resultado';
import { NextResponse } from 'next/server';

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

  const planilha = new URL(request.url).searchParams.get('planilha');
  const inscricoes = await listarInscricoes();

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
    if (!senhaCorreta(typeof corpo.senha === 'string' ? corpo.senha : '')) {
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

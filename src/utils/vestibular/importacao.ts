import 'server-only';

import { diasProva, horariosProva, nomeOferta, Oferta, ofertas } from '@/data/inscricao';
import { FormaId } from '@/data/vestibular';
import { CpfJaInscrito, criarInscricao, gravarConfig, Inscricao, lerConfig, NovaInscricao } from './inscricoes';
import { celularValido, cpfValido, emailValido, idadeEm, soDigitos } from './validacao';

// "Importar do SEI" (painel): traz para o nosso sistema quem se inscreveu pelo formulário do SEI no mesmo processo
// (Conquista Vidal 2027.1). Entra uma planilha CSV já cruzada (um candidato por linha) com as colunas:
//   cpf; nome; email; celular; nascimento (opcional); curso_sei; inscricao_sei; tipo; dia; hora
// - curso_sei: nome do curso como no SEI ("ENFERMAGEM", "ADMINISTRAÇÃO-EAD", "PEDAGOGIA-SEMI", ...);
// - tipo: "Proc. Seletivo" (vestibular, faz prova) ou "Enem";
// - dia/hora: como no SEI ("21/11/2026" e "18.00"); "--" = sem prova (Enem).
// Duas etapas: a prévia só analisa (criar / já existe pelo CPF / problema); a importação cria as inscrições com nº e
// código do nosso sistema e o dia/horário do SEI. Os avisos (e-mail de confirmação + nova inscrição na RD, que dispara
// o WhatsApp) não saem aqui: vão para a fila (filaSei.ts), enviada em lotes pequenos.
// Data de nascimento: se a planilha trouxer, é usada. Sem ela, a linha só é aceita com a opção aceitarSemNascimento
// (exige antes o SQL supabase/migrations/20261104_vestibular_nascimento_opcional.sql); o candidato informa depois em
// Minha inscrição, antes da prova.

export type OpcoesImportacao = {
  // Os cursos EAD/semipresencial existem nas duas unidades; o relatório do SEI não diz qual
  unidadeEad: 'limoeiro' | 'fortaleza';
  // Mesmo CPF em 2 cursos no SEI: fica o de maior nº SEI (o mais recente; padrão), o de menor, ou nenhum
  duplicados: 'maior-inscricao' | 'menor-inscricao' | 'pular';
  // Coloca as inscrições criadas na fila de avisos (e-mail + RD nova inscrição)
  avisar: boolean;
  aceitarSemNascimento: boolean;
};

export const lerOpcoes = (o: Record<string, unknown> | undefined): OpcoesImportacao => ({
  unidadeEad: o?.unidadeEad === 'fortaleza' ? 'fortaleza' : 'limoeiro',
  duplicados: o?.duplicados === 'menor-inscricao' || o?.duplicados === 'pular' ? o.duplicados : 'maior-inscricao',
  avisar: o?.avisar !== false,
  aceitarSemNascimento: o?.aceitarSemNascimento === true,
});

export type StatusLinha = 'criar' | 'existe' | 'problema' | 'descartada';

export type LinhaImportacao = {
  linha: number; // linha na planilha (1 = cabeçalho)
  nome: string;
  inscricaoSei: string;
  curso: string;
  prova: string;
  status: StatusLinha;
  motivo: string;
  numeroExistente: number | null;
  dados: NovaInscricao | null;
};

// "ENFERMAGEM" / "Administração-EAD" → "ENFERMAGEM" / "ADMINISTRACAO-EAD"
const normalizar = (t: string) => t.normalize('NFKD').replace(/[̀-ͯ]/g, '').toUpperCase().replace(/\s+/g, ' ').trim();

// Curso do SEI → oferta do nosso sistema (EAD/semipresencial pela unidade escolhida)
const ofertaDoCurso = (cursoSei: string, unidade: OpcoesImportacao['unidadeEad']): Oferta | null => {
  const c = normalizar(cursoSei);
  const fortaleza = unidade === 'fortaleza';
  const id = (
    {
      ADMINISTRACAO: 'administracao',
      BIOMEDICINA: 'biomedicina',
      DIREITO: 'direito',
      ENFERMAGEM: 'enfermagem',
      FISIOTERAPIA: 'fisioterapia',
      ODONTOLOGIA: 'odontologia',
      PSICOLOGIA: 'psicologia',
      'TERAPIA OCUPACIONAL': 'terapia-ocupacional',
      'ADMINISTRACAO-EAD': fortaleza ? 'administracao-ead-fortaleza' : 'administracao-ead',
      'PEDAGOGIA-SEMI': fortaleza ? 'pedagogia-semi-fortaleza' : 'pedagogia-semi',
      'GESTAO DE RECURSOS HUMANOS': fortaleza ? 'recursos-humanos-ead-fortaleza' : 'recursos-humanos-ead',
    } as Record<string, string>
  )[c];
  return ofertas.find((o) => o.id === id && o.ativo !== false) ?? null;
};

// "MARIA DA SILVA" → "Maria da Silva"
const nomeProprio = (nome: string) =>
  nome
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .map((p, idx) => (idx > 0 && /^(da|de|do|das|dos|e)$/.test(p) ? p : p.charAt(0).toUpperCase() + p.slice(1)))
    .join(' ');

// "21/11/2026" ou "2026-11-21" → "2026-11-21"
const dataIso = (t: string) => {
  const br = t.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (br) {
    return `${br[3]}-${br[2]}-${br[1]}`;
  }
  return /^\d{4}-\d{2}-\d{2}$/.test(t) ? t : '';
};

// "18.00" / "18:00" / "8:00" → "18:00" / "08:00"
const horaPadrao = (t: string) => {
  const m = t.match(/^(\d{1,2})[.:h](\d{2})$/);
  return m ? `${m[1].padStart(2, '0')}:${m[2]}` : '';
};

// CSV com ";" (Excel em português) ou ","; aspas duplas; BOM no começo
export const lerCsv = (texto: string): string[][] => {
  const conteudo = texto.replace(/^﻿/, '');
  const primeira = conteudo.split(/\r?\n/, 1)[0] ?? '';
  const sep = (primeira.match(/;/g)?.length ?? 0) >= (primeira.match(/,/g)?.length ?? 0) ? ';' : ',';
  const linhas: string[][] = [];
  let linha: string[] = [];
  let celula = '';
  let aspas = false;
  for (let i = 0; i < conteudo.length; i++) {
    const c = conteudo[i];
    if (aspas) {
      if (c === '"' && conteudo[i + 1] === '"') {
        celula += '"';
        i++;
      } else if (c === '"') {
        aspas = false;
      } else {
        celula += c;
      }
    } else if (c === '"') {
      aspas = true;
    } else if (c === sep) {
      linha.push(celula);
      celula = '';
    } else if (c === '\n' || c === '\r') {
      if (c === '\r' && conteudo[i + 1] === '\n') {
        i++;
      }
      linha.push(celula);
      linhas.push(linha);
      linha = [];
      celula = '';
    } else {
      celula += c;
    }
  }
  if (celula || linha.length) {
    linha.push(celula);
    linhas.push(linha);
  }
  return linhas.filter((l) => l.some((c) => c.trim()));
};

const colunas = ['cpf', 'nome', 'email', 'celular', 'nascimento', 'curso_sei', 'inscricao_sei', 'tipo', 'dia', 'hora'];
export const colunasObrigatorias = colunas.filter((c) => c !== 'nascimento');

export class ErroImportacao extends Error {}

// Analisa a planilha: cada linha vira "criar", "existe" (CPF já inscrito no nosso sistema) ou "problema" (com motivo)
export const analisar = (texto: string, opcoes: OpcoesImportacao, existentes: Inscricao[]): LinhaImportacao[] => {
  const [cabecalho, ...corpo] = lerCsv(texto);
  if (!cabecalho || !corpo.length) {
    throw new ErroImportacao('A planilha está vazia.');
  }
  const indice = Object.fromEntries(
    colunas.map((c) => [c, cabecalho.findIndex((h) => normalizar(h).replace(/ /g, '_') === c.toUpperCase())]),
  );
  const faltando = colunasObrigatorias.filter((c) => indice[c] < 0);
  if (faltando.length) {
    throw new ErroImportacao(`Faltam colunas na planilha: ${faltando.join(', ')}.`);
  }
  const valor = (l: string[], c: string) => (indice[c] >= 0 ? (l[indice[c]] ?? '').trim() : '');
  const porCpf = new Map(existentes.map((i) => [i.cpf, i]));

  const linhas = corpo.map((l, idx): LinhaImportacao => {
    const cpf = soDigitos(valor(l, 'cpf')).padStart(11, '0');
    const nome = nomeProprio(valor(l, 'nome'));
    const inscricaoSei = valor(l, 'inscricao_sei');
    const cursoSei = valor(l, 'curso_sei');
    const oferta = ofertaDoCurso(cursoSei, opcoes.unidadeEad);
    const tipo = normalizar(valor(l, 'tipo'));
    const forma: FormaId | null = tipo.includes('ENEM') ? 'enem' : tipo.includes('SELETIVO') ? 'vestibular' : null;
    const semProva = ['', '--', '-'].includes(valor(l, 'dia'));
    const dia = semProva ? '' : dataIso(valor(l, 'dia'));
    const hora = semProva ? '' : horaPadrao(valor(l, 'hora'));
    const fazProva = forma === 'vestibular' || (forma === 'enem' && !semProva);
    const nascimentoTexto = valor(l, 'nascimento');
    const nascimento = nascimentoTexto ? dataIso(nascimentoTexto) : '';
    const email = valor(l, 'email').toLowerCase();
    const celular = soDigitos(valor(l, 'celular')).replace(/^55(?=\d{11}$)/, '');
    const base = {
      linha: idx + 2,
      nome,
      inscricaoSei,
      curso: oferta ? nomeOferta(oferta) : cursoSei,
      prova: fazProva && dia && hora ? `${dia.split('-').reverse().slice(0, 2).join('/')} ${hora}` : 'sem prova',
      numeroExistente: null,
      dados: null,
    };
    const problema = (motivo: string): LinhaImportacao => ({ ...base, status: 'problema', motivo });

    if (!cpfValido(cpf)) {
      return problema('CPF inválido');
    }
    const existente = porCpf.get(cpf);
    if (existente) {
      return {
        ...base,
        status: 'existe',
        motivo: 'Já tem inscrição no nosso sistema',
        numeroExistente: existente.numero,
      };
    }
    if (nome.split(' ').length < 2) {
      return problema('Nome incompleto');
    }
    if (!emailValido(email)) {
      return problema('E-mail inválido ou vazio');
    }
    if (!celularValido(celular)) {
      return problema('Celular inválido (precisa de DDD + 9 dígitos)');
    }
    if (!oferta) {
      return problema(`Curso não reconhecido: ${cursoSei || '(vazio)'}`);
    }
    if (!forma) {
      return problema(`Tipo de seleção não reconhecido: ${valor(l, 'tipo') || '(vazio)'}`);
    }
    if (!oferta.formas.includes(forma)) {
      return problema('Forma de ingresso não disponível para o curso');
    }
    if (fazProva && (!diasProva.some((d) => d.id === dia) || !horariosProva.includes(hora))) {
      return problema(`Dia/horário da prova fora dos do vestibular: ${valor(l, 'dia')} ${valor(l, 'hora')}`);
    }
    if (nascimentoTexto) {
      const idade = idadeEm(nascimento);
      if (!nascimento || !(idade >= 14 && idade <= 100)) {
        return problema('Data de nascimento inválida');
      }
    } else if (!opcoes.aceitarSemNascimento) {
      return problema('Sem data de nascimento');
    }
    return {
      ...base,
      status: 'criar',
      motivo: nascimento ? '' : 'Sem data de nascimento: o candidato informa em Minha inscrição',
      dados: {
        cpf,
        nome,
        email,
        celular,
        nascimento: nascimento || null,
        forma,
        oferta_id: oferta.id,
        curso: oferta.curso,
        modalidade: oferta.modalidade,
        unidade: oferta.unidade,
        turno: oferta.turno,
        processo_sei: oferta.processoSei,
        faz_prova: fazProva,
        dia_prova: fazProva ? dia : null,
        hora_prova: fazProva ? hora : null,
        instituicao_origem: null,
        curso_origem: null,
        periodo_atual: null,
        atendimento_especial: null,
        origem: `Importada do SEI${inscricaoSei ? ` (inscrição SEI nº ${inscricaoSei})` : ''}`,
      },
    };
  });

  // Mesmo CPF em mais de uma linha (inscrito em 2 cursos no SEI)
  const grupos = new Map<string, LinhaImportacao[]>();
  for (const l of linhas) {
    if (l.dados) {
      grupos.set(l.dados.cpf, [...(grupos.get(l.dados.cpf) ?? []), l]);
    }
  }
  for (const grupo of grupos.values()) {
    if (grupo.length < 2) {
      continue;
    }
    const cursos = grupo.map((l) => l.curso).join(' e ');
    const criterio = opcoes.duplicados === 'menor-inscricao' ? 'menor' : 'maior';
    const fica =
      opcoes.duplicados === 'pular'
        ? null
        : grupo.reduce((a, b) =>
            criterio === 'maior'
              ? Number(b.inscricaoSei) > Number(a.inscricaoSei)
                ? b
                : a
              : Number(b.inscricaoSei) < Number(a.inscricaoSei)
                ? b
                : a,
          );
    for (const l of grupo) {
      if (l === fica) {
        l.motivo = [l.motivo, `Inscrito em 2 cursos no SEI (${cursos}): fica este, de ${criterio} nº SEI`]
          .filter(Boolean)
          .join(' · ');
      } else {
        l.status = 'descartada';
        l.dados = null;
        l.motivo = fica
          ? `Descartada: também inscrito em ${fica.curso} (nº SEI ${fica.inscricaoSei}), que fica`
          : `Inscrito em 2 cursos no SEI (${cursos}): decidir qual e importar só essa linha`;
      }
    }
  }
  return linhas;
};

export const resumir = (linhas: LinhaImportacao[]) => ({
  total: linhas.length,
  criar: linhas.filter((l) => l.status === 'criar').length,
  semNascimento: linhas.filter((l) => l.status === 'criar' && !l.dados?.nascimento).length,
  existe: linhas.filter((l) => l.status === 'existe').length,
  problema: linhas.filter((l) => l.status === 'problema').length,
  descartada: linhas.filter((l) => l.status === 'descartada').length,
});

// ---------- Importação ----------
// Só cria as inscrições (sem e-mail nem RD: esses vão pela fila). Para antes do limite da função (maxDuration = 300 s):
// o que sobrar entra no próximo clique (as já criadas aparecem como "já existe").
const tempoMaximo = 270_000;

export type ResultadoImportacao = {
  numeros: number[]; // nº de inscrição criados
  criadas: number;
  jaExistiam: number;
  falhas: number;
  restantes: number;
};

export const importar = async (linhas: LinhaImportacao[]): Promise<ResultadoImportacao> => {
  const fila = linhas.filter((l) => l.status === 'criar' && l.dados);
  const inicio = Date.now();
  const r: ResultadoImportacao = { numeros: [], criadas: 0, jaExistiam: 0, falhas: 0, restantes: 0 };
  let processadas = 0;
  for (const l of fila) {
    if (Date.now() - inicio > tempoMaximo) {
      break;
    }
    processadas++;
    try {
      r.numeros.push((await criarInscricao(l.dados!)).numero);
      r.criadas++;
    } catch (e) {
      if (e instanceof CpfJaInscrito) {
        r.jaExistiam++;
      } else {
        // Sem dados pessoais no log
        console.error('[vestibular importar] falha na linha', l.linha, (e as Error).message?.replace(/\d{11}/g, '***'));
        r.falhas++;
      }
    }
  }
  r.restantes = fila.length - processadas;
  return r;
};

// ---------- Registro (vestibular_config, chave "log-importacoes") ----------
// Quem importou, quando, opções e os nº de inscrição criados (sem nome, CPF ou contato)
export type RegistroImportacao = { por: string; em: string; opcoes: OpcoesImportacao } & ResultadoImportacao;

export const registrarImportacao = async (registro: RegistroImportacao) => {
  const atual = (await lerConfig<RegistroImportacao[]>('log-importacoes')) ?? [];
  await gravarConfig('log-importacoes', [...atual, registro].slice(-200));
};

export const lerImportacoes = async () => (await lerConfig<RegistroImportacao[]>('log-importacoes')) ?? [];

// Ofertas da inscrição do Vestibular Conquista Vidal 2027.1, iguais às do SEI (processos 148 a 152, consultados em
// 23/10/2026). O código do processo seletivo vai junto com a inscrição para a secretaria lançar no SEI sem dúvida.
import { FormaId, vestibular } from './vestibular';

export type Oferta = {
  id: string;
  curso: string;
  modalidade: 'Presencial' | 'EAD' | 'Semipresencial';
  unidade: 'Limoeiro do Norte' | 'Fortaleza (Tauape)';
  turno: string;
  processoSei: number;
  // Formas de ingresso aceitas pelo processo seletivo da oferta no SEI
  formas: FormaId[];
  // false: fora desta edição (some do formulário e da LP e o servidor recusa inscrição; fica para o histórico)
  ativo?: boolean;
};

const todas: FormaId[] = ['vestibular', 'enem', 'segunda-graduacao', 'transferencia'];
const semTransferencia: FormaId[] = ['vestibular', 'enem', 'segunda-graduacao'];

const presencial = (id: string, curso: string, turno = 'Noite'): Oferta => ({
  id,
  curso,
  modalidade: 'Presencial',
  unidade: 'Limoeiro do Norte',
  turno,
  processoSei: 148,
  formas: todas,
});

export const ofertas: Oferta[] = [
  presencial('direito', 'Direito'),
  presencial('psicologia', 'Psicologia'),
  presencial('enfermagem', 'Enfermagem'),
  presencial('fisioterapia', 'Fisioterapia'),
  presencial('biomedicina', 'Biomedicina'),
  presencial('odontologia', 'Odontologia', 'Tarde'),
  presencial('terapia-ocupacional', 'Terapia Ocupacional'),
  presencial('administracao', 'Administração'),
  {
    id: 'administracao-ead',
    curso: 'Administração',
    modalidade: 'EAD',
    unidade: 'Limoeiro do Norte',
    turno: 'On-line',
    processoSei: 149,
    formas: todas,
  },
  {
    id: 'pedagogia-semi',
    curso: 'Pedagogia',
    modalidade: 'Semipresencial',
    unidade: 'Limoeiro do Norte',
    turno: 'Noite',
    processoSei: 149,
    formas: todas,
  },
  {
    id: 'recursos-humanos-ead',
    curso: 'Gestão de Recursos Humanos',
    modalidade: 'EAD',
    unidade: 'Limoeiro do Norte',
    turno: 'On-line',
    processoSei: 150,
    formas: semTransferencia,
  },
  {
    id: 'administracao-ead-fortaleza',
    curso: 'Administração',
    modalidade: 'EAD',
    unidade: 'Fortaleza (Tauape)',
    turno: 'On-line',
    processoSei: 151,
    formas: semTransferencia,
  },
  {
    id: 'pedagogia-semi-fortaleza',
    curso: 'Pedagogia',
    modalidade: 'Semipresencial',
    unidade: 'Fortaleza (Tauape)',
    turno: 'Noite',
    processoSei: 151,
    formas: semTransferencia,
  },
  {
    id: 'recursos-humanos-ead-fortaleza',
    curso: 'Gestão de Recursos Humanos',
    modalidade: 'EAD',
    unidade: 'Fortaleza (Tauape)',
    turno: 'On-line',
    processoSei: 152,
    formas: semTransferencia,
  },
];

// Ofertas abertas nesta edição (formulário, servidor e contagem de bolsas)
export const ofertasAtivas = ofertas.filter((o) => o.ativo !== false);

export const nomeOferta = (o: Oferta) => `${o.curso} · ${o.modalidade} · ${o.unidade}`;

// Dias e horários de início da prova cadastrados no SEI (2 horas cada, a última termina às 20h).
// A prova termina 2 horas depois do horário escolhido, mesmo que o candidato comece atrasado.
export const diasProva = [
  { id: '2026-11-21', rotulo: 'Sábado, 21 de novembro' },
  { id: '2026-11-22', rotulo: 'Domingo, 22 de novembro' },
];
// Dia do lembrete da prova (e-mail + WhatsApp): um envio só para os dois dias de prova (cron às 10h de Brasília)
export const diaLembrete = { id: '2026-11-19', rotulo: '19/11' };
export const horariosProva = ['08:00', '10:00', '12:00', '14:00', '16:00', '18:00'];

// O que cada forma de ingresso precisa mandar depois da inscrição
export const documentoPorForma: Partial<Record<FormaId, string>> = {
  enem: 'o boletim de desempenho do Enem',
  'segunda-graduacao': 'o diploma e o histórico da graduação',
  transferencia: 'a declaração de vínculo ou o histórico com status de cursando',
};

// Documentos que cada forma de ingresso envia pelo site (Minha inscrição), item a item
export type ItemDocumento = { id: string; rotulo: string; dica: string };
export const itensDocumento: Partial<Record<FormaId, ItemDocumento[]>> = {
  enem: [
    {
      id: 'boletim',
      rotulo: 'Boletim de desempenho do Enem',
      dica: 'O boletim com as suas notas e o ano da prova (baixe na Página do Participante do Inep).',
    },
  ],
  'segunda-graduacao': [
    { id: 'diploma', rotulo: 'Diploma da graduação', dica: 'Frente e verso (pode mandar duas fotos).' },
    { id: 'historico', rotulo: 'Histórico da graduação', dica: 'Todas as páginas.' },
  ],
  transferencia: [
    {
      id: 'vinculo',
      rotulo: 'Declaração de vínculo ou de matrícula',
      dica: 'Emitida pela sua faculdade atual, mostrando que você está matriculado.',
    },
    { id: 'historico', rotulo: 'Histórico com status de cursando', dica: 'Todas as páginas.' },
  ],
};

// Arquivos aceitos: PDF e fotos (HEIC é o formato padrão das fotos do iPhone)
export const documentoTamanhoMaximo = 10 * 1024 * 1024;
export const documentoTipos = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];
export const documentoArquivosPorItem = 5;

// recusado: a equipe pediu outro documento; reprovado: notas do Enem abaixo do mínimo
export type StatusDocumento = 'pendente' | 'enviado' | 'aprovado' | 'recusado' | 'reprovado';

// Endereço da área do candidato, por extenso, para o comprovante, o WhatsApp e a agenda
export const rotaAreaCandidato = '/vestibular/minha-inscricao';
export const linkAreaCandidato = `${vestibular.site}${rotaAreaCandidato}`;
export const linkAreaCandidatoCurto = linkAreaCandidato.replace(/^https?:\/\//, '');

// O candidato entra 15 minutos antes do horário para liberar a prova: "10:00" → "9h45"
export const minutosAntes = 15;
export const horaDeEntrar = (hora: string) => {
  const [h, m] = hora.split(':').map(Number);
  const total = h * 60 + m - minutosAntes;
  const hh = Math.floor(total / 60);
  const mm = total % 60;
  return mm ? `${hh}h${String(mm).padStart(2, '0')}` : `${hh}h`;
};

// "18:00" → "20h": fim da janela de quem escolheu esse horário
// Todos os horários são de Brasília (Limoeiro do Norte/CE, UTC-3)
export const fusoHorario = 'horário de Brasília';

export const horaFim = (hora: string) => `${Number(hora.slice(0, 2)) + 2}h`;

export const avisoFim = (hora: string) =>
  `A prova termina às ${horaFim(hora)}, mesmo que você comece depois das ${hora.slice(0, 5).replace(':00', 'h')}.`;

export const avisoEntrada = (hora: string) =>
  `No dia da prova, entre em ${linkAreaCandidatoCurto} com seu CPF e código pelo menos ${minutosAntes} minutos antes do seu horário (às ${horaDeEntrar(hora)} para a prova das ${hora.replace(':00', 'h')}, ${fusoHorario}) para liberar a prova.`;

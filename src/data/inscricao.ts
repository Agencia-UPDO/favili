// Ofertas da inscrição do Vestibular Conquista Vidal 2027.1, iguais às do SEI (processos 148 a 152, consultados em
// 23/10/2026). O código do processo seletivo vai junto com a inscrição para a secretaria lançar no SEI sem dúvida.
import { FormaId } from './vestibular';

export type Oferta = {
  id: string;
  curso: string;
  modalidade: 'Presencial' | 'EAD' | 'Semipresencial';
  unidade: 'Limoeiro do Norte' | 'Fortaleza (Tauape)';
  turno: string;
  processoSei: number;
  // Formas de ingresso aceitas pelo processo seletivo da oferta no SEI
  formas: FormaId[];
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

export const nomeOferta = (o: Oferta) => `${o.curso} · ${o.modalidade} · ${o.unidade}`;

// Dias e horários de início da prova cadastrados no SEI (2 horas cada, a última termina às 20h)
export const diasProva = [
  { id: '2026-11-21', rotulo: 'Sábado, 21 de novembro' },
  { id: '2026-11-22', rotulo: 'Domingo, 22 de novembro' },
];
export const horariosProva = ['08:00', '10:00', '12:00', '14:00', '16:00', '18:00'];

// O que cada forma de ingresso precisa mandar depois da inscrição
export const documentoPorForma: Partial<Record<FormaId, string>> = {
  enem: 'o boletim de desempenho do Enem',
  'segunda-graduacao': 'o diploma e o histórico da graduação',
  transferencia: 'a declaração de vínculo ou o histórico com status de cursando',
};

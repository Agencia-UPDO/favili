// Conteúdo da LP do Vestibular Conquista Vidal 2027.1, a partir do regulamento
// (REGULAMENTO DO VESTIBULAR CONQUISTA VIDAL 2027.1.pdf) e da tabela da campanha
// (campanha Graduação 2027.1 - valores 22.10.26.docx).

export const vestibular = {
  nome: 'Vestibular Conquista Vidal 2027.1',
  slogan: 'Sua conquista começa aqui.',
  // Fim das inscrições (Art. 3º): 20/11/2026 até as 18h, horário de Brasília
  fimInscricoes: '2026-11-20T18:00:00-03:00',
  inscricoes: '14/10 a 20/11/2026',
  dias: ['21 de novembro', '22 de novembro'],
  diasCurto: '21 ou 22 de novembro',
  // 2 horas de prova a partir do horário escolhido; quem começa atrasado perde o atraso (Arts. 9º e 10)
  duracaoHoras: 2,
  resultado: '24 de novembro',
  matricula: '24/11 a 04/12/2026',
  taxaMatricula: 'R$ 150,00',
  // Desconto garantido para todos os ingressantes 2027.1 (alguns cursos têm 50%), com ou sem vestibular
  descontoGarantido: '40%',
  regulamento: '/vestibular/regulamento-vestibular-conquista-vidal-2027-1.pdf',
  // Inscrição própria do vestibular: destino de todos os botões de inscrição
  // Endereço público do site (usado por extenso no comprovante, no WhatsApp e na agenda)
  site: 'https://materiais.favili.com.br',
  inscricao: '/vestibular/inscricao',
  // Sistema acadêmico da faculdade (SEI), onde os aprovados completam o cadastro e fazem a matrícula
  sei: 'https://sei.favili.edu.br/processoSeletivo',
};

export const instituicao = {
  nome: 'Faculdade Vidal de Limoeiro – FAVILI',
  mec: 'Recredenciada pela Portaria do MEC nº 115, de 08 de fevereiro de 2024',
  endereco: 'Rua Cel. Antônio Joaquim, 1759 – Centro – Limoeiro do Norte/CE',
  telefone: '(88) 3423-6090',
  telefoneLink: 'tel:+558834236090',
  // WhatsApp da secretaria, só números com DDI e DDD (ex.: 5588999999999). Vazio: o site não mostra o atalho
  whatsapp: '558834236090',
  site: 'favili.com.br',
  instagram: 'https://www.instagram.com/faculdadevidal/',
};

// Passo a passo do vestibular, com as datas do cronograma oficial
export const cronograma = [
  { etapa: 'Inscreva-se grátis', data: 'Até 20/11', extra: 'Até as 18h. Escolha curso, modalidade, unidade e turno.' },
  {
    etapa: 'Escolha o dia e o horário',
    data: '21 ou 22/11',
    extra: 'Escolha o dia e o horário de início: 8h, 10h, 12h, 14h, 16h ou 18h.',
  },
  {
    etapa: 'Receba seu acesso por e-mail',
    data: '1 dia antes',
    extra: 'Na véspera da prova, enviamos o link com o seu login e senha. Confira também o spam.',
  },
  {
    etapa: 'Faça a prova on-line',
    data: 'Até 2 horas',
    extra: 'Entre com seu login e senha e responda as 20 questões.',
  },
  { etapa: 'Confira o resultado', data: '24/11', extra: 'Aqui no site, pelo seu número de inscrição.' },
  {
    etapa: 'Matricule-se',
    data: '24/11 a 04/12',
    extra: 'Contemplados garantem a bolsa com a matrícula de R$ 150,00.',
  },
];

export const prova = {
  questoes: 20,
  areas: [
    { nome: 'Linguagens e Códigos', questoes: 10 },
    { nome: 'Matemática', questoes: 10 },
  ],
  valorQuestao: '0,5 ponto',
  notaMaxima: 10,
};

// ---------- Formas de ingresso ----------
// Só o vestibular tem regulamento. Enem, segunda graduação e transferência seguem a campanha 2027.1
// (desconto para "Novatos/Graduados/Transferidos"); os passos e documentos específicos dessas
// entradas são a prática comum e precisam ser confirmados pela secretaria da Faculdade Vidal.
export type FormaId = 'vestibular' | 'enem' | 'segunda-graduacao' | 'transferencia';

export type Forma = {
  id: FormaId;
  rotulo: string;
  titulo: string;
  chamada: string;
  paraQuem: string;
  destaque: string;
  destaqueDetalhe: string;
  passos: { titulo: string; texto: string }[];
  documentos: string[];
  cta: string;
};

export const documentosBase = [
  'Documento oficial de identidade e CPF',
  'Comprovante de residência',
  'Certidão de nascimento ou casamento',
  'Título de eleitor e quitação eleitoral, quando aplicável',
  'Certificado de reservista, quando aplicável',
];

export const formas: Forma[] = [
  {
    id: 'vestibular',
    rotulo: 'Vestibular',
    titulo: 'Vestibular on-line com bolsa',
    chamada: 'Faça a prova de casa e concorra a bolsas de até 100%.',
    paraQuem:
      'Para quem concluiu o ensino médio e quer ir além dos 40% garantidos: a prova de 21 ou 22 de novembro vale bolsa de até 100%.',
    destaque: 'Bolsas de até 100%',
    destaqueDetalhe: '40% garantido + bolsas de 50% a 100% pela classificação',
    passos: [
      {
        titulo: 'Inscreva-se grátis',
        texto: 'Preencha seus dados e escolha curso, modalidade, unidade e turno. Inscrições até 20/11, às 18h.',
      },
      {
        titulo: 'Escolha o dia e o horário',
        texto: 'Faça a prova em 21 ou 22 de novembro, no horário que você escolher: 8h, 10h, 12h, 14h, 16h ou 18h.',
      },
      {
        titulo: 'Receba seu acesso por e-mail',
        texto:
          'Um dia antes da prova, você recebe o link com o seu login e senha. Fique de olho também na caixa de spam.',
      },
      {
        titulo: 'Faça a prova on-line',
        texto: '20 questões objetivas: 10 de Linguagens e Códigos e 10 de Matemática. Você tem até 2 horas.',
      },
      {
        titulo: 'Confira o resultado',
        texto: 'Sai em 24 de novembro, aqui no site. Consulte pelo seu número de inscrição.',
      },
      {
        titulo: 'Matricule-se e garanta a bolsa',
        texto: 'De 24/11 a 04/12, com os documentos e o pagamento de R$ 150,00 (bolsa de 100% é isenta).',
      },
    ],
    documentos: ['Histórico escolar do ensino médio', 'Certificado de conclusão do ensino médio', ...documentosBase],
    cta: 'Quero fazer o vestibular',
  },
  {
    id: 'enem',
    rotulo: 'Nota do Enem',
    titulo: 'Entre com a nota do Enem',
    chamada: 'Já fez o Enem? Use seu resultado e entre sem fazer prova.',
    paraQuem: 'Para quem fez o Enem e prefere usar a nota em vez de fazer o vestibular.',
    destaque: '40% sem prova',
    destaqueDetalhe: 'de desconto garantido nas mensalidades',
    passos: [
      { titulo: 'Inscreva-se', texto: 'Preencha seus dados, escolha o curso e marque que vai entrar pelo Enem.' },
      {
        titulo: 'Envie seu boletim',
        texto:
          'Mande o boletim de desempenho do Enem. Nossa equipe confirma pelo WhatsApp se ele vale para o ingresso.',
      },
      { titulo: 'Receba a aprovação', texto: 'Com o boletim analisado, você recebe a confirmação da sua vaga.' },
      {
        titulo: 'Faça a matrícula',
        texto: 'Matrícula de R$ 150,00. Matriculando-se até 15/01/2027, a 1ª mensalidade também sai por R$ 150,00.',
      },
    ],
    documentos: [
      'Boletim de desempenho do Enem',
      'Histórico escolar do ensino médio',
      'Certificado de conclusão do ensino médio',
      ...documentosBase,
    ],
    cta: 'Quero entrar pelo Enem',
  },
  {
    id: 'segunda-graduacao',
    rotulo: 'Segunda graduação',
    titulo: 'Sua segunda graduação',
    chamada: 'Já tem diploma? Comece um novo curso sem vestibular.',
    paraQuem: 'Para quem já concluiu uma graduação e quer uma nova formação ou mudar de área.',
    destaque: '40% sem vestibular',
    destaqueDetalhe: 'de desconto garantido nas mensalidades',
    passos: [
      { titulo: 'Inscreva-se', texto: 'Preencha seus dados, escolha o novo curso e conte qual graduação você já tem.' },
      {
        titulo: 'Envie o diploma',
        texto: 'Mande o diploma e o histórico da sua graduação. Eles substituem o vestibular.',
      },
      {
        titulo: 'Análise das disciplinas',
        texto: 'A coordenação avalia se disciplinas que você já cursou podem ser aproveitadas no novo curso.',
      },
      {
        titulo: 'Faça a matrícula',
        texto: 'Matrícula de R$ 150,00. Matriculando-se até 15/01/2027, a 1ª mensalidade também sai por R$ 150,00.',
      },
    ],
    documentos: ['Diploma de graduação', 'Histórico da graduação', ...documentosBase],
    cta: 'Quero minha segunda graduação',
  },
  {
    id: 'transferencia',
    rotulo: 'Transferência',
    titulo: 'Transfira seu curso para a Vidal',
    chamada: 'Estuda em outra faculdade? Continue seu curso aqui.',
    paraQuem: 'Para quem está cursando uma graduação em outra instituição e quer continuar na Vidal.',
    destaque: '40% sem vestibular',
    destaqueDetalhe: 'de desconto garantido nas mensalidades',
    passos: [
      { titulo: 'Inscreva-se', texto: 'Preencha seus dados, escolha o curso e conte de qual faculdade você vem.' },
      {
        titulo: 'Envie seu histórico',
        texto: 'Mande o histórico acadêmico e a declaração de vínculo da sua faculdade atual.',
      },
      {
        titulo: 'Aproveitamento',
        texto: 'A coordenação analisa as disciplinas já cursadas e indica em que período você entra.',
      },
      {
        titulo: 'Faça a matrícula',
        texto: 'Matrícula de R$ 150,00. Matriculando-se até 15/01/2027, a 1ª mensalidade também sai por R$ 150,00.',
      },
    ],
    documentos: [
      'Histórico acadêmico da faculdade atual',
      'Declaração de vínculo com a faculdade atual',
      'Ementas das disciplinas cursadas',
      ...documentosBase,
    ],
    cta: 'Quero me transferir',
  },
];

// ---------- Bolsas do vestibular (Arts. 22 a 24 e item 8 do regulamento) ----------
export const bolsasResumo = [
  { percentual: '100%', quantidade: 1, texto: 'para o 1º lugar da classificação geral' },
  { percentual: '70%', quantidade: 30, texto: 'nos cursos EAD e semipresenciais' },
  { percentual: '65%', quantidade: 10, texto: 'nos cursos presenciais' },
  { percentual: '60%', quantidade: 46, texto: 'presenciais, EAD e semipresenciais' },
  { percentual: '50%', quantidade: 14, texto: 'nos cursos presenciais' },
];

// Escada de descontos: todo mundo começa com 40%; o vestibular de 21 e 22/11 leva a mais
export const degraus = [
  {
    percentual: '40%',
    titulo: 'Garantido para os aprovados',
    texto:
      'Aprovado pelo Enem, segunda graduação, transferência ou no vestibular, mas ficou fora das bolsas? Você já tem 40% de desconto nas mensalidades.',
  },
  {
    percentual: '50% a 70%',
    titulo: 'Bolsa do vestibular',
    texto:
      'Faça a prova on-line em 21 ou 22 de novembro: os mais bem classificados em cada curso ganham 50%, 60%, 65% ou 70%.',
  },
  {
    percentual: '100%',
    titulo: '1º lugar geral',
    texto: 'Quem tirar a maior nota de todo o vestibular estuda de graça durante o curso.',
  },
];

// Regras que o candidato precisa conhecer antes de aceitar a bolsa (Arts. 32 a 40)
export const regrasBolsa = [
  'É pessoal e vale para o curso, modalidade, unidade e turno escolhidos na inscrição.',
  'Vale durante todo o período regular do curso, com renovação a cada semestre.',
  'Não acumula com outros descontos ou bolsas da Faculdade Vidal.',
  'Pode ser perdida em caso de trancamento, abandono, reprovação por faltas ou dependências acima do limite.',
  'Nas bolsas parciais, é preciso manter as mensalidades em dia.',
];

// ---------- Cursos (tabela da campanha 2027.1) ----------
export type Curso = {
  nome: string;
  modalidade: 'Presencial' | 'EAD' | 'Semipresencial';
  duracao: string;
  turno: string;
  desconto: string;
  bolsaVestibular: boolean;
  // false: fora desta edição (some da LP)
  ativo?: boolean;
};

export const cursos: Curso[] = [
  {
    nome: 'Direito',
    modalidade: 'Presencial',
    duracao: '5 anos',
    turno: 'Noite, 19h às 22h',
    desconto: '40%',
    bolsaVestibular: true,
  },
  {
    nome: 'Psicologia',
    modalidade: 'Presencial',
    duracao: '5 anos',
    turno: 'Noite, 19h às 22h',
    desconto: '40%',
    bolsaVestibular: true,
  },
  {
    nome: 'Enfermagem',
    modalidade: 'Presencial',
    duracao: '5 anos',
    turno: 'Noite, 19h às 22h',
    desconto: '40%',
    bolsaVestibular: true,
  },
  {
    nome: 'Fisioterapia',
    modalidade: 'Presencial',
    duracao: '5 anos',
    turno: 'Noite, 19h às 22h',
    desconto: '40%',
    bolsaVestibular: true,
  },
  {
    nome: 'Biomedicina',
    modalidade: 'Presencial',
    duracao: '5 anos',
    turno: 'Noite, 19h às 22h',
    desconto: '40%',
    bolsaVestibular: true,
  },
  {
    nome: 'Odontologia',
    modalidade: 'Presencial',
    duracao: '5 anos',
    turno: 'Tarde, 13h às 18h',
    desconto: '40%',
    bolsaVestibular: true,
  },
  {
    nome: 'Terapia Ocupacional',
    modalidade: 'Presencial',
    duracao: '4 anos',
    turno: 'Noite, 19h às 22h',
    desconto: '40%',
    bolsaVestibular: true,
  },
  {
    nome: 'Administração',
    modalidade: 'Presencial',
    duracao: '4 anos',
    turno: 'Noite, 19h às 22h',
    desconto: '50%',
    bolsaVestibular: true,
  },
  {
    nome: 'Administração',
    modalidade: 'EAD',
    duracao: '4 anos',
    turno: 'On-line, no seu ritmo',
    desconto: '50%',
    bolsaVestibular: true,
  },
  {
    nome: 'Recursos Humanos',
    ativo: false,
    modalidade: 'EAD',
    duracao: '4 anos',
    turno: 'On-line, no seu ritmo',
    desconto: '50%',
    bolsaVestibular: true,
  },
  {
    nome: 'Pedagogia',
    modalidade: 'Semipresencial',
    duracao: '4 anos',
    turno: '1 encontro presencial por semana',
    desconto: '50%',
    bolsaVestibular: true,
  },
  {
    nome: 'Marketing',
    ativo: false,
    modalidade: 'EAD',
    duracao: '4 anos',
    turno: 'On-line, no seu ritmo',
    desconto: '50%',
    bolsaVestibular: false,
  },
  {
    nome: 'Ciências Contábeis',
    ativo: false,
    modalidade: 'EAD',
    duracao: '4 anos',
    turno: 'On-line, no seu ritmo',
    desconto: '50%',
    bolsaVestibular: false,
  },
  {
    nome: 'Análise e Desenv. de Sistemas',
    ativo: false,
    modalidade: 'EAD',
    duracao: '4 anos',
    turno: 'On-line, no seu ritmo',
    desconto: '50%',
    bolsaVestibular: false,
  },
];

export const unidades = ['Limoeiro do Norte', 'Fortaleza (Tauape)'];

export const faq = [
  {
    pergunta: 'A inscrição no vestibular é paga?',
    resposta: 'Não. A inscrição e a prova do Vestibular Conquista Vidal 2027.1 são gratuitas.',
  },
  {
    pergunta: 'Onde e como eu faço a prova?',
    resposta:
      'A prova é 100% on-line. Um dia antes da prova, você recebe por e-mail o link com o seu login e senha. Você entra no dia e no horário que escolheu na inscrição (21 ou 22 de novembro; 8h, 10h, 12h, 14h, 16h ou 18h).',
  },
  {
    pergunta: 'Não recebi o e-mail com login e senha. O que eu faço?',
    resposta:
      'O e-mail chega um dia antes da prova. Confira a caixa de spam e as abas de promoções e, se não encontrar, fale com a Faculdade Vidal pelo (88) 3423-6090.',
  },
  {
    pergunta: 'Quanto tempo eu tenho para fazer a prova?',
    resposta:
      '2 horas, contadas a partir do horário que você escolheu. A prova termina 2 horas depois desse horário, mesmo que você comece atrasado: quem escolheu 18h e entra às 19h tem só até as 20h. Para usar as 2 horas inteiras, entre 15 minutos antes do seu horário.',
  },
  {
    pergunta: 'O que cai na prova?',
    resposta:
      'São 20 questões objetivas: 10 de Linguagens e Códigos e 10 de Matemática. Cada questão vale 0,5 ponto, somando até 10 pontos.',
  },
  {
    pergunta: 'Posso fazer a prova mais de uma vez?',
    resposta: 'Não. Cada candidato faz a prova uma única vez e não há segunda chamada, revisão ou recontagem.',
  },
  {
    pergunta: 'Como as bolsas são distribuídas?',
    resposta:
      'O 1º lugar geral ganha bolsa de 100%. As 80 bolsas parciais (50%, 60%, 65% e 70%) vão para os mais bem classificados em cada curso, modalidade e unidade, conforme a quantidade de bolsas de cada oferta.',
  },
  {
    pergunta: 'E se eu empatar com outro candidato?',
    resposta:
      'Desempata quem tiver mais pontos em Matemática; depois, o candidato mais velho; e, por fim, quem se inscreveu primeiro.',
  },
  {
    pergunta: 'Quando sai o resultado?',
    resposta: 'Em 24 de novembro, aqui no site. A consulta é feita pelo seu número de inscrição.',
  },
  {
    pergunta: 'Quanto pago na matrícula?',
    resposta:
      'Quem ganha bolsa parcial paga R$ 150,00 na matrícula (de 24/11 a 04/12). Quem ganha a bolsa de 100% é isento.',
  },
  {
    pergunta: 'Se eu não ganhar bolsa, fico sem desconto?',
    resposta:
      'Não. Todo mundo que entra na Vidal em 2027.1 tem 40% de desconto garantido nas mensalidades, mesmo sem fazer o vestibular de 21 ou 22 de novembro ou ficando fora das bolsas. O vestibular serve para conquistar um desconto maior, de 50% a 100%.',
  },
  {
    pergunta: 'Não posso fazer a prova em 21 ou 22 de novembro. E agora?',
    resposta:
      'Você ainda pode entrar pelo vestibular agendado ou pela nota do Enem, com os 40% de desconto garantidos. As bolsas de 50% a 100% são só para quem faz a prova em 21 ou 22 de novembro.',
  },
  {
    pergunta: 'A bolsa acumula com outros descontos?',
    resposta:
      'Não. A bolsa do vestibular substitui o desconto de 40% (vale a maior) e não acumula com outras bolsas, descontos ou benefícios da Faculdade Vidal.',
  },
  {
    pergunta: 'E se a turma do meu curso não fechar?',
    resposta:
      'A Faculdade Vidal pode remanejar sua bolsa para outro curso, modalidade ou turno com oferta disponível, mantendo o mesmo percentual.',
  },
  {
    pergunta: 'Já tenho diploma ou estudo em outra faculdade. Preciso fazer o vestibular?',
    resposta:
      'Não. Quem já é graduado entra pela segunda graduação e quem estuda em outra instituição entra por transferência, as duas com 40% de desconto garantido. Escolha sua forma de ingresso na hora da inscrição.',
  },
];

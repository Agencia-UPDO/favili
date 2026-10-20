// Conteúdo da LP da Feira de Negócios Empreend 2026, a partir do briefing da Faculdade Vidal
// (briefing\INFORMAÇÕES FEIRA DE NEGÓCIOS EMPREEND 2026.docx).

export const evento = {
  nome: 'Feira de Negócios Empreend 2026',
  edicao: '3ª edição',
  curso: 'Curso de Administração',
  data: '18 de novembro',
  diaSemana: 'quarta-feira',
  ano: '2026',
  horario: '19h30 às 21h30',
  local: 'Pátio da Faculdade Vidal',
  // Data/hora do início, para a contagem regressiva (horário de Brasília)
  inicio: '2026-11-18T19:30:00-03:00',
  mapa: 'https://www.google.com/maps/search/?api=1&query=Faculdade+Vidal',
  // 19h30–21h30 em Brasília = 22h30–00h30 UTC
  googleAgenda:
    'https://calendar.google.com/calendar/render?action=TEMPLATE&text=Empreend%202026%20%C2%B7%20Feira%20de%20Neg%C3%B3cios&dates=20261118T223000Z/20261119T003000Z&details=3%C2%AA%20edi%C3%A7%C3%A3o%20da%20Feira%20de%20Neg%C3%B3cios%20do%20curso%20de%20Administra%C3%A7%C3%A3o%20da%20Faculdade%20Vidal.%20M%C3%BAsica%20ao%20vivo%20com%20Carmen%20J%C3%BAlia.&location=P%C3%A1tio%20da%20Faculdade%20Vidal',
};

// Bloco de notas "Anote na agenda": o que não esquecer
export const lembretes = [
  'Conhecer as 9 empresas confirmadas',
  'Trocar contatos e fazer networking',
  'Curtir a música ao vivo com Carmen Júlia',
  'Chamar os amigos e a família',
];

export const sobre =
  'A Feira de Negócios do Empreend 2026 chega à sua 3ª edição, reunindo empreendedores em um ambiente de vendas, divulgação e troca de experiências. Com o apoio dos alunos do curso de Administração da Faculdade Vidal, o evento promove o empreendedorismo, a inovação, o networking e a conexão entre a comunidade acadêmica e o mercado local.';

export const pilares = [
  {
    titulo: 'Empreendedorismo',
    texto: 'Incentivo a quem empreende e mais visibilidade para empresas e pequenos negócios da região.',
  },
  {
    titulo: 'Networking',
    texto: 'Um espaço para comercializar produtos, divulgar marcas, trocar experiências e criar novas conexões.',
  },
  {
    titulo: 'Prática em sala',
    texto:
      'Os alunos de Administração vivenciam na prática gestão, marketing, organização e comunicação empresarial.',
  },
  {
    titulo: 'Comunidade',
    texto: 'Integração entre a Faculdade Vidal, o mercado local e a comunidade, com toda a família.',
  },
];

export const publico = ['Comunidade acadêmica', 'Empreendedores e empresários', 'Consumidores', 'Famílias'];

export const empresas = [
  { nome: 'La Cheffa Pizzaria', logo: '/images/empreend/empresas/la-cheffa.png' },
  { nome: 'RS Store', logo: '/images/empreend/empresas/rs-store.png' },
  { nome: 'Opção Wine', logo: '/images/empreend/empresas/opcao-wine.png' },
  { nome: 'Lasanharia Casa de Lasanha', logo: '/images/empreend/empresas/lasanharia.png' },
  { nome: 'Ótica Silva', logo: '/images/empreend/empresas/otica-silva.png' },
  { nome: 'Doce Maria Confeitaria', logo: '/images/empreend/empresas/doce-maria.png' },
  { nome: 'Menu Fit', logo: '/images/empreend/empresas/menu-fit.png' },
  { nome: 'FP Laticínios', logo: '/images/empreend/empresas/fp-laticinios.png' },
  { nome: 'Fábrica de Cookies', logo: '/images/empreend/empresas/fabrica-de-cookies.png' },
];

export const atracao = {
  nome: 'Carmen Júlia',
  texto: 'A programação do Empreend 2026 contará com música ao vivo e a participação especial de Carmen Júlia.',
};

export const perfis = ['Aluno(a) da Vidal', 'Empreendedor(a)', 'Comunidade'];

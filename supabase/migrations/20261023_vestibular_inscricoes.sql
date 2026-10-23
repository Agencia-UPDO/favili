-- Inscrições do Vestibular Conquista Vidal 2027.1
create sequence if not exists vestibular_inscricao_numero start 2027100001;

create table if not exists vestibular_inscricoes (
  numero bigint primary key default nextval('vestibular_inscricao_numero'),
  codigo text not null unique check (codigo ~ '^[A-Z2-9]{6}$'),
  criado_em timestamptz not null default now(),
  cpf text not null unique check (cpf ~ '^\d{11}$'),
  nome text not null,
  email text not null,
  celular text not null,
  nascimento date not null,
  forma text not null check (forma in ('vestibular', 'enem', 'segunda-graduacao', 'transferencia')),
  oferta_id text not null,
  curso text not null,
  modalidade text not null,
  unidade text not null,
  turno text not null,
  processo_sei integer not null,
  faz_prova boolean not null default false,
  dia_prova date,
  hora_prova time,
  instituicao_origem text,
  curso_origem text,
  periodo_atual text,
  atendimento_especial text,
  origem text,
  check (not faz_prova or (dia_prova is not null and hora_prova is not null))
);

-- Só o servidor (chave service_role) lê e grava; nada fica exposto para a chave pública
alter table vestibular_inscricoes enable row level security;

-- Prova on-line: início e fim calculados pelo servidor, respostas salvas a cada clique, nota na entrega
alter table vestibular_inscricoes
  add column if not exists prova_inicio timestamptz,
  add column if not exists prova_fim timestamptz,
  add column if not exists prova_entregue_em timestamptz,
  add column if not exists questoes_sorteadas jsonb,
  add column if not exists respostas jsonb not null default '{}'::jsonb,
  add column if not exists acertos integer,
  add column if not exists nota numeric(4, 1),
  add column if not exists nota_matematica numeric(4, 1);

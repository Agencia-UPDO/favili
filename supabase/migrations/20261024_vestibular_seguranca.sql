-- Segurança do vestibular. Pode rodar mais de uma vez.

-- 1) Contador de tentativas erradas (login do candidato e senha do painel). A chave é um hash: não guarda CPF.
create table if not exists vestibular_tentativas (
  id bigint generated always as identity primary key,
  chave text not null,
  em timestamptz not null default now()
);
create index if not exists vestibular_tentativas_chave_em on vestibular_tentativas (chave, em);

-- 2) Nenhum acesso pela chave pública (anon) nem por usuários logados do Supabase: só o servidor do site, com a
--    chave service_role, lê e grava. O RLS ligado sem nenhuma regra já bloqueia; o revoke fecha também a listagem.
alter table vestibular_inscricoes enable row level security;
alter table vestibular_config enable row level security;
alter table vestibular_tentativas enable row level security;

revoke all on table vestibular_inscricoes, vestibular_config, vestibular_tentativas from anon, authenticated;
revoke all on sequence vestibular_inscricao_numero from anon, authenticated;

-- 3) Faxina: apaga tentativas com mais de 1 dia (rodar de vez em quando, opcional)
delete from vestibular_tentativas where em < now() - interval '1 day';

-- Documentos das formas de ingresso sem prova obrigatória (Enem, segunda graduação e transferência) e notas do Enem.
-- Pode rodar mais de uma vez: só acrescenta o que falta.

alter table vestibular_inscricoes
  -- lista de arquivos enviados: [{ id, item, nome, caminho, tipo, tamanho, enviadoEm }]
  add column if not exists documentos jsonb not null default '[]'::jsonb,
  -- pendente | enviado | aprovado | recusado (pediu outro documento) | reprovado (notas do Enem abaixo do mínimo)
  add column if not exists documento_status text,
  add column if not exists documento_obs text,
  add column if not exists documento_revisado_em timestamptz,
  add column if not exists documento_revisado_por text,
  -- Enem: ano, notas por área ({ linguagens, humanas, natureza, matematica, redacao }) e média confirmada pela equipe
  add column if not exists enem_ano integer,
  add column if not exists enem_notas jsonb,
  add column if not exists enem_media numeric(6, 2);

alter table vestibular_inscricoes drop constraint if exists vestibular_inscricoes_documento_status_check;
alter table vestibular_inscricoes add constraint vestibular_inscricoes_documento_status_check
  check (documento_status in ('pendente', 'enviado', 'aprovado', 'recusado', 'reprovado'));

update vestibular_inscricoes
  set documento_status = 'pendente'
  where forma in ('enem', 'segunda-graduacao', 'transferencia') and documento_status is null;

-- Pasta PRIVADA dos arquivos (sem acesso público; só o servidor do site, com a chave service_role)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'vestibular-documentos',
  'vestibular-documentos',
  false,
  10485760,
  array['application/pdf', 'image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']
)
on conflict (id) do nothing;

-- E-mail do resultado (enviado pelo painel depois de publicar, só para aprovados): quando foi enviado.
alter table vestibular_inscricoes add column if not exists resultado_email_em timestamptz;

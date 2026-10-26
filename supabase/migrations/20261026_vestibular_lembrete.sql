-- Lembrete da véspera da prova (cron /api/vestibular/lembretes): dia de prova para o qual o lembrete já saiu.
-- Se o candidato trocar de dia, o valor deixa de bater com dia_prova e o lembrete do dia novo sai.
alter table vestibular_inscricoes add column if not exists lembrete_enviado_para date;

-- Importar do SEI: os relatórios do SEI não trazem a data de nascimento. A inscrição importada entra sem ela e o
-- candidato informa em Minha inscrição antes de começar a prova (a data é critério de desempate).
-- Pode rodar mais de uma vez.
alter table vestibular_inscricoes alter column nascimento drop not null;

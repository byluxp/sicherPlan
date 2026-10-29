-- Data de admissão opcional: a planilha de controle do SESMT importada não traz a admissão.
ALTER TABLE colaborador ALTER COLUMN data_admissao DROP NOT NULL;

-- Dados lidos do PDF do ASO: data do exame clínico, exames complementares, resultado e aptidão para altura.
-- data_emissao passa a ser a data de liberação do ASO; o demissional não tem vencimento.

ALTER TABLE aso ADD COLUMN IF NOT EXISTS data_exame date;
ALTER TABLE aso ADD COLUMN IF NOT EXISTS exames jsonb NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE aso ADD COLUMN IF NOT EXISTS resultado varchar;
ALTER TABLE aso ADD COLUMN IF NOT EXISTS apto_trabalho_altura boolean;
ALTER TABLE aso ALTER COLUMN data_vencimento DROP NOT NULL;

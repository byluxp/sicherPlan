-- Aptidão do colaborador para trabalho em altura (NR-35).
-- NULL = não avaliado; false (inapto) impede a emissão do certificado de NR-35.

ALTER TABLE colaborador ADD COLUMN IF NOT EXISTS apto_trabalho_altura boolean;

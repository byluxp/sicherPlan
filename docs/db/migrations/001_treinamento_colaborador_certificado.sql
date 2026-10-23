-- Vincula cada treinamento ao certificado emitido (colaborador_certificado).
-- Idempotente: pode ser executado mais de uma vez.
-- Executar: docker exec -i sicherplan-postgres psql -U sicherplan -d sicherplan < docs/db/migrations/001_treinamento_colaborador_certificado.sql

BEGIN;

ALTER TABLE treinamento
    ADD COLUMN IF NOT EXISTS colaborador_certificado_id integer;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'treinamento_colaborador_certificado_id_fkey') THEN
        ALTER TABLE treinamento
            ADD CONSTRAINT treinamento_colaborador_certificado_id_fkey
            FOREIGN KEY (colaborador_certificado_id) REFERENCES colaborador_certificado (id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'treinamento_colaborador_certificado_id_key') THEN
        ALTER TABLE treinamento
            ADD CONSTRAINT treinamento_colaborador_certificado_id_key UNIQUE (colaborador_certificado_id);
    END IF;
END $$;

-- Vincula treinamentos existentes ao certificado de mesmo colaborador, NR e data
UPDATE treinamento t
SET colaborador_certificado_id = cc.id
FROM colaborador_certificado cc
WHERE t.colaborador_certificado_id IS NULL
  AND cc.colaborador_id = t.colaborador_id
  AND cc.certificado_id = t.certificado_id
  AND cc.data_conclusao = t.data_emissao
  AND NOT EXISTS (SELECT 1 FROM treinamento o WHERE o.colaborador_certificado_id = cc.id);

-- Certificados já emitidos sem treinamento registrado ganham o seu
INSERT INTO treinamento (colaborador_id, certificado_id, colaborador_certificado_id, data_emissao)
SELECT cc.colaborador_id, cc.certificado_id, cc.id, cc.data_conclusao
FROM colaborador_certificado cc
WHERE NOT EXISTS (SELECT 1 FROM treinamento t WHERE t.colaborador_certificado_id = cc.id);

COMMIT;

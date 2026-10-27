-- Treinamentos obrigatórios por função (certificados do catálogo exigidos de quem ocupa a função).

CREATE TABLE IF NOT EXISTS funcao_treinamento_obrigatorio (
    funcao_id integer NOT NULL REFERENCES funcao (id),
    certificado_id integer NOT NULL REFERENCES certificado (id),
    PRIMARY KEY (funcao_id, certificado_id)
);

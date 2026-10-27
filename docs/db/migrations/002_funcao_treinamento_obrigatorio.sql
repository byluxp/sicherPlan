-- Treinamentos obrigatórios por função (certificados do catálogo exigidos de quem ocupa a função).
-- O backend cria esta tabela automaticamente ao iniciar (Base.metadata.create_all);
-- o script fica para referência e para bancos criados fora da aplicação.
-- Executar: docker exec -i sicherplan-postgres psql -U sicherplan -d sicherplan < docs/db/migrations/002_funcao_treinamento_obrigatorio.sql

CREATE TABLE IF NOT EXISTS funcao_treinamento_obrigatorio (
    funcao_id integer NOT NULL REFERENCES funcao (id),
    certificado_id integer NOT NULL REFERENCES certificado (id),
    PRIMARY KEY (funcao_id, certificado_id)
);

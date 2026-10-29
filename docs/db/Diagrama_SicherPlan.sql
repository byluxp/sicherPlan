CREATE TABLE "colaborador" (
    "id" integer PRIMARY KEY,
    "nome" varchar NOT NULL,
    "cpf" varchar UNIQUE NOT NULL,
    "data_nascimento" date,
    "data_admissao" date,
    "data_demissao" date,
    "setor_id" integer NOT NULL,
    "funcao_id" integer NOT NULL,
    "ativo" boolean DEFAULT true,
    "apto_trabalho_altura" boolean,
    "criado_em" timestamp DEFAULT(now()),
    "atualizado_em" timestamp DEFAULT(now())
);

CREATE TABLE "setor" (
    "id" integer PRIMARY KEY,
    "nome" varchar UNIQUE NOT NULL,
    "descricao" varchar,
    "ativo" boolean DEFAULT true,
    "criado_em" timestamp DEFAULT(now()),
    "atualizado_em" timestamp DEFAULT(now())
);

CREATE TABLE "funcao" (
    "id" integer PRIMARY KEY,
    "nome" varchar NOT NULL,
    "setor_id" integer NOT NULL,
    "descricao" varchar,
    "ativo" boolean DEFAULT true,
    "criado_em" timestamp DEFAULT(now()),
    "atualizado_em" timestamp DEFAULT(now())
);

CREATE TABLE "epi" (
    "id" integer PRIMARY KEY,
    "nome" varchar NOT NULL,
    "grupo_protecao" varchar NOT NULL,
    "ca_numero" varchar NOT NULL,
    "data_validade_ca" date NOT NULL,
    "durabilidade_dias" integer,
    "url_pdf_ca" varchar,
    "ativo" boolean DEFAULT true,
    "criado_em" timestamp DEFAULT(now()),
    "atualizado_em" timestamp DEFAULT(now())
);

CREATE TABLE "funcao_epi_obrigatorio" (
    "id" integer PRIMARY KEY,
    "funcao_id" integer NOT NULL,
    "epi_id" integer NOT NULL,
    "criado_em" timestamp DEFAULT(now())
);

CREATE TABLE "historico_funcao" (
    "id" integer PRIMARY KEY,
    "colaborador_id" integer NOT NULL,
    "funcao_id" integer NOT NULL,
    "setor_id" integer NOT NULL,
    "data_inicio" date NOT NULL,
    "data_fim" date,
    "motivo_mudanca" varchar,
    "criado_em" timestamp DEFAULT(now())
);

CREATE TABLE "entrega_epi" (
    "id" integer PRIMARY KEY,
    "colaborador_id" integer NOT NULL,
    "epi_id" integer NOT NULL,
    "quantidade" integer NOT NULL DEFAULT 1,
    "data_entrega" date NOT NULL,
    "assinado" boolean DEFAULT false,
    "observacao" varchar,
    "criado_em" timestamp DEFAULT(now()),
    "atualizado_em" timestamp DEFAULT(now())
);

CREATE TABLE "aso" (
    "id" integer PRIMARY KEY,
    "colaborador_id" integer NOT NULL,
    "tipo" varchar NOT NULL,
    "data_emissao" date NOT NULL,
    "data_vencimento" date NOT NULL,
    "url_documento" varchar,
    "observacao" varchar,
    "criado_em" timestamp DEFAULT(now()),
    "atualizado_em" timestamp DEFAULT(now())
);

CREATE TABLE "certificado" (
    "id" integer PRIMARY KEY,
    "nome" varchar NOT NULL,
    "nr_codigo" varchar,
    "carga_horaria" integer,
    "validade_meses" integer,
    "descricao" varchar,
    "criado_em" timestamp DEFAULT(now())
);

CREATE TABLE "colaborador_certificado" (
    "id" integer PRIMARY KEY,
    "colaborador_id" integer NOT NULL,
    "certificado_id" integer NOT NULL,
    "data_conclusao" date NOT NULL,
    "data_vencimento" date,
    "url_certificado" varchar,
    "criado_em" timestamp DEFAULT(now())
);

CREATE TABLE "funcao_treinamento_obrigatorio" (
    "funcao_id" integer NOT NULL,
    "certificado_id" integer NOT NULL,
    PRIMARY KEY ("funcao_id", "certificado_id")
);

CREATE TABLE "treinamento" (
    "id" integer PRIMARY KEY,
    "colaborador_id" integer NOT NULL,
    "certificado_id" integer NOT NULL,
    "colaborador_certificado_id" integer UNIQUE,
    "data_emissao" date NOT NULL,
    "criado_em" timestamp DEFAULT(now())
);

CREATE TABLE "ordem_servico" (
    "id" integer PRIMARY KEY,
    "colaborador_id" integer NOT NULL,
    "titulo" varchar NOT NULL,
    "data_emissao" date NOT NULL,
    "assinado" boolean DEFAULT false,
    "url_documento" varchar,
    "criado_em" timestamp DEFAULT(now())
);

CREATE TABLE "ficha_registro" (
    "id" integer PRIMARY KEY,
    "colaborador_id" integer NOT NULL,
    "tipo_documento" varchar NOT NULL,
    "url_documento" varchar NOT NULL,
    "validado" boolean DEFAULT false,
    "data_emissao" date,
    "data_vencimento" date,
    "criado_em" timestamp DEFAULT(now())
);

ALTER TABLE "colaborador"
ADD FOREIGN KEY ("setor_id") REFERENCES "setor" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "colaborador"
ADD FOREIGN KEY ("funcao_id") REFERENCES "funcao" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "funcao"
ADD FOREIGN KEY ("setor_id") REFERENCES "setor" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "funcao_epi_obrigatorio"
ADD FOREIGN KEY ("funcao_id") REFERENCES "funcao" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "funcao_epi_obrigatorio"
ADD FOREIGN KEY ("epi_id") REFERENCES "epi" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "historico_funcao"
ADD FOREIGN KEY ("colaborador_id") REFERENCES "colaborador" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "historico_funcao"
ADD FOREIGN KEY ("funcao_id") REFERENCES "funcao" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "historico_funcao"
ADD FOREIGN KEY ("setor_id") REFERENCES "setor" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "entrega_epi"
ADD FOREIGN KEY ("colaborador_id") REFERENCES "colaborador" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "entrega_epi"
ADD FOREIGN KEY ("epi_id") REFERENCES "epi" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "aso"
ADD FOREIGN KEY ("colaborador_id") REFERENCES "colaborador" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "colaborador_certificado"
ADD FOREIGN KEY ("colaborador_id") REFERENCES "colaborador" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "colaborador_certificado"
ADD FOREIGN KEY ("certificado_id") REFERENCES "certificado" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "funcao_treinamento_obrigatorio"
ADD FOREIGN KEY ("funcao_id") REFERENCES "funcao" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "funcao_treinamento_obrigatorio"
ADD FOREIGN KEY ("certificado_id") REFERENCES "certificado" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "treinamento"
ADD FOREIGN KEY ("colaborador_id") REFERENCES "colaborador" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "treinamento"
ADD FOREIGN KEY ("certificado_id") REFERENCES "certificado" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "treinamento"
ADD FOREIGN KEY ("colaborador_certificado_id") REFERENCES "colaborador_certificado" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "ordem_servico"
ADD FOREIGN KEY ("colaborador_id") REFERENCES "colaborador" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "ficha_registro"
ADD FOREIGN KEY ("colaborador_id") REFERENCES "colaborador" ("id") DEFERRABLE INITIALLY IMMEDIATE;
"""
Aplica as migrações SQL de backend/migrations ao iniciar o backend.

O create_all do SQLAlchemy só cria tabelas novas; colunas e ajustes em tabelas existentes
ficam em scripts numerados (001_..., 002_...). Cada script roda uma única vez por banco,
dentro de uma transação, e fica registrado na tabela migracao_aplicada.
Para mudar o banco: crie o próximo arquivo numerado nesta pasta; nunca altere um já aplicado.
"""

import logging
from pathlib import Path

from sqlalchemy import text

from database import engine

MIGRACOES_DIR = Path(__file__).resolve().parent / "migrations"

logger = logging.getLogger("services.migracoes")


def aplicar_migracoes():
    with engine.begin() as conexao:
        conexao.execute(text(
            "CREATE TABLE IF NOT EXISTS migracao_aplicada ("
            " nome varchar PRIMARY KEY,"
            " aplicada_em timestamp NOT NULL DEFAULT now())"
        ))
        aplicadas = set(conexao.execute(text("SELECT nome FROM migracao_aplicada")).scalars())

    for arquivo in sorted(MIGRACOES_DIR.glob("*.sql")):
        if arquivo.name in aplicadas:
            continue
        # o script e o registro entram juntos: se o script falhar, nada é gravado e o backend não sobe
        with engine.begin() as conexao:
            conexao.exec_driver_sql(arquivo.read_text(encoding="utf-8"))
            conexao.execute(text("INSERT INTO migracao_aplicada (nome) VALUES (:nome)"), {"nome": arquivo.name})
        logger.info("Migração aplicada: %s", arquivo.name)

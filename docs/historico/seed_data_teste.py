from datetime import date

from sqlalchemy.orm import Session

from database import SessionLocal
from models import Colaborador, Funcao, Setor


def seed_initial_data() -> None:
    db: Session = SessionLocal()
    try:
        has_existing_data = (
            db.query(Setor).first() is not None
            or db.query(Funcao).first() is not None
            or db.query(Colaborador).first() is not None
        )

        if has_existing_data:
            return

        setores = [
            Setor(nome="Produção", descricao="Setor de produção e operação", ativo=True),
            Setor(nome="Manutenção", descricao="Setor de manutenção industrial", ativo=True),
            Setor(nome="Logística", descricao="Setor de recebimento e abastecimento", ativo=True),
            Setor(nome="Administrativo", descricao="Setor administrativo e suporte", ativo=True),
        ]
        db.add_all(setores)
        db.flush()

        setor_map = {setor.nome: setor.id for setor in setores}

        funcoes = [
            Funcao(nome="Operador de máquinas", setor_id=setor_map["Produção"], descricao="Operação de máquinas e linha de produção", ativo=True),
            Funcao(nome="Técnica de manutenção", setor_id=setor_map["Manutenção"], descricao="Manutenção industrial e equipamentos", ativo=True),
            Funcao(nome="Almoxarife", setor_id=setor_map["Logística"], descricao="Controle de material e estoque", ativo=True),
            Funcao(nome="Soldador", setor_id=setor_map["Produção"], descricao="Processos de soldagem e montagem", ativo=True),
            Funcao(nome="Assistente administrativa", setor_id=setor_map["Administrativo"], descricao="Atendimento e apoio administrativo", ativo=True),
            Funcao(nome="Operadora de máquinas", setor_id=setor_map["Produção"], descricao="Operação de máquinas e linha de produção", ativo=True),
            Funcao(nome="Técnico de manutenção", setor_id=setor_map["Manutenção"], descricao="Suporte técnico em manutenção", ativo=True),
        ]
        db.add_all(funcoes)
        db.flush()

        funcao_map = {funcao.nome: funcao.id for funcao in funcoes}

        colaboradores = [
            Colaborador(
                nome="Carlos Eduardo Silva",
                cpf="00000000100",
                data_nascimento=date(1990, 5, 12),
                data_admissao=date(2022, 1, 10),
                setor_id=setor_map["Produção"],
                funcao_id=funcao_map["Operador de máquinas"],
                ativo=True,
            ),
            Colaborador(
                nome="Juliana Costa Ribeiro",
                cpf="00000000200",
                data_nascimento=date(1992, 8, 20),
                data_admissao=date(2021, 7, 5),
                setor_id=setor_map["Manutenção"],
                funcao_id=funcao_map["Técnica de manutenção"],
                ativo=True,
            ),
            Colaborador(
                nome="Rafael Oliveira Santos",
                cpf="00000000300",
                data_nascimento=date(1988, 2, 15),
                data_admissao=date(2019, 11, 19),
                setor_id=setor_map["Logística"],
                funcao_id=funcao_map["Almoxarife"],
                ativo=True,
            ),
            Colaborador(
                nome="Marcos Paulo Ferreira",
                cpf="00000000400",
                data_nascimento=date(1995, 10, 27),
                data_admissao=date(2023, 3, 12),
                setor_id=setor_map["Produção"],
                funcao_id=funcao_map["Soldador"],
                ativo=True,
            ),
            Colaborador(
                nome="Ana Beatriz Lima",
                cpf="00000000500",
                data_nascimento=date(1994, 4, 8),
                data_admissao=date(2020, 9, 1),
                setor_id=setor_map["Administrativo"],
                funcao_id=funcao_map["Assistente administrativa"],
                ativo=True,
            ),
            Colaborador(
                nome="Fernanda Alves Rocha",
                cpf="00000000600",
                data_nascimento=date(1987, 11, 16),
                data_admissao=date(2022, 5, 22),
                setor_id=setor_map["Produção"],
                funcao_id=funcao_map["Operadora de máquinas"],
                ativo=True,
            ),
            Colaborador(
                nome="Pedro Henrique Souza",
                cpf="00000000700",
                data_nascimento=date(1991, 7, 3),
                data_admissao=date(2021, 2, 14),
                setor_id=setor_map["Manutenção"],
                funcao_id=funcao_map["Técnico de manutenção"],
                ativo=True,
            ),
            Colaborador(
                nome="Lucas Mendes Pereira",
                cpf="00000000800",
                data_nascimento=date(1993, 12, 9),
                data_admissao=date(2024, 1, 16),
                setor_id=setor_map["Logística"],
                funcao_id=funcao_map["Almoxarife"],
                ativo=True,
            ),
        ]
        db.add_all(colaboradores)
        db.commit()

    finally:
        db.close()

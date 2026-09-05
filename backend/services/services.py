from typing import Optional
import models, schemas
from fastapi import HTTPException, status
from sqlalchemy.orm import Session


#====================================Colaboradores====================================

# Criar um novo colaborador
def criar_colaborador_banco(colaborador: schemas.ColaboradorCreate, db: Session):
    novo_colaborador = models.Colaborador(**colaborador.model_dump())
    db.add(novo_colaborador)
    db.commit()
    db.refresh(novo_colaborador)
    return novo_colaborador


# Buscar colaboradores por nome, caso nao tenha o nome, busca todos
def listar_colaboradores_banco(db: Session, nome: Optional[str] = None):
    query = db.query(models.Colaborador)
    if nome:
        query = query.filter(models.Colaborador.nome.ilike(f"%{nome}%"))
    return query.all()


# Buscar colaboradores por id
def buscar_colaborador_por_id_banco(colaborador_id: int, db: Session):
    colaborador = db.query(models.Colaborador).filter(models.Colaborador.id == colaborador_id).first()
    if not colaborador:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Colaborador não encontrado")
    return colaborador


# Atualizar colaborador por id
def atualizar_colaborador_por_id_banco(colaborador_id: int, dados_novos: schemas.ColaboradorCreate, db: Session):
    colaborador_banco = db.query(models.Colaborador).filter(models.Colaborador.id == colaborador_id).first()
    if not colaborador_banco:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Colaborador não encontrado")
    
    for chave, valor in dados_novos.model_dump().items():
        setattr(colaborador_banco, chave, valor)
    
    db.commit()
    db.refresh(colaborador_banco)
    return colaborador_banco

# Soft Delete (Desativa) colaborador por id
def desativar_colaborador_por_id_banco(colaborador_id: int, db: Session):
    colaborador_banco = db.query(models.Colaborador).filter(models.Colaborador.id == colaborador_id).first()
    if not colaborador_banco:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Colaborador não encontrado")
    
    colaborador_banco.ativo = False
    db.commit()
    return {"mensagem": "Colaborador desativado com sucesso"}

# Hard Delete colaborador por id (Ainda NAO implementado nas routes)
def deletar_colaborador_por_id_banco(colaborador_id: int, db: Session):
    colaborador_banco = db.query(models.Colaborador).filter(models.Colaborador.id == colaborador_id).first()
    if not colaborador_banco:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Colaborador não encontrado")
    
    db.delete(colaborador_banco)
    db.commit()
    return {"mensagem": "Colaborador deletado com sucesso"}
from typing import Optional
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
import schemas
from services import services

router = APIRouter(prefix="/colaboradores", tags=["Colaboradores"])

# Adicionar um novo colaborador
@router.post("/", response_model=schemas.ColaboradorResponse)
def criar_colaborador(colaborador: schemas.ColaboradorCreate, db: Session = Depends(get_db)):
    return services.criar_colaborador_banco(colaborador, db) 


# Buscar colaboradores por nome, caso nao tenha o nome, busca todos
@router.get("/", response_model=list[schemas.ColaboradorResponse])
def listar_colaboradores(nome: Optional[str] = None, db: Session = Depends(get_db)):
    return services.listar_colaboradores_banco(db, nome)


# Buscar colaboradores por id
@router.get("/{colaborador_id}", response_model=schemas.ColaboradorResponse)
def buscar_colaborador_por_id(colaborador_id: int, db: Session = Depends(get_db)):
    
    return services.buscar_colaborador_por_id_banco(colaborador_id, db)


# Atualizar colaboradores por id
@router.put("/{colaborador_id}", response_model=schemas.ColaboradorResponse)
def atualizar_colaborador_por_id(colaborador_id: int, dados_novos: schemas.ColaboradorCreate, db: Session = Depends(get_db)):
    return services.atualizar_colaborador_por_id_banco(colaborador_id, dados_novos, db)


# Desativar colaboradores por id
@router.delete("/{colaborador_id}")
def desativar_colaborador_por_id(colaborador_id: int, db: Session = Depends(get_db)):

    return services.desativar_colaborador_por_id_banco(colaborador_id, db)
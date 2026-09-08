from typing import Optional
from fastapi import APIRouter, Depends
from database import get_db
from sqlalchemy.orm import Session
import schemas
from services import services

router = APIRouter(prefix="/setores", tags=["Setores"])

# Criar novo setor
@router.post("/", response_model=schemas.SetorResponse)
def criar_setor(setor: schemas.SetorCreate, db: Session = Depends(get_db)):
    return services.criar_setor_banco(setor, db)

# Listar setores (por nome ou todos)
@router.get("/", response_model=list[schemas.SetorResponse])
def listar_setores(db: Session = Depends(get_db), nome: Optional[str] = None):
    return services.listar_setores_banco(db, nome)

# Buscar setor por id
@router.get("/{setor_id}", response_model=schemas.SetorResponse)
def buscar_setor_por_id(setor_id: int, db: Session = Depends(get_db)):
    return services.buscar_setor_por_id_banco(setor_id, db)

# Atualizar setor por id
@router.put("/{setor_id}", response_model=schemas.SetorResponse)
def atualizar_setor_por_id(setor_id: int, dados_novos: schemas.SetorCreate, db: Session = Depends(get_db)):
    return services.atualizar_setor_por_id_banco(setor_id, dados_novos, db)

# Desativar setores por id
@router.delete("/{setor_id}")
def desativar_setor_por_id(setor_id: int, db: Session = Depends(get_db)):

    return services.desativar_setor_por_id_banco(setor_id, db)
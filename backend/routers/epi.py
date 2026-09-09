from typing import Optional
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
import schemas
from services import services

router = APIRouter(prefix="/epis", tags=["EPI"])

# Adicionar um novo EPI
@router.post("/", response_model=schemas.EpiResponse)
def criar_epi(epi: schemas.EpiCreate, db: Session = Depends(get_db)):
    return services.criar_epi_banco(epi, db)

# Buscar EPIs por nome, caso nao tenha o nome, busca todos (apenas ativos por padrão)
@router.get("/", response_model=list[schemas.EpiResponse])
def listar_epis(nome: Optional[str] = None, db: Session = Depends(get_db), apenas_ativos: bool = True):
    return services.listar_epis_banco(db, nome, apenas_ativos)

# Buscar EPI por id
@router.get("/{epi_id}", response_model=schemas.EpiResponse)
def buscar_epi_por_id(epi_id: int, db: Session = Depends(get_db)):
    return services.buscar_epi_por_id_banco(epi_id, db)

# Atualizar EPI por id
@router.put("/{epi_id}", response_model=schemas.EpiResponse)
def atualizar_epi_por_id(epi_id: int, dados_novos: schemas.EpiCreate, db: Session = Depends(get_db)):
    return services.atualizar_epi_por_id_banco(epi_id, dados_novos, db)

# Desativar EPI por id
@router.delete("/{epi_id}")
def desativar_epi_por_id(epi_id: int, db: Session = Depends(get_db)):
    return services.desativar_epi_por_id_banco(epi_id, db)

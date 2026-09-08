from typing import Optional
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
import schemas
from services import services

router = APIRouter(prefix="/entregas-epi", tags=["Entrega EPI"])

# Adicionar uma nova entrega de EPI
@router.post("/", response_model=schemas.EntregaEpiResponse)
def criar_entrega_epi(entrega: schemas.EntregaEpiCreate, db: Session = Depends(get_db)):
    return services.criar_entrega_epi_banco(entrega, db)

# Buscar entregas por colaborador, caso nao tenha o colaborador, busca todas
@router.get("/", response_model=list[schemas.EntregaEpiResponse])
def listar_entregas_epi(colaborador_id: Optional[int] = None, db: Session = Depends(get_db)):
    return services.listar_entregas_epi_banco(db, colaborador_id)

# Buscar entrega por id
@router.get("/{entrega_id}", response_model=schemas.EntregaEpiResponse)
def buscar_entrega_epi_por_id(entrega_id: int, db: Session = Depends(get_db)):
    return services.buscar_entrega_epi_por_id_banco(entrega_id, db)

# Atualizar entrega por id
@router.put("/{entrega_id}", response_model=schemas.EntregaEpiResponse)
def atualizar_entrega_epi(entrega_id: int, dados: schemas.EntregaEpiCreate, db: Session = Depends(get_db)):
    return services.atualizar_entrega_epi_banco(entrega_id, dados, db)

# Deletar entrega por id
@router.delete("/{entrega_id}")
def deletar_entrega_epi(entrega_id: int, db: Session = Depends(get_db)):
    return services.deletar_entrega_epi_banco(entrega_id, db)

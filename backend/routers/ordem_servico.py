from typing import Optional
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
import schemas
from services import services

router = APIRouter(prefix="/ordens-servico", tags=["Ordens de Serviço"])

# Adicionar uma nova ordem de serviço
@router.post("/", response_model=schemas.OrdemServicoResponse)
def criar_ordem_servico(os: schemas.OrdemServicoCreate, db: Session = Depends(get_db)):
    return services.criar_ordem_servico_banco(os, db)

# Buscar ordens por colaborador, caso nao tenha o colaborador, busca todas
@router.get("/", response_model=list[schemas.OrdemServicoResponse])
def listar_ordens_servico(colaborador_id: Optional[int] = None, db: Session = Depends(get_db)):
    return services.listar_ordens_servico_banco(db, colaborador_id)

# Buscar ordem de serviço por id
@router.get("/{os_id}", response_model=schemas.OrdemServicoResponse)
def buscar_ordem_servico_por_id(os_id: int, db: Session = Depends(get_db)):
    return services.buscar_ordem_servico_por_id_banco(os_id, db)

# Atualizar ordem de serviço por id
@router.put("/{os_id}", response_model=schemas.OrdemServicoResponse)
def atualizar_ordem_servico(os_id: int, dados: schemas.OrdemServicoCreate, db: Session = Depends(get_db)):
    return services.atualizar_ordem_servico_banco(os_id, dados, db)

# Deletar ordem de serviço por id
@router.delete("/{os_id}")
def deletar_ordem_servico(os_id: int, db: Session = Depends(get_db)):
    return services.deletar_ordem_servico_banco(os_id, db)

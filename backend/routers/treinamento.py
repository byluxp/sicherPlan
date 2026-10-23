from typing import Optional
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
import schemas
from services import services

router = APIRouter(prefix="/treinamentos", tags=["Treinamentos"])


@router.post("/", response_model=schemas.TreinamentoResponse)
def criar_treinamento(treinamento: schemas.TreinamentoCreate, db: Session = Depends(get_db)):
    return services.criar_treinamento_banco(treinamento, db)

# Histórico de treinamentos (inicial e reciclagens), filtrável por colaborador e certificado
@router.get("/", response_model=list[schemas.TreinamentoHistoricoResponse])
def listar_treinamentos(colaborador_id: Optional[int] = None, certificado_id: Optional[int] = None, db: Session = Depends(get_db)):
    return services.listar_treinamentos_banco(db, colaborador_id, certificado_id)

# Buscar treinamento por id
@router.get("/{treinamento_id}", response_model=schemas.TreinamentoHistoricoResponse)
def buscar_treinamento_por_id(treinamento_id: int, db: Session = Depends(get_db)):
    return services.buscar_treinamento_por_id_banco(treinamento_id, db)

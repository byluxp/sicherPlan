from typing import Optional
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
import schemas
from services import services

router = APIRouter(prefix="/asos", tags=["ASO"])

# Adicionar um novo ASO
@router.post("/", response_model=schemas.AsoResponse)
def criar_aso(aso: schemas.AsoCreate, db: Session = Depends(get_db)):
    return services.criar_aso_banco(aso, db)

# Buscar ASOs por colaborador, caso nao tenha o colaborador, busca todos
@router.get("/", response_model=list[schemas.AsoResponse])
def listar_asos(colaborador_id: Optional[int] = None, db: Session = Depends(get_db)):
    return services.listar_asos_banco(db, colaborador_id)

# Buscar ASO por id
@router.get("/{aso_id}", response_model=schemas.AsoResponse)
def buscar_aso_por_id(aso_id: int, db: Session = Depends(get_db)):
    return services.buscar_aso_por_id_banco(aso_id, db)

# Atualizar ASO por id
@router.put("/{aso_id}", response_model=schemas.AsoResponse)
def atualizar_aso_por_id(aso_id: int, dados_novos: schemas.AsoCreate, db: Session = Depends(get_db)):
    return services.atualizar_aso_por_id_banco(aso_id, dados_novos, db)

# Deletar ASO por id
@router.delete("/{aso_id}")
def deletar_aso_por_id(aso_id: int, db: Session = Depends(get_db)):
    return services.deletar_aso_por_id_banco(aso_id, db)

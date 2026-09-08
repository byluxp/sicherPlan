from typing import Optional
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
import schemas
from services import services

router = APIRouter(prefix="/funcao-epis", tags=["Função EPI"])

# Adicionar EPI obrigatório à função
@router.post("/", response_model=schemas.FuncaoEpiObrigatorioResponse)
def criar_funcao_epi(item: schemas.FuncaoEpiObrigatorioCreate, db: Session = Depends(get_db)):
    return services.criar_funcao_epi_banco(item, db)

# Buscar vínculos por função, caso nao tenha a função, busca todos
@router.get("/", response_model=list[schemas.FuncaoEpiObrigatorioResponse])
def listar_funcao_epis(funcao_id: Optional[int] = None, db: Session = Depends(get_db)):
    return services.listar_funcao_epis_banco(db, funcao_id)

# Buscar vínculo por id
@router.get("/{funcao_epi_id}", response_model=schemas.FuncaoEpiObrigatorioResponse)
def buscar_funcao_epi_por_id(funcao_epi_id: int, db: Session = Depends(get_db)):
    return services.buscar_funcao_epi_por_id_banco(funcao_epi_id, db)

# Atualizar vínculo por id
@router.put("/{funcao_epi_id}", response_model=schemas.FuncaoEpiObrigatorioResponse)
def atualizar_funcao_epi(funcao_epi_id: int, dados: schemas.FuncaoEpiObrigatorioCreate, db: Session = Depends(get_db)):
    return services.atualizar_funcao_epi_banco(funcao_epi_id, dados, db)

# Deletar vínculo por id
@router.delete("/{funcao_epi_id}")
def deletar_funcao_epi(funcao_epi_id: int, db: Session = Depends(get_db)):
    return services.deletar_funcao_epi_banco(funcao_epi_id, db)

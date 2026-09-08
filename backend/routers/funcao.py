from typing import Optional
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
import schemas
from services import services

router = APIRouter(prefix="/funcoes", tags=["Funções"])

# Adicionar uma nova função
@router.post("/", response_model=schemas.FuncaoResponse)
def criar_funcao(funcao: schemas.FuncaoCreate, db: Session = Depends(get_db)):
    return services.criar_funcao_banco(funcao, db)

# Buscar funções por nome, caso nao tenha o nome, busca todas
@router.get("/", response_model=list[schemas.FuncaoResponse])
def listar_funcoes(nome: Optional[str] = None, db: Session = Depends(get_db)):
    return services.listar_funcoes_banco(db, nome)

# Buscar função por id
@router.get("/{funcao_id}", response_model=schemas.FuncaoResponse)
def buscar_funcao_por_id(funcao_id: int, db: Session = Depends(get_db)):
    return services.buscar_funcao_por_id_banco(funcao_id, db)

# Atualizar função por id
@router.put("/{funcao_id}", response_model=schemas.FuncaoResponse)
def atualizar_funcao_por_id(funcao_id: int, dados_novos: schemas.FuncaoCreate, db: Session = Depends(get_db)):
    return services.atualizar_funcao_por_id_banco(funcao_id, dados_novos, db)

# Desativar função por id
@router.delete("/{funcao_id}")
def desativar_funcao_por_id(funcao_id: int, db: Session = Depends(get_db)):
    return services.desativar_funcao_por_id_banco(funcao_id, db)

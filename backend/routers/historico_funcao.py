from typing import Optional
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
import schemas
from services import services

router = APIRouter(prefix="/historicos-funcao", tags=["Histórico Função"])

# Adicionar um novo histórico de função
@router.post("/", response_model=schemas.HistoricoFuncaoResponse)
def criar_historico_funcao(historico: schemas.HistoricoFuncaoCreate, db: Session = Depends(get_db)):
    return services.criar_historico_funcao_banco(historico, db)

# Buscar históricos por colaborador, caso nao tenha o colaborador, busca todos
@router.get("/", response_model=list[schemas.HistoricoFuncaoResponse])
def listar_historicos_funcao(colaborador_id: Optional[int] = None, db: Session = Depends(get_db)):
    return services.listar_historicos_funcao_banco(db, colaborador_id)

# Buscar histórico por id
@router.get("/{historico_id}", response_model=schemas.HistoricoFuncaoResponse)
def buscar_historico_funcao_por_id(historico_id: int, db: Session = Depends(get_db)):
    return services.buscar_historico_funcao_por_id_banco(historico_id, db)

# Atualizar histórico por id
@router.put("/{historico_id}", response_model=schemas.HistoricoFuncaoResponse)
def atualizar_historico_funcao(historico_id: int, dados: schemas.HistoricoFuncaoCreate, db: Session = Depends(get_db)):
    return services.atualizar_historico_funcao_banco(historico_id, dados, db)

# Deletar histórico por id
@router.delete("/{historico_id}")
def deletar_historico_funcao(historico_id: int, db: Session = Depends(get_db)):
    return services.deletar_historico_funcao_banco(historico_id, db)

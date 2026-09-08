from typing import Optional
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
import schemas
from services import services

router = APIRouter(prefix="/fichas-registro", tags=["Fichas de Registro"])

# Adicionar uma nova ficha de registro
@router.post("/", response_model=schemas.FichaRegistroResponse)
def criar_ficha_registro(ficha: schemas.FichaRegistroCreate, db: Session = Depends(get_db)):
    return services.criar_ficha_registro_banco(ficha, db)

# Buscar fichas por colaborador, caso nao tenha o colaborador, busca todas
@router.get("/", response_model=list[schemas.FichaRegistroResponse])
def listar_fichas_registro(colaborador_id: Optional[int] = None, db: Session = Depends(get_db)):
    return services.listar_fichas_registro_banco(db, colaborador_id)

# Buscar ficha por id
@router.get("/{ficha_id}", response_model=schemas.FichaRegistroResponse)
def buscar_ficha_registro_por_id(ficha_id: int, db: Session = Depends(get_db)):
    return services.buscar_ficha_registro_por_id_banco(ficha_id, db)

# Atualizar ficha por id
@router.put("/{ficha_id}", response_model=schemas.FichaRegistroResponse)
def atualizar_ficha_registro(ficha_id: int, dados: schemas.FichaRegistroCreate, db: Session = Depends(get_db)):
    return services.atualizar_ficha_registro_banco(ficha_id, dados, db)

# Deletar ficha por id
@router.delete("/{ficha_id}")
def deletar_ficha_registro(ficha_id: int, db: Session = Depends(get_db)):
    return services.deletar_ficha_registro_banco(ficha_id, db)

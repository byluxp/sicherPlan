from typing import Optional
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
import schemas
from services import services

router = APIRouter(prefix="/colaborador-certificados", tags=["Colaborador Certificado"])

# Adicionar um certificado ao colaborador
@router.post("/", response_model=schemas.ColaboradorCertificadoResponse)
def criar_colaborador_certificado(item: schemas.ColaboradorCertificadoCreate, db: Session = Depends(get_db)):
    return services.criar_colaborador_certificado_banco(item, db)

# Buscar certificados por colaborador, caso nao tenha o colaborador, busca todos
@router.get("/", response_model=list[schemas.ColaboradorCertificadoResponse])
def listar_colaborador_certificados(colaborador_id: Optional[int] = None, db: Session = Depends(get_db)):
    return services.listar_colaborador_certificados_banco(db, colaborador_id)

# Buscar vínculo por id
@router.get("/{item_id}", response_model=schemas.ColaboradorCertificadoResponse)
def buscar_colaborador_certificado_por_id(item_id: int, db: Session = Depends(get_db)):
    return services.buscar_colaborador_certificado_por_id_banco(item_id, db)

# Atualizar vínculo por id
@router.put("/{item_id}", response_model=schemas.ColaboradorCertificadoResponse)
def atualizar_colaborador_certificado(item_id: int, dados: schemas.ColaboradorCertificadoCreate, db: Session = Depends(get_db)):
    return services.atualizar_colaborador_certificado_banco(item_id, dados, db)

# Deletar vínculo por id
@router.delete("/{item_id}")
def deletar_colaborador_certificado(item_id: int, db: Session = Depends(get_db)):
    return services.deletar_colaborador_certificado_banco(item_id, db)

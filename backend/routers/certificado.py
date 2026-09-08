from typing import Optional
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
import schemas
from services import services

router = APIRouter(prefix="/certificados", tags=["Certificados"])

# Adicionar um novo certificado
@router.post("/", response_model=schemas.CertificadoResponse)
def criar_certificado(certificado: schemas.CertificadoCreate, db: Session = Depends(get_db)):
    return services.criar_certificado_banco(certificado, db)

# Buscar certificados por nome, caso nao tenha o nome, busca todos
@router.get("/", response_model=list[schemas.CertificadoResponse])
def listar_certificados(nome: Optional[str] = None, db: Session = Depends(get_db)):
    return services.listar_certificados_banco(db, nome)

# Buscar certificado por id
@router.get("/{certificado_id}", response_model=schemas.CertificadoResponse)
def buscar_certificado_por_id(certificado_id: int, db: Session = Depends(get_db)):
    return services.buscar_certificado_por_id_banco(certificado_id, db)

# Atualizar certificado por id
@router.put("/{certificado_id}", response_model=schemas.CertificadoResponse)
def atualizar_certificado(certificado_id: int, dados: schemas.CertificadoCreate, db: Session = Depends(get_db)):
    return services.atualizar_certificado_banco(certificado_id, dados, db)

# Deletar certificado por id
@router.delete("/{certificado_id}")
def deletar_certificado(certificado_id: int, db: Session = Depends(get_db)):
    return services.deletar_certificado_banco(certificado_id, db)

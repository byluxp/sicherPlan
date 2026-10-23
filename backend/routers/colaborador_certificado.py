from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from database import get_db
import schemas
from services import documentos, services

router = APIRouter(prefix="/colaborador-certificados", tags=["Colaborador Certificado"])


@router.post("/gerar", response_model=schemas.GerarCertificadoResponse)
def gerar_certificado(dados: schemas.GerarCertificadoRequest, db: Session = Depends(get_db)):
    registro, treinamento, _ = services.gerar_certificado_documento_banco(dados, db)
    dados_registro = schemas.ColaboradorCertificadoResponse.model_validate(registro).model_dump()
    return schemas.GerarCertificadoResponse(**dados_registro, treinamento_id=treinamento.id)

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


@router.get("/{item_id}/documento")
def baixar_documento_certificado(item_id: int, db: Session = Depends(get_db)):
    registro = services.buscar_colaborador_certificado_por_id_banco(item_id, db)
    if not registro.url_certificado or not registro.certificado or not registro.certificado.nr_codigo:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Documento não encontrado")
    caminho = documentos.caminho_certificado(registro.id, registro.certificado.nr_codigo)
    if not caminho.is_file():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Arquivo do certificado não encontrado")
    return FileResponse(
        caminho,
        media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        filename=caminho.name,
    )

# Atualizar vínculo por id
@router.put("/{item_id}", response_model=schemas.ColaboradorCertificadoResponse)
def atualizar_colaborador_certificado(item_id: int, dados: schemas.ColaboradorCertificadoCreate, db: Session = Depends(get_db)):
    return services.atualizar_colaborador_certificado_banco(item_id, dados, db)

# Deletar vínculo por id
@router.delete("/{item_id}")
def deletar_colaborador_certificado(item_id: int, db: Session = Depends(get_db)):
    return services.deletar_colaborador_certificado_banco(item_id, db)

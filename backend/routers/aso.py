from typing import Optional
from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from fastapi.concurrency import run_in_threadpool
from sqlalchemy.orm import Session
from database import get_db
import schemas
from services import services

router = APIRouter(prefix="/asos", tags=["ASO"])

TAMANHO_MAXIMO_DOCUMENTO = 10 * 1024 * 1024


# Lê o PDF (ou foto) do ASO de um colaborador já cadastrado e devolve os dados para conferência (não salva)
@router.post("/importar-documento", response_model=schemas.AsoImportacaoDocumentoResponse)
async def importar_documento(colaborador_id: int = Form(...), arquivo: UploadFile = File(...), db: Session = Depends(get_db)):
    conteudo = await arquivo.read(TAMANHO_MAXIMO_DOCUMENTO + 1)
    if len(conteudo) > TAMANHO_MAXIMO_DOCUMENTO:
        raise HTTPException(status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE, detail="O arquivo ultrapassa o limite de 10 MB.")
    # OCR e IA levam alguns segundos; roda fora do loop para não travar as outras requisições
    return await run_in_threadpool(services.importar_documento_aso, conteudo, colaborador_id, db)

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

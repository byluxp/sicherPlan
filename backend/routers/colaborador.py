from typing import Optional
from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from fastapi.concurrency import run_in_threadpool
from sqlalchemy.orm import Session
from database import get_db
import schemas
from services import services

router = APIRouter(prefix="/colaboradores", tags=["Colaboradores"])

TAMANHO_MAXIMO_DOCUMENTO = 10 * 1024 * 1024


# Lê o documento de identificação (PDF, PNG ou JPG) e devolve os dados para conferência (não salva)
@router.post("/importar-documento", response_model=schemas.ColaboradorImportacaoDocumentoResponse)
async def importar_documento(arquivo: UploadFile = File(...), db: Session = Depends(get_db)):
    conteudo = await arquivo.read(TAMANHO_MAXIMO_DOCUMENTO + 1)
    if len(conteudo) > TAMANHO_MAXIMO_DOCUMENTO:
        raise HTTPException(status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE, detail="O arquivo ultrapassa o limite de 10 MB.")
    # o OCR leva alguns segundos; roda fora do loop para não travar as outras requisições
    return await run_in_threadpool(services.importar_documento_colaborador, conteudo, db)

# Adicionar um novo colaborador
@router.post("/", response_model=schemas.ColaboradorResponse)
def criar_colaborador(colaborador: schemas.ColaboradorCreate, db: Session = Depends(get_db)):
    return services.criar_colaborador_banco(colaborador, db) 


# Buscar colaboradores por nome, caso nao tenha o nome, busca todos (apenas ativos por padrão)
@router.get("/", response_model=list[schemas.ColaboradorResponse])
def listar_colaboradores(db: Session = Depends(get_db), nome: Optional[str] = None, apenas_ativos: bool = True):
    return services.listar_colaboradores_banco(db, nome, apenas_ativos)


# Buscar colaboradores por id
@router.get("/{colaborador_id}", response_model=schemas.ColaboradorResponse)
def buscar_colaborador_por_id(colaborador_id: int, db: Session = Depends(get_db)):
    
    return services.buscar_colaborador_por_id_banco(colaborador_id, db)


# Atualizar colaboradores por id
@router.put("/{colaborador_id}", response_model=schemas.ColaboradorResponse)
def atualizar_colaborador_por_id(colaborador_id: int, dados_novos: schemas.ColaboradorCreate, db: Session = Depends(get_db)):
    return services.atualizar_colaborador_por_id_banco(colaborador_id, dados_novos, db)


# Desativar colaboradores por id
@router.delete("/{colaborador_id}")
def desativar_colaborador_por_id(colaborador_id: int, db: Session = Depends(get_db)):

    return services.desativar_colaborador_por_id_banco(colaborador_id, db)
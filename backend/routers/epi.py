from typing import Optional
from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from sqlalchemy.orm import Session
from database import get_db
import schemas
from services import services

router = APIRouter(prefix="/epis", tags=["EPI"])

TAMANHO_MAXIMO_PDF = 10 * 1024 * 1024


# Lê o PDF do Certificado de Aprovação e devolve os dados para conferência (não salva o EPI)
@router.post("/importar-ca", response_model=schemas.EpiImportacaoCAResponse)
async def importar_ca(arquivo: UploadFile = File(...), db: Session = Depends(get_db)):
    conteudo = await arquivo.read(TAMANHO_MAXIMO_PDF + 1)
    if len(conteudo) > TAMANHO_MAXIMO_PDF:
        raise HTTPException(status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE, detail="O arquivo ultrapassa o limite de 10 MB.")
    if not conteudo.startswith(b"%PDF"):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Selecione um arquivo PDF.")
    return services.importar_ca_epi(conteudo, db)

# Adicionar um novo EPI
@router.post("/", response_model=schemas.EpiResponse)
def criar_epi(epi: schemas.EpiCreate, db: Session = Depends(get_db)):
    return services.criar_epi_banco(epi, db)

# Buscar EPIs por nome, caso nao tenha o nome, busca todos (apenas ativos por padrão)
@router.get("/", response_model=list[schemas.EpiResponse])
def listar_epis(nome: Optional[str] = None, db: Session = Depends(get_db), apenas_ativos: bool = True):
    return services.listar_epis_banco(db, nome, apenas_ativos)

# Buscar EPI por id
@router.get("/{epi_id}", response_model=schemas.EpiResponse)
def buscar_epi_por_id(epi_id: int, db: Session = Depends(get_db)):
    return services.buscar_epi_por_id_banco(epi_id, db)

# Atualizar EPI por id
@router.put("/{epi_id}", response_model=schemas.EpiResponse)
def atualizar_epi_por_id(epi_id: int, dados_novos: schemas.EpiCreate, db: Session = Depends(get_db)):
    return services.atualizar_epi_por_id_banco(epi_id, dados_novos, db)

# Desativar EPI por id
@router.delete("/{epi_id}")
def desativar_epi_por_id(epi_id: int, db: Session = Depends(get_db)):
    return services.desativar_epi_por_id_banco(epi_id, db)

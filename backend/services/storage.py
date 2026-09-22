import os
import shutil
import uuid
from fastapi import UploadFile, HTTPException, status

DIRETORIO_UPLOADS = "uploads"

def salvar_arquivos(
    arquivo: UploadFile,
    pasta_destino: str,
    extensoes_permitidas: list = [".pdf", ".jpg", ".jpeg", ".png", ".docx"]
) -> str:

    extensao = os.path.splitext(arquivo.filename)[1].lower()
    if extensao not in extensoes_permitidas:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Extensão '{extensao} não permitida. Extensões aceitas '{extensoes_permitidas}"
        )

    caminho_pasta_fisica = os.path.join(DIRETORIO_UPLOADS, pasta_destino)
    os.makedirs(caminho_pasta_fisica, exist_ok=True)

    nome_unico = f"{uuid.uuid4().hex}{extensao}"
    caminho_arquivo_completo = os.path.join(caminho_pasta_fisica, nome_unico)

    arquivo.file.seek(0)
    with open (caminho_arquivo_completo, "wb") as buffer:
        shutil.copyfileobj(arquivo.file,buffer)

    caminho_relativo = os.path.join("/static", pasta_destino, nome_unico)

    return caminho_relativo
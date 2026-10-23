import re
from datetime import date
from pathlib import Path

from docxtpl import DocxTemplate
from fastapi import HTTPException, status

import schemas

BACKEND_DIR = Path(__file__).resolve().parents[1]
TEMPLATES_DIR = BACKEND_DIR / "templates"
CERTIFICADOS_DIR = BACKEND_DIR / "arquivos_gerados" / "certificados"


def _formatar_cpf(cpf: str) -> str:
    digitos = re.sub(r"\D", "", cpf)
    if len(digitos) != 11:
        return cpf
    return f"{digitos[:3]}.{digitos[3:6]}.{digitos[6:9]}-{digitos[9:]}"


def _formatar_data(valor: date) -> str:
    return valor.strftime("%d/%m/%Y")


# Caminho fixo do arquivo gerado, usado tanto na geração quanto no download
def caminho_certificado(registro_id: int, nr_codigo: str) -> Path:
    return CERTIFICADOS_DIR / f"Certificado_{nr_codigo.replace('-', '')}_{registro_id}.docx"


def gerar_docx_certificado(dados: schemas.CertificadoDocumentoDados, nome_template: str, caminho_saida: Path) -> Path:
    modelo = TEMPLATES_DIR / nome_template
    if not modelo.is_file():
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Modelo de certificado não encontrado: {nome_template}",
        )

    contexto = {
        "nome_colaborador": dados.nome_colaborador,
        "cpf": _formatar_cpf(dados.cpf),
        "funcao_colaborador": dados.funcao_colaborador,
        "data_conclusao": _formatar_data(dados.data_conclusao),
    }

    doc = DocxTemplate(str(modelo))
    doc.render(contexto)

    caminho_saida.parent.mkdir(parents=True, exist_ok=True)
    doc.save(str(caminho_saida))
    return caminho_saida

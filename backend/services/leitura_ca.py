"""Leitura do PDF do Certificado de Aprovação (CA) emitido pelo MTE.

O PDF do CA tem layout fixo e camada de texto, então os campos são extraídos
por expressões regulares sobre o texto, sem OCR nem IA.
"""

import io
import re
import unicodedata
from datetime import datetime

from fastapi import HTTPException, status
from pypdf import PdfReader
from pypdf.errors import PdfReadError

# Grupos de proteção usados no cadastro de EPI (NR-06, Anexo I), testados em ordem.
# "quedas" vem primeiro porque cinturões e talabartes também citam outras partes do corpo.
# Cada termo é o início de uma palavra (ex.: "auditiv" casa com "auditivo" e "auditiva");
# "pes\b" exige a palavra inteira para não casar com "pesado" ou "pessoa".
GRUPOS_POR_PALAVRA_CHAVE = [
    ("Proteção contra quedas", ("queda", "cinturao", "talabarte")),
    ("Proteção da cabeça", ("cranio", "cabeca", "capacete", "capuz")),
    ("Proteção auditiva", ("auditiv", "auricular")),
    ("Proteção ocular e facial", ("olhos", "face", "facial", "oculos", "viseira")),
    ("Proteção respiratória", ("respirat", "mascara", "pff")),
    ("Proteção das mãos e braços", ("maos", "braco", "luva", "manga", "dedeira")),
    ("Proteção dos pés e pernas", (r"pes\b", "perna", "calcado", "botina", "bota", "perneira")),
    ("Proteção do tronco", ("tronco", "corpo inteiro", "avental", "vestimenta", "jaqueta", "macacao", "colete")),
]


# Palavras que encerram o nome próprio na razão social (ex.: "MARLUVAS EQUIPAMENTOS DE SEGURANCA LTDA" -> "MARLUVAS")
PALAVRAS_FIM_DA_MARCA = {
    "do", "da", "dos", "das", "de", "e", "&", "brasil", "brasileira", "industria", "industrial", "comercio",
    "comercial", "equipamentos", "equipamento", "produtos", "calcados", "confeccoes", "seguranca", "protecao",
    "importacao", "exportacao", "distribuidora", "ltda", "ltda.", "s/a", "s.a.", "sa", "eireli", "me", "epp",
}


def _marca(empresa: str | None) -> str | None:
    if not empresa:
        return None
    palavras = []
    for palavra in empresa.split():
        if _sem_acentos(palavra).strip(",.-") in PALAVRAS_FIM_DA_MARCA and palavras:
            break
        palavras.append(palavra)
    return " ".join(palavras).strip(" ,.-") or empresa


def _sem_acentos(texto: str) -> str:
    return unicodedata.normalize("NFD", texto).encode("ascii", "ignore").decode().lower()


def _campo(texto: str, padrao: str) -> str | None:
    encontrado = re.search(padrao, texto, re.IGNORECASE | re.DOTALL)
    if not encontrado:
        return None
    return " ".join(encontrado.group(1).split())


def _grupo_protecao(aprovado_para: str | None, equipamento: str) -> str | None:
    # "Aprovado para" descreve a parte do corpo protegida; o nome do equipamento é usado como reserva
    for referencia in (aprovado_para or "", equipamento):
        texto = _sem_acentos(referencia)
        for grupo, palavras in GRUPOS_POR_PALAVRA_CHAVE:
            if any(re.search(rf"\b{palavra}", texto) for palavra in palavras):
                return grupo
    return None


def extrair_texto_pdf(conteudo: bytes) -> str:
    try:
        leitor = PdfReader(io.BytesIO(conteudo))
        return "\n".join(pagina.extract_text() or "" for pagina in leitor.pages)
    except PdfReadError:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Não foi possível ler o PDF. O arquivo pode estar corrompido.")


def ler_certificado_aprovacao(conteudo: bytes) -> dict:
    texto = extrair_texto_pdf(conteudo)
    if not texto.strip():
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="O PDF não possui texto (provavelmente foi digitalizado). Baixe o CA original no site do MTE.",
        )
    if "CERTIFICADO DE APROVA" not in texto.upper():
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="O arquivo não parece ser um Certificado de Aprovação (CA) do MTE.")

    ca_numero = _campo(texto, r"CA\s*N[º°o]\.?\s*([\d.]+)")
    validade = _campo(texto, r"Validade:\s*(\d{2}/\d{2}/\d{4})")
    equipamento = _campo(texto, r"Equipamento:\s*([^\n]+)")
    faltando = [nome for nome, valor in (("número do CA", ca_numero), ("validade", validade), ("equipamento", equipamento)) if not valor]
    if faltando:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=f"Não foi possível identificar no CA: {', '.join(faltando)}.")

    aprovado_para = _campo(texto, r"Aprovado para:\s*(.+?)(?:\n\s*(?:Observa|Marca[çc][ãa]o|Refer[êe]ncias)|$)")
    fabricante = _campo(texto, r"Empresa:\s*([^\n]+)")
    marca = _marca(fabricante)
    return {
        # padrão de nome do EPI: "equipamento - marca"
        "nome": f"{equipamento} - {marca}" if marca else equipamento,
        "ca_numero": re.sub(r"\D", "", ca_numero),
        "grupo_protecao": _grupo_protecao(aprovado_para, equipamento),
        "data_validade_ca": datetime.strptime(validade, "%d/%m/%Y").date(),
        "situacao": _campo(texto, r"\b(V[ÁA]LIDO|VENCIDO|SUSPENSO|CANCELADO)\b"),
        "aprovado_para": aprovado_para,
        "fabricante": fabricante,
    }

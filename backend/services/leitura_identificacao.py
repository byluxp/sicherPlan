"""Leitura de documento de identificação (RG, CNH) em PDF, PNG ou JPG.

PDF com texto é lido diretamente; PDF digitalizado e imagens passam por OCR local
(Tesseract), sem enviar o documento para serviços externos. Os campos são extraídos
por regras: o CPF é validado pelo dígito verificador e a data de nascimento é a data
mais antiga plausível do documento.
"""

import io
import os
import re
import unicodedata
from concurrent.futures import ThreadPoolExecutor
from datetime import date

import pymupdf
import pytesseract
from fastapi import HTTPException, status
from PIL import Image, ImageOps, UnidentifiedImageError

from services.leitura_ca import extrair_texto_pdf

LARGURA_MINIMA_OCR = 2000
DPI_PDF_DIGITALIZADO = 300
TAMANHO_MINIMO_IMAGEM_EMBUTIDA = 300  # px; ignora ícones, logos e QR codes pequenos
# o OCR roda várias imagens em paralelo; um thread por processo do Tesseract é mais rápido que o padrão
os.environ.setdefault("OMP_THREAD_LIMIT", "1")
# linhas com "NOME" que não são o nome do titular
ROTULOS_NOME_IGNORADOS = ("pai", "mae", "social", "filiacao", "naturalidade")
# textos fixos de RG/CNH que não podem ser confundidos com o nome do titular
PALAVRAS_DE_CABECALHO = (
    r"\b(republica|federativa|brasil|carteira|nacional|habilitacao|identidade|registro|geral|ministerio|"
    r"departamento|secretaria|estado|transito|denatran|senatran|detran|instituto|identificacao|seguranca|"
    r"publica|valida|territorio|filiacao|naturalidade|assinatura|titular|permissao|categoria|observacoes|"
    r"documento|nome|data|local|emissao|validade|expedicao|doc|policia|civil)\b"
)
# troca de letras que o OCR costuma confundir com dígitos (usada só na busca do CPF)
CORRECOES_OCR_DIGITOS = str.maketrans({"O": "0", "o": "0", "D": "0", "I": "1", "l": "1", "|": "1", "S": "5", "B": "8", "Z": "2"})


def _sem_acentos(texto: str) -> str:
    return unicodedata.normalize("NFD", texto).encode("ascii", "ignore").decode().lower()


def _tipo_arquivo(conteudo: bytes) -> str:
    if conteudo.startswith(b"%PDF"):
        return "pdf"
    if conteudo.startswith(b"\x89PNG") or conteudo.startswith(b"\xff\xd8\xff"):
        return "imagem"
    raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Envie um arquivo PDF, PNG ou JPG.")


def _preparar_imagem(imagem: Image.Image) -> Image.Image:
    # corrige rotação de foto de celular, converte para tons de cinza, amplia e realça o contraste
    imagem = ImageOps.exif_transpose(imagem).convert("L")
    if imagem.width < LARGURA_MINIMA_OCR:
        escala = LARGURA_MINIMA_OCR / imagem.width
        imagem = imagem.resize((LARGURA_MINIMA_OCR, int(imagem.height * escala)), Image.LANCZOS)
    return ImageOps.autocontrast(imagem, cutoff=1)


def _ocr(imagens: list[Image.Image]) -> str:
    try:
        idiomas = pytesseract.get_languages()
    except pytesseract.TesseractNotFoundError:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Leitura de imagem indisponível: instale o OCR no servidor (sudo apt install tesseract-ocr tesseract-ocr-por).",
        )
    if "por" not in idiomas:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Leitura de imagem indisponível: instale o idioma português do OCR (sudo apt install tesseract-ocr-por).",
        )
    # cada imagem roda num processo do Tesseract em paralelo
    with ThreadPoolExecutor(max_workers=min(len(imagens), os.cpu_count() or 1)) as executor:
        textos = executor.map(lambda imagem: pytesseract.image_to_string(_preparar_imagem(imagem), lang="por"), imagens)
        return "\n".join(textos)


def _imagens_da_pagina(pdf: pymupdf.Document, pagina: pymupdf.Page) -> list[Image.Image]:
    # usa as imagens embutidas na resolução original (ex.: frente/verso da CNH-e, página escaneada);
    # se a página não tiver imagem grande, renderiza a página inteira
    imagens = []
    for info in pagina.get_images(full=True):
        try:
            imagem = Image.open(io.BytesIO(pdf.extract_image(info[0])["image"]))
        except (UnidentifiedImageError, ValueError, RuntimeError):
            continue
        if min(imagem.size) >= TAMANHO_MINIMO_IMAGEM_EMBUTIDA:
            imagens.append(imagem)
    if imagens:
        return imagens
    return [Image.open(io.BytesIO(pagina.get_pixmap(dpi=DPI_PDF_DIGITALIZADO).tobytes("png")))]


def _ocr_pdf(conteudo: bytes) -> str:
    with pymupdf.open(stream=conteudo, filetype="pdf") as pdf:
        imagens = [imagem for pagina in pdf for imagem in _imagens_da_pagina(pdf, pagina)]
    return _ocr(imagens)


def _ocr_imagem(conteudo: bytes) -> str:
    try:
        return _ocr([Image.open(io.BytesIO(conteudo))])
    except UnidentifiedImageError:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Não foi possível abrir a imagem. O arquivo pode estar corrompido.")


def cpf_valido(cpf: str) -> bool:
    if len(cpf) != 11 or cpf == cpf[0] * 11:
        return False
    for tamanho in (9, 10):
        soma = sum(int(cpf[i]) * (tamanho + 1 - i) for i in range(tamanho))
        digito = (soma * 10) % 11 % 10
        if digito != int(cpf[tamanho]):
            return False
    return True


def _cpf(texto: str) -> str | None:
    # lookahead para testar candidatos sobrepostos e sem atravessar linhas: o OCR pode colar o fim
    # de outra data/número ao CPF, e uma busca comum consumiria os dígitos do CPF verdadeiro
    padrao = r"(?<!\d)(?=(\d{3} ?[.,]? ?\d{3} ?[.,]? ?\d{3} ?[-–.,/]? ?\d{2}))"
    for variante in (texto, texto.translate(CORRECOES_OCR_DIGITOS)):
        for candidato in re.findall(padrao, variante):
            digitos = re.sub(r"\D", "", candidato)
            if cpf_valido(digitos):
                return digitos
    return None


def _datas(texto: str) -> list[date]:
    datas = []
    for dia, mes, ano in re.findall(r"\b(\d{2})\s?[/.-]\s?(\d{2})\s?[/.-]\s?(\d{4})\b", texto):
        try:
            datas.append(date(int(ano), int(mes), int(dia)))
        except ValueError:
            continue
    return datas


def _data_nascimento(texto: str) -> date | None:
    hoje = date.today()

    def idade(valor: date) -> int:
        return hoje.year - valor.year - ((hoje.month, hoje.day) < (valor.month, valor.day))

    # prioriza a data logo após o rótulo de nascimento; senão, a data mais antiga plausível (RG e CNH
    # também trazem expedição, validade e 1ª habilitação, todas posteriores ao nascimento).
    # As correções de OCR (ex.: "3O/O1/2OOO") são aplicadas só ao trecho das datas, não ao rótulo.
    rotulo = re.search(r"nasc\w*", _sem_acentos(texto))
    trecho = texto[rotulo.end():rotulo.end() + 60].translate(CORRECOES_OCR_DIGITOS) if rotulo else ""
    candidatas = [valor for valor in _datas(trecho) if 14 <= idade(valor) <= 100]
    if candidatas:
        return candidatas[0]
    todas = _datas(texto) + _datas(texto.translate(CORRECOES_OCR_DIGITOS))
    plausiveis = [valor for valor in todas if 14 <= idade(valor) <= 100]
    return min(plausiveis) if plausiveis else None


def _limpar_nome(linha: str) -> str | None:
    nome = re.sub(r"[^A-Za-zÀ-ÿ' ]", " ", linha)
    nome = " ".join(palavra for palavra in nome.split() if len(palavra) > 1 or palavra.lower() in ("e",))
    return nome.upper() if len(nome.split()) >= 2 else None


def _nome(texto: str, documento_reconhecido: bool) -> str | None:
    linhas = [linha.strip() for linha in texto.splitlines() if linha.strip()]
    for indice, linha in enumerate(linhas):
        normalizada = _sem_acentos(linha)
        if not re.search(r"\bnome\b", normalizada) or any(rotulo in normalizada for rotulo in ROTULOS_NOME_IGNORADOS):
            continue
        # nome na mesma linha do rótulo (ex.: "NOME: JOÃO DA SILVA") ou na linha seguinte
        depois_do_rotulo = re.split(r"(?i)nome(?:\s+e\s+sobrenome)?\s*[:\-]?", linha, maxsplit=1)[-1]
        for opcao in (depois_do_rotulo, *(linhas[indice + 1:indice + 3])):
            nome = _limpar_nome(opcao)
            if nome and not re.search(r"\b(nome|data|cpf|registro|nascimento)\b", _sem_acentos(nome)):
                return nome

    # em foto ruim o OCR perde os rótulos (letra pequena e clara); o nome do titular é então
    # a primeira linha só de letras, com 2+ palavras, que não é cabeçalho do documento.
    # Só vale se o OCR reconheceu o documento como RG/CNH; senão, a linha tende a ser lixo de leitura.
    if not documento_reconhecido:
        return None
    for linha in linhas:
        if re.search(r"\d", linha) or re.search(PALAVRAS_DE_CABECALHO, _sem_acentos(linha)):
            continue
        nome = _limpar_nome(linha)
        if nome and len(nome.split()) >= 2 and nome.replace(" ", "").isalpha():
            return nome
    return None


def _tipo_documento(texto: str) -> str:
    normalizado = _sem_acentos(texto)
    if "habilitacao" in normalizado:
        return "CNH"
    if "identidade" in normalizado or "registro geral" in normalizado:
        return "RG"
    return "Não identificado"


ROTULOS_CAMPOS = {"nome": "nome", "cpf": "CPF", "data_nascimento": "data de nascimento"}


def _extrair_campos(texto: str) -> dict:
    tipo_documento = _tipo_documento(texto)
    dados = {
        "tipo_documento": tipo_documento,
        "nome": _nome(texto, documento_reconhecido=tipo_documento != "Não identificado"),
        "cpf": _cpf(texto),
        "data_nascimento": _data_nascimento(texto),
    }
    dados["campos_nao_encontrados"] = [rotulo for campo, rotulo in ROTULOS_CAMPOS.items() if not dados[campo]]
    return dados


def ler_documento_identificacao(conteudo: bytes) -> dict:
    if _tipo_arquivo(conteudo) == "pdf":
        # PDF: tenta primeiro a camada de texto. Se faltar algum campo, roda o OCR na página
        # renderizada: PDFs como a CNH-e têm texto só no cabeçalho e os dados dentro de imagens.
        texto = extrair_texto_pdf(conteudo)
        dados = _extrair_campos(texto)
        if dados["campos_nao_encontrados"]:
            texto = f"{_ocr_pdf(conteudo)}\n{texto}"
            dados = _extrair_campos(texto)
    else:
        texto = _ocr_imagem(conteudo)
        dados = _extrair_campos(texto)

    if not texto.strip():
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Não foi possível ler texto no documento. Envie uma imagem mais nítida, sem reflexo e bem enquadrada.",
        )
    if len(dados["campos_nao_encontrados"]) == len(ROTULOS_CAMPOS):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Nenhum dado de identificação encontrado. Confira se é um RG ou CNH legível e bem enquadrado.",
        )
    return dados

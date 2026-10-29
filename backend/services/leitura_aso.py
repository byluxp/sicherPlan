"""Leitura do ASO (Atestado de Saúde Ocupacional) em PDF, PNG ou JPG.

Mesmo esquema da leitura do documento de identificação: primeiro a leitura local (camada de
texto do PDF ou OCR), que não gasta tokens; se faltar algum campo e GEMINI_API_KEY estiver
configurada, o documento vai para a IA, que lida melhor com os vários modelos de ASO das clínicas.
O resultado passa sempre pela mesma validação (CPF, datas plausíveis) antes de ir para a tela.
"""

import logging
import re
from datetime import date, timedelta

from fastapi import HTTPException, status

from services import ia_documentos
from services.leitura_ca import extrair_texto_pdf
from services.leitura_identificacao import _cpf, _mime_type, _ocr_imagem, _ocr_pdf, _sem_acentos, _tipo_arquivo, cpf_valido

logger = logging.getLogger(__name__)

ROTULOS_CAMPOS = {
    "nome": "nome",
    "tipo": "tipo do ASO",
    "data_emissao": "data de liberação",
    "resultado": "resultado (apto ou inapto)",
    "exames": "exames realizados",
}
# texto sem acentos e em minúsculas -> tipo gravado no banco
TIPOS = {
    r"admissional": "Admissional",
    r"periodico": "Periódico",
    r"retorno ao trabalho": "Retorno ao trabalho",
    r"mudanca de (risco|funcao)": "Mudança de risco ocupacional",
    r"demissional": "Demissional",
}
EXAMES_CONHECIDOS = (
    "exame clinico", "avaliacao clinica", "audiometria", "acuidade visual", "espirometria", "hemograma",
    "glicemia", "eletrocardiograma", "ecg", "eletroencefalograma", "eeg", "raio", "rx", "toxicologico",
    "psicossocial", "avaliacao psicologica", "urina", "parasitologico", "gama gt", "creatinina", "colesterol",
)
MARCA = r"[\(\[]\s*[xX✓✔■●]\s*[\)\]]"
CAIXA = r"[\(\[]\s*[xX✓✔■●]?\s*[\)\]]"
DATA = r"(\d{2})\s?[/.-]\s?(\d{2})\s?[/.-]\s?(\d{4})"


def _data_plausivel(valor: date | None) -> date | None:
    # ASO de até 5 anos atrás; a liberação pode ser hoje, nunca no futuro (1 dia de folga por fuso)
    if valor and date.today() - timedelta(days=5 * 366) <= valor <= date.today() + timedelta(days=1):
        return valor
    return None


def _data_de(texto: str) -> date | None:
    achado = re.search(DATA, texto)
    if not achado:
        return None
    dia, mes, ano = map(int, achado.groups())
    try:
        return _data_plausivel(date(ano, mes, dia))
    except ValueError:
        return None


def _data_iso(valor: str | None) -> date | None:
    try:
        return _data_plausivel(date.fromisoformat(valor)) if valor else None
    except ValueError:
        return None


def _opcao_marcada(texto: str, opcoes: dict[str, str]) -> str | None:
    # modelo com as opções impressas: vale a marcada; sem marcação, a única opção citada no texto.
    # A caixa pode vir antes da opção, "( ) Admissional (X) Periódico", ou depois, "Admissional ( ) Periódico (X)";
    # o lado em que há mais caixas define o formato do documento
    antes, depois = r"{caixa}\s*\b{padrao}\b", r"\b{padrao}\b\s*:?\s*{caixa}"
    contar = lambda formato: sum(bool(re.search(formato.format(caixa=CAIXA, padrao=padrao), texto)) for padrao in opcoes)
    formato = antes if contar(antes) >= contar(depois) else depois
    marcados = {valor for padrao, valor in opcoes.items() if re.search(formato.format(caixa=MARCA, padrao=padrao), texto)}
    if len(marcados) == 1:
        return marcados.pop()
    if contar(antes) or contar(depois):
        return None  # há caixas, mas nenhuma (ou mais de uma) marcada
    citados = {valor for padrao, valor in opcoes.items() if re.search(fr"\b{padrao}\b", texto)}
    return citados.pop() if len(citados) == 1 else None


def _tipo(texto: str) -> str | None:
    return _opcao_marcada(texto, TIPOS)


def _apto_ou_inapto(trecho: str) -> str | None:
    return _opcao_marcada(trecho, {"apto": "apto", "inapto": "inapto"})


def _resultado(texto: str) -> str | None:
    linhas = [linha for linha in texto.splitlines() if "altura" not in linha]
    valor = _apto_ou_inapto("\n".join(linhas))
    return valor.capitalize() if valor else None


def _apto_altura(texto: str) -> bool | None:
    linhas = [linha for linha in texto.splitlines() if "altura" in linha]
    valor = _apto_ou_inapto("\n".join(linhas))
    return None if valor is None else valor == "apto"


def _nome(texto_original: str) -> str | None:
    rotulo = r"(?:nome(?: do (?:funcionario|colaborador|empregado|trabalhador|paciente))?|funcionario|colaborador|empregado|trabalhador|paciente)"
    for linha in texto_original.splitlines():
        achado = re.match(fr"\s*{rotulo}\s*[:\-]\s*(.+)", _sem_acentos(linha))
        if not achado:
            continue
        # recorta o valor na linha original (com acentos) e para antes do próximo rótulo (CPF, RG, função...)
        valor = linha[len(linha) - len(achado.group(1)):]
        valor = re.split(r"\s{2,}|\b(?:CPF|RG|Fun[cç][aã]o|Cargo|Data|Idade|Sexo|Matr[ií]cula)\b", valor, flags=re.IGNORECASE)[0]
        valor = " ".join(re.sub(r"[^A-Za-zÀ-ÿ' ]", " ", valor).split()).upper()
        if len(valor.split()) >= 2:
            return valor
    return None


def _data_rotulada(texto: str, rotulos: str) -> date | None:
    for linha in texto.splitlines():
        if re.search(rotulos, linha):
            valor = _data_de(linha)
            if valor:
                return valor
    return None


def _exames(texto: str) -> list[dict]:
    exames = []
    for linha in texto.splitlines():
        if not any(re.search(fr"\b{exame}\b", linha) for exame in EXAMES_CONHECIDOS):
            continue
        nome = " ".join(re.sub(fr"{DATA}|[^a-z0-9 ]", " ", linha).split())
        if nome and len(nome) <= 60:
            exames.append({"nome": nome.capitalize(), "data": _data_de(linha)})
    return exames


def _extrair_campos(texto_original: str) -> dict:
    texto = _sem_acentos(texto_original)
    datas = [d for d in (_data_de(m.group(0)) for m in re.finditer(DATA, texto)) if d]
    data_emissao = _data_rotulada(texto, r"emiss|liberad|emitido") or (max(datas) if datas else None)
    dados = {
        "nome": _nome(texto_original),
        "cpf": _cpf(texto_original),
        "tipo": _tipo(texto),
        "data_exame": _data_rotulada(texto, r"data do exame|realizado em|data da consulta"),
        "data_emissao": data_emissao,
        "exames": _exames(texto),
        "resultado": _resultado(texto),
        "apto_trabalho_altura": _apto_altura(texto),
    }
    dados["campos_nao_encontrados"] = [rotulo for campo, rotulo in ROTULOS_CAMPOS.items() if not dados[campo]]
    return dados


def _ler_com_ocr(conteudo: bytes) -> dict:
    if _tipo_arquivo(conteudo) == "pdf":
        texto = extrair_texto_pdf(conteudo)
        # PDF digitalizado não tem camada de texto
        if len(texto.strip()) < 50:
            texto = _ocr_pdf(conteudo)
    else:
        texto = _ocr_imagem(conteudo)
    dados = _extrair_campos(texto)
    dados["metodo_leitura"] = "ocr"
    dados["avisos"] = []
    return dados


def _ler_com_ia(conteudo: bytes) -> dict:
    lido = ia_documentos.ler_aso_com_ia(conteudo, _mime_type(conteudo))
    if not lido.documento_e_aso:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="O arquivo não parece ser um ASO legível.")
    avisos = []
    cpf = re.sub(r"\D", "", lido.cpf or "") or None
    if cpf and not cpf_valido(cpf):
        avisos.append("O CPF lido no ASO não passou na validação do dígito verificador.")
        cpf = None
    datas_ignoradas = [valor for valor in (lido.data_exame, lido.data_emissao) if valor and not _data_iso(valor)]
    if datas_ignoradas:
        avisos.append("Alguma data lida não é plausível (futura ou com mais de 5 anos) e foi deixada em branco.")
    dados = {
        "nome": " ".join((lido.nome or "").split()).upper() or None,
        "cpf": cpf,
        "tipo": lido.tipo,
        "data_exame": _data_iso(lido.data_exame),
        "data_emissao": _data_iso(lido.data_emissao),
        "exames": [{"nome": exame.nome.strip(), "data": _data_iso(exame.data)} for exame in lido.exames if exame.nome.strip()],
        "resultado": lido.resultado,
        "apto_trabalho_altura": lido.apto_trabalho_altura,
        "metodo_leitura": "ia",
        "avisos": avisos,
    }
    dados["campos_nao_encontrados"] = [rotulo for campo, rotulo in ROTULOS_CAMPOS.items() if not dados[campo]]
    return dados


def ler_aso(conteudo: bytes) -> dict:
    _tipo_arquivo(conteudo)  # recusa arquivo que não é PDF, PNG ou JPG antes de qualquer leitura

    try:
        dados = _ler_com_ocr(conteudo)
    except HTTPException as erro:
        # Tesseract não instalado: com IA configurada, ela assume a leitura
        if erro.status_code != status.HTTP_503_SERVICE_UNAVAILABLE or not ia_documentos.ia_configurada():
            raise
        dados = None

    if (dados is None or dados["campos_nao_encontrados"]) and ia_documentos.ia_configurada():
        try:
            dados_ia = _ler_com_ia(conteudo)
            # campo que a IA não leu, mas a leitura local sim, é aproveitado
            if dados:
                for campo in ("nome", "cpf", "tipo", "data_exame", "data_emissao", "exames", "resultado", "apto_trabalho_altura"):
                    if dados_ia[campo] in (None, []) and dados[campo] not in (None, []):
                        dados_ia[campo] = dados[campo]
                dados_ia["campos_nao_encontrados"] = [rotulo for campo, rotulo in ROTULOS_CAMPOS.items() if not dados_ia[campo]]
            dados = dados_ia
        except HTTPException:
            raise
        except Exception:
            logger.exception("Falha na leitura do ASO com IA; mantido o resultado da leitura local")
            if dados is None:
                raise HTTPException(
                    status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                    detail="Leitura indisponível no momento. Tente novamente ou preencha os dados manualmente.",
                )
            dados["avisos"].append("A leitura por IA não respondeu; os campos em branco precisam ser preenchidos manualmente.")

    if len(dados["campos_nao_encontrados"]) == len(ROTULOS_CAMPOS):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Nenhum dado de ASO encontrado. Confira se o arquivo é o ASO e se está legível.",
        )
    return dados

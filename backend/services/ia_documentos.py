"""Leitura de documentos com IA multimodal (Gemini).

Usada só quando o OCR local não encontra todos os campos e GEMINI_API_KEY está configurada,
para economizar tokens. A IA lida com casos em que o OCR falha (foto girada, letra pequena,
fundo poluído, documento dentro de um print de celular).
O resultado sempre passa pela validação local (CPF, datas) antes de ir para a tela.

LGPD: o documento é enviado ao Google. Use uma chave de projeto com faturamento ativo;
no nível gratuito da API, o Google pode usar os dados enviados para melhorar seus produtos.
"""

import base64
import io
import logging
import os
from typing import Literal, Optional

from PIL import Image, ImageOps
from pydantic import BaseModel, Field

logger = logging.getLogger(__name__)

# flash-lite leu corretamente RG/CIN/CNH reais (foto girada, print de celular, CNH-e impressa)
# em 2 a 15 s; o gemini-3.8-flash raciocina por padrão e passou de 60 s na mesma tarefa
MODELO_PADRAO = "gemini-3.5-flash-lite"
# leituras normais levam até ~15 s; acima disso a API está lenta e o OCR local assume
TEMPO_LIMITE_SEGUNDOS = 30

PROMPT_IDENTIFICACAO = """Você recebe um documento de identificação brasileiro: RG, Carteira de Identidade \
Nacional (CIN), CNH ou CNH digital. Pode ser foto de celular girada ou torta, digitalização, print de tela \
ou PDF; o documento pode ocupar só parte da imagem.

Extraia SOMENTE dados do titular do documento:
- nome: nome completo do titular, em maiúsculas. Não use nome do pai, da mãe (filiação), nome social, \
assinatura nem nome do órgão ou do diretor que emitiu.
- cpf: só os 11 dígitos, sem pontos ou traço. Na CIN o CPF aparece como "Registro Geral - CPF".
- data_nascimento: no formato AAAA-MM-DD. Não confunda com data de emissão, validade ou 1ª habilitação.

Se um campo estiver ilegível ou ausente, devolva null. Nunca invente nem complete dígitos que você não leu."""


class DocumentoIdentificacaoIA(BaseModel):
    documento_legivel: bool = Field(description="false se a imagem não permite ler o documento")
    tipo_documento: Literal["RG", "CIN", "CNH", "Outro"]
    nome: Optional[str] = Field(default=None, description="Nome completo do titular")
    cpf: Optional[str] = Field(default=None, description="CPF do titular, 11 dígitos sem pontuação")
    data_nascimento: Optional[str] = Field(default=None, description="Data de nascimento AAAA-MM-DD")


def ia_configurada() -> bool:
    return bool(os.getenv("GEMINI_API_KEY"))


def _imagem_como_pdf(conteudo: bytes) -> bytes:
    # a mesma foto enviada como PDF de 1 página custa ~540 tokens, contra ~1.060 como imagem
    with Image.open(io.BytesIO(conteudo)) as imagem:
        buffer = io.BytesIO()
        ImageOps.exif_transpose(imagem).convert("RGB").save(buffer, "PDF", resolution=150)
    return buffer.getvalue()


def ler_identificacao_com_ia(conteudo: bytes, mime_type: str) -> DocumentoIdentificacaoIA:
    # import local: o SDK só é carregado quando a IA está configurada
    from google import genai

    pdf = conteudo if mime_type == "application/pdf" else _imagem_como_pdf(conteudo)
    cliente = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))
    interacao = cliente.interactions.create(
        model=os.getenv("GEMINI_MODEL", MODELO_PADRAO),
        input=[
            {"type": "text", "text": PROMPT_IDENTIFICACAO},
            {"type": "document", "data": base64.b64encode(pdf).decode("ascii"), "mime_type": "application/pdf"},
        ],
        response_format={
            "type": "text",
            "mime_type": "application/json",
            "schema": DocumentoIdentificacaoIA.model_json_schema(),
        },
        timeout=TEMPO_LIMITE_SEGUNDOS,
    )
    if interacao.usage:
        logger.info("Leitura de documento por IA: %s tokens", interacao.usage.total_tokens)
    return DocumentoIdentificacaoIA.model_validate_json(interacao.output_text)

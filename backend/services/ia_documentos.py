"""Leitura de documentos com IA multimodal (Gemini).

Usada só quando o OCR local não encontra todos os campos e GEMINI_API_KEY está configurada,
para economizar tokens. A IA lida com casos em que o OCR falha (foto girada, letra pequena,
fundo poluído, documento dentro de um print de celular).
O resultado sempre passa pela validação local (CPF, datas) antes de ir para a tela.

LGPD: o documento é enviado ao Google. Use uma chave de projeto com faturamento ativo;
no nível gratuito da API, o Google pode usar os dados enviados para melhorar seus produtos.
O ASO tem dado de saúde (dado sensível): vale ainda mais a regra da chave com faturamento.
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


PROMPT_ASO = """Você recebe um ASO (Atestado de Saúde Ocupacional) brasileiro emitido por uma clínica de \
medicina do trabalho, conforme a NR-7. Pode ser PDF digital, digitalização ou foto.

Extraia os dados deste ASO:
- nome: nome completo do trabalhador (não do médico nem da empresa), em maiúsculas.
- cpf: CPF do trabalhador, só os 11 dígitos. null se o ASO não trouxer.
- tipo: o tipo de exame marcado no ASO (Admissional, Periódico, Retorno ao trabalho, \
Mudança de risco ocupacional ou Demissional). "Mudança de função" conta como Mudança de risco ocupacional. \
Se as opções aparecem impressas, use só a que estiver marcada (X, check, preenchida).
- data_exame: data do exame clínico, AAAA-MM-DD.
- data_emissao: data em que o ASO foi emitido e liberado pelo médico (perto da assinatura), AAAA-MM-DD.
- exames: cada exame realizado (exame clínico e complementares, como audiometria, acuidade visual, \
espirometria, hemograma, glicemia, ECG, EEG, raio-X, avaliação psicossocial), com a data de cada um \
em AAAA-MM-DD (null se não houver data). Não inclua riscos ocupacionais nem a lista de agentes.
- resultado: "Apto" ou "Inapto" para a função, conforme a conclusão marcada pelo médico.
- apto_trabalho_altura: true se o ASO declara apto para trabalho em altura, false se declara inapto, \
null se o ASO não fala de trabalho em altura.

Se um campo estiver ilegível ou ausente, devolva null. Nunca invente datas ou exames que você não leu."""


class ExameIA(BaseModel):
    nome: str
    data: Optional[str] = Field(default=None, description="Data do exame AAAA-MM-DD")


class AsoIA(BaseModel):
    documento_e_aso: bool = Field(description="false se o arquivo não é um ASO legível")
    nome: Optional[str] = Field(default=None, description="Nome completo do trabalhador")
    cpf: Optional[str] = Field(default=None, description="CPF do trabalhador, 11 dígitos sem pontuação")
    tipo: Optional[Literal["Admissional", "Periódico", "Retorno ao trabalho", "Mudança de risco ocupacional", "Demissional"]] = None
    data_exame: Optional[str] = Field(default=None, description="Data do exame clínico AAAA-MM-DD")
    data_emissao: Optional[str] = Field(default=None, description="Data de emissão/liberação do ASO AAAA-MM-DD")
    exames: list[ExameIA] = []
    resultado: Optional[Literal["Apto", "Inapto"]] = None
    apto_trabalho_altura: Optional[bool] = None


def ia_configurada() -> bool:
    return bool(os.getenv("GEMINI_API_KEY"))


def _imagem_como_pdf(conteudo: bytes) -> bytes:
    # a mesma foto enviada como PDF de 1 página custa ~540 tokens, contra ~1.060 como imagem
    with Image.open(io.BytesIO(conteudo)) as imagem:
        buffer = io.BytesIO()
        ImageOps.exif_transpose(imagem).convert("RGB").save(buffer, "PDF", resolution=150)
    return buffer.getvalue()


def _ler_documento(conteudo: bytes, mime_type: str, prompt: str, modelo: type[BaseModel]):
    # import local: o SDK só é carregado quando a IA está configurada
    from google import genai

    pdf = conteudo if mime_type == "application/pdf" else _imagem_como_pdf(conteudo)
    cliente = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))
    interacao = cliente.interactions.create(
        model=os.getenv("GEMINI_MODEL", MODELO_PADRAO),
        input=[
            {"type": "text", "text": prompt},
            {"type": "document", "data": base64.b64encode(pdf).decode("ascii"), "mime_type": "application/pdf"},
        ],
        response_format={
            "type": "text",
            "mime_type": "application/json",
            "schema": modelo.model_json_schema(),
        },
        timeout=TEMPO_LIMITE_SEGUNDOS,
    )
    if interacao.usage:
        logger.info("Leitura de documento por IA (%s): %s tokens", modelo.__name__, interacao.usage.total_tokens)
    return modelo.model_validate_json(interacao.output_text)


def ler_identificacao_com_ia(conteudo: bytes, mime_type: str) -> DocumentoIdentificacaoIA:
    return _ler_documento(conteudo, mime_type, PROMPT_IDENTIFICACAO, DocumentoIdentificacaoIA)


def ler_aso_com_ia(conteudo: bytes, mime_type: str) -> AsoIA:
    return _ler_documento(conteudo, mime_type, PROMPT_ASO, AsoIA)

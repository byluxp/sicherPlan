from pydantic import BaseModel, Field, field_validator
from typing import Literal, Optional
from datetime import datetime, date
import re

#-------------------Setor-------------------
class SetorBase(BaseModel):
    nome: str
    descricao: Optional[str] = None
    ativo: Optional[bool] = True

class SetorCreate(SetorBase):
    pass

class SetorResponse(SetorBase):
    id: int
    criado_em: datetime

    class Config:
        from_attributes = True
           
#-------------------Funcao-------------------
class FuncaoBase(BaseModel):
    nome: str
    setor_id: int
    descricao: Optional[str] = None
    ativo: Optional[bool] = True

class FuncaoCreate(FuncaoBase):
    pass

class FuncaoResponse(FuncaoBase):
    id: int
    criado_em: datetime

    class Config:
        from_attributes = True
        
#-------------------Colaborador-------------------
class ColaboradorBase(BaseModel):
    nome: str
    cpf: str
    data_nascimento : Optional[date] = None
    data_admissao : date
    data_demissao : Optional[date] = None
    setor_id : int
    funcao_id : int
    ativo: Optional[bool] = True
    
    
    # Limpa e valida a quantidade de numeros do CPF
    @field_validator('cpf')
    @classmethod
    def validar_cpf(cls, v: str) -> str:
        # Remove caracteres nao numericos
        cpf_limpo = re.sub(r'\D', '', v)
        if len(cpf_limpo) != 11:
            raise ValueError('O CPF deve conter exatamente 11 numeros.')
        return cpf_limpo

class ColaboradorCreate(ColaboradorBase):
    pass #Herda da modelo da base

class ColaboradorResponse(ColaboradorBase):
    id: int
    criado_em: datetime

    class Config:
        from_attributes = True

# Dados lidos do documento de identificação, devolvidos para conferência antes de salvar
class ColaboradorImportacaoDocumentoResponse(BaseModel):
    tipo_documento: str
    nome: Optional[str] = None
    cpf: Optional[str] = None
    data_nascimento: Optional[date] = None
    campos_nao_encontrados: list[str]
    colaborador_existente: Optional[ColaboradorResponse] = None

#-------------------EPI-------------------
class EpiBase(BaseModel):
    nome: str
    grupo_protecao: str
    ca_numero: str
    data_validade_ca: date
    durabilidade_dias: Optional[int] = None
    url_pdf_ca: Optional[str] = None
    ativo: Optional[bool] = True

class EpiCreate(EpiBase):
    pass

class EpiResponse(EpiBase):
    id: int
    criado_em: datetime

    class Config:
        from_attributes = True

# Dados lidos do PDF do CA, devolvidos para conferência antes de salvar
class EpiImportacaoCAResponse(BaseModel):
    nome: str
    ca_numero: str
    grupo_protecao: Optional[str] = None
    data_validade_ca: date
    situacao: Optional[str] = None
    aprovado_para: Optional[str] = None
    fabricante: Optional[str] = None
    epi_existente: Optional[EpiResponse] = None
        
#-------------------Obrigatorio-------------------
class FuncaoEpiObrigatorioBase(BaseModel):
    funcao_id: int
    epi_id: int

class FuncaoEpiObrigatorioCreate(FuncaoEpiObrigatorioBase):
    pass

class FuncaoEpiObrigatorioResponse(FuncaoEpiObrigatorioBase):
    id: int
    criado_em: datetime

    class Config:
        from_attributes = True
        
#-------------------Entrega EPI-------------------
        
class EntregaEpiBase(BaseModel):
    colaborador_id: int
    epi_id: int
    quantidade: int = 1
    data_entrega: date
    assinado: Optional[bool] = False
    observacao: Optional[str] = None

class EntregaEpiCreate(EntregaEpiBase):
    pass

class EntregaEpiResponse(EntregaEpiBase):
    id: int
    criado_em: datetime
    atualizado_em: datetime

    class Config:
        from_attributes = True

#-------------------Historico Funcao-------------------
class HistoricoFuncaoBase(BaseModel):
    colaborador_id: int
    funcao_id: int
    setor_id: int
    data_inicio: datetime
    data_fim: Optional[datetime] = None
    motivo_mudanca: Optional[str] = None

class HistoricoFuncaoCreate(HistoricoFuncaoBase):
    pass

class HistoricoFuncaoResponse(HistoricoFuncaoBase):
    id: int
    criado_em: datetime

    class Config:
        from_attributes = True
        
#-------------------Aso-------------------
class AsoBase(BaseModel):
    colaborador_id: int
    tipo: str
    data_emissao: datetime
    data_vencimento: datetime
    url_documento: Optional[str] = None
    observacao: Optional[str] = None

class AsoCreate(AsoBase):
    pass

class AsoResponse(AsoBase):
    id: int
    criado_em: datetime

    class Config:
        from_attributes = True
        
#-------------------Certificado-------------------
class CertificadoBase(BaseModel):
    nome: str
    nr_codigo: Optional[str] = None
    carga_horaria: Optional[int] = None
    validade_meses: Optional[int] = None
    descricao: Optional[str] = None

class CertificadoCreate(CertificadoBase):
    pass

class CertificadoResponse(CertificadoBase):
    id: int
    criado_em: datetime

    class Config:
        from_attributes = True
        
#-------------------Colaborador Certificado-------------------

class ColaboradorCertificadoBase(BaseModel):
    colaborador_id: int
    certificado_id: int
    data_conclusao: datetime
    data_vencimento: Optional[datetime] = None
    url_certificado: Optional[str] = None

class ColaboradorCertificadoCreate(ColaboradorCertificadoBase):
    pass

class ColaboradorCertificadoResponse(ColaboradorCertificadoBase):
    id: int
    criado_em: datetime

    class Config:
        from_attributes = True

class GerarCertificadoRequest(BaseModel):
    colaborador_id: int
    nr_codigo: Literal["NR-06", "NR-12", "NR-18", "NR-35"]
    data_conclusao: date

class GerarCertificadoResponse(ColaboradorCertificadoResponse):
    treinamento_id: int

#-------------------Treinamento-------------------
class TreinamentoCreate(BaseModel):
    colaborador_id: int
    certificado_id: int
    data_emissao: date
    colaborador_certificado_id: Optional[int] = None

class TreinamentoResponse(TreinamentoCreate):
    id: int
    criado_em: datetime

    class Config:
        from_attributes = True

# Item do histórico: o primeiro treinamento de cada certificado é o inicial, os seguintes são reciclagens
class TreinamentoHistoricoResponse(TreinamentoResponse):
    nr_codigo: Optional[str] = None
    nome_certificado: str
    tipo: Literal["inicial", "reciclagem"]
    data_vencimento: Optional[date] = None
    url_certificado: Optional[str] = None

#-------------------Geração de Documento (Certificado Word)-------------------
class CertificadoDocumentoDados(BaseModel):
    nome_colaborador: str
    cpf: str
    funcao_colaborador: str
    data_conclusao: date

#-------------------Ordem Servico-------------------
class OrdemServicoBase(BaseModel):
    colaborador_id: int
    titulo: str
    data_emissao: datetime
    assinado: Optional[bool] = False
    url_documento: Optional[str] = None

class OrdemServicoCreate(OrdemServicoBase):
    pass

class OrdemServicoResponse(OrdemServicoBase):
    id: int
    criado_em: datetime

    class Config:
        from_attributes = True
        
#-------------------Ficha-------------------

class FichaRegistroBase(BaseModel):
    colaborador_id: int
    tipo_documento: str
    url_documento: str
    validado: Optional[bool] = False
    data_emissao: datetime
    data_vencimento: datetime

class FichaRegistroCreate(FichaRegistroBase):
    pass

class FichaRegistroResponse(FichaRegistroBase):
    id: int
    criado_em: datetime

    class Config:
        from_attributes = True

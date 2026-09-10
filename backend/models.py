from sqlalchemy import Boolean, Column, Date, DateTime, ForeignKey, Integer, String, func
from sqlalchemy.orm import relationship

from database import Base


class Colaborador(Base):
    __tablename__ = "colaborador"

    id = Column(Integer, primary_key=True)
    nome = Column(String, nullable=False)
    cpf = Column(String, unique=True, nullable=False)
    data_nascimento = Column(Date)
    data_admissao = Column(Date, nullable=False)
    data_demissao = Column(Date)
    setor_id = Column(Integer, ForeignKey("setor.id"), nullable=False)
    funcao_id = Column(Integer, ForeignKey("funcao.id"), nullable=False)
    ativo = Column(Boolean, default=True)
    criado_em = Column(DateTime, default=func.now())
    atualizado_em = Column(DateTime, default=func.now(), onupdate=func.now())

    setor = relationship("Setor", back_populates="colaboradores")
    funcao = relationship("Funcao", back_populates="colaboradores")
    historicos_funcao = relationship("HistoricoFuncao", back_populates="colaborador")
    entregas_epi = relationship("EntregaEpi", back_populates="colaborador")
    asos = relationship("Aso", back_populates="colaborador")
    certificados = relationship("ColaboradorCertificado", back_populates="colaborador")
    ordens_servico = relationship("OrdemServico", back_populates="colaborador")
    fichas_registro = relationship("FichaRegistro", back_populates="colaborador")


class Setor(Base):
    __tablename__ = "setor"

    id = Column(Integer, primary_key=True)
    nome = Column(String, unique=True, nullable=False)
    descricao = Column(String)
    ativo = Column(Boolean, default=True)
    criado_em = Column(DateTime, default=func.now())
    atualizado_em = Column(DateTime, default=func.now(), onupdate=func.now())

    colaboradores = relationship("Colaborador", back_populates="setor")
    funcoes = relationship("Funcao", back_populates="setor")
    historicos_funcao = relationship("HistoricoFuncao", back_populates="setor")


class Funcao(Base):
    __tablename__ = "funcao"

    id = Column(Integer, primary_key=True)
    nome = Column(String, nullable=False)
    setor_id = Column(Integer, ForeignKey("setor.id"), nullable=False)
    descricao = Column(String)
    ativo = Column(Boolean, default=True)
    criado_em = Column(DateTime, default=func.now())
    atualizado_em = Column(DateTime, default=func.now(), onupdate=func.now())

    setor = relationship("Setor", back_populates="funcoes")
    colaboradores = relationship("Colaborador", back_populates="funcao")
    epis_obrigatorios = relationship("FuncaoEpiObrigatorio", back_populates="funcao")
    historicos_funcao = relationship("HistoricoFuncao", back_populates="funcao")


class Epi(Base):
    __tablename__ = "epi"

    id = Column(Integer, primary_key=True)
    nome = Column(String, nullable=False)
    grupo_protecao = Column(String, nullable=False)
    ca_numero = Column(String, nullable=False)
    data_validade_ca = Column(Date, nullable=False)
    durabilidade_dias = Column(Integer)
    url_pdf_ca = Column(String)
    ativo = Column(Boolean, default=True)
    criado_em = Column(DateTime, default=func.now())
    atualizado_em = Column(DateTime, default=func.now(), onupdate=func.now())

    funcoes_obrigatorias = relationship("FuncaoEpiObrigatorio", back_populates="epi")
    entregas_epi = relationship("EntregaEpi", back_populates="epi")


class FuncaoEpiObrigatorio(Base):
    __tablename__ = "funcao_epi_obrigatorio"

    id = Column(Integer, primary_key=True)
    funcao_id = Column(Integer, ForeignKey("funcao.id"), nullable=False)
    epi_id = Column(Integer, ForeignKey("epi.id"), nullable=False)
    criado_em = Column(DateTime, default=func.now())

    funcao = relationship("Funcao", back_populates="epis_obrigatorios")
    epi = relationship("Epi", back_populates="funcoes_obrigatorias")


class HistoricoFuncao(Base):
    __tablename__ = "historico_funcao"

    id = Column(Integer, primary_key=True)
    colaborador_id = Column(Integer, ForeignKey("colaborador.id"), nullable=False)
    funcao_id = Column(Integer, ForeignKey("funcao.id"), nullable=False)
    setor_id = Column(Integer, ForeignKey("setor.id"), nullable=False)
    data_inicio = Column(Date, nullable=False)
    data_fim = Column(Date)
    motivo_mudanca = Column(String)
    criado_em = Column(DateTime, default=func.now())

    colaborador = relationship("Colaborador", back_populates="historicos_funcao")
    funcao = relationship("Funcao", back_populates="historicos_funcao")
    setor = relationship("Setor", back_populates="historicos_funcao")


class EntregaEpi(Base):
    __tablename__ = "entrega_epi"

    id = Column(Integer, primary_key=True)
    colaborador_id = Column(Integer, ForeignKey("colaborador.id"), nullable=False)
    epi_id = Column(Integer, ForeignKey("epi.id"), nullable=False)
    quantidade = Column(Integer, nullable=False, default=1)
    data_entrega = Column(Date, nullable=False)
    assinado = Column(Boolean, default=False)
    observacao = Column(String)
    criado_em = Column(DateTime, default=func.now())
    atualizado_em = Column(DateTime, default=func.now(), onupdate=func.now())

    colaborador = relationship("Colaborador", back_populates="entregas_epi")
    epi = relationship("Epi", back_populates="entregas_epi")


class Aso(Base):
    __tablename__ = "aso"

    id = Column(Integer, primary_key=True)
    colaborador_id = Column(Integer, ForeignKey("colaborador.id"), nullable=False)
    tipo = Column(String, nullable=False)
    data_emissao = Column(Date, nullable=False)
    data_vencimento = Column(Date, nullable=False)
    url_documento = Column(String)
    observacao = Column(String)
    criado_em = Column(DateTime, default=func.now())
    atualizado_em = Column(DateTime, default=func.now(), onupdate=func.now())

    colaborador = relationship("Colaborador", back_populates="asos")


class Certificado(Base):
    __tablename__ = "certificado"

    id = Column(Integer, primary_key=True)
    nome = Column(String, nullable=False)
    nr_codigo = Column(String)
    carga_horaria = Column(Integer)
    validade_meses = Column(Integer)
    descricao = Column(String)
    criado_em = Column(DateTime, default=func.now())

    colaboradores = relationship("ColaboradorCertificado", back_populates="certificado")


class ColaboradorCertificado(Base):
    __tablename__ = "colaborador_certificado"

    id = Column(Integer, primary_key=True)
    colaborador_id = Column(Integer, ForeignKey("colaborador.id"), nullable=False)
    certificado_id = Column(Integer, ForeignKey("certificado.id"), nullable=False)
    data_conclusao = Column(Date, nullable=False)
    data_vencimento = Column(Date)
    url_certificado = Column(String)
    criado_em = Column(DateTime, default=func.now())

    colaborador = relationship("Colaborador", back_populates="certificados")
    certificado = relationship("Certificado", back_populates="colaboradores")


class OrdemServico(Base):
    __tablename__ = "ordem_servico"

    id = Column(Integer, primary_key=True)
    colaborador_id = Column(Integer, ForeignKey("colaborador.id"), nullable=False)
    titulo = Column(String, nullable=False)
    data_emissao = Column(Date, nullable=False)
    assinado = Column(Boolean, default=False)
    url_documento = Column(String)
    criado_em = Column(DateTime, default=func.now())

    colaborador = relationship("Colaborador", back_populates="ordens_servico")


class FichaRegistro(Base):
    __tablename__ = "ficha_registro"

    id = Column(Integer, primary_key=True)
    colaborador_id = Column(Integer, ForeignKey("colaborador.id"), nullable=False)
    tipo_documento = Column(String, nullable=False)
    url_documento = Column(String, nullable=False)
    validado = Column(Boolean, default=False)
    data_emissao = Column(Date)
    data_vencimento = Column(Date)
    criado_em = Column(DateTime, default=func.now())

    colaborador = relationship("Colaborador", back_populates="fichas_registro")

from typing import Optional
from calendar import monthrange
from datetime import date, timedelta
import re
import models, schemas
from fastapi import HTTPException, status
from sqlalchemy import func
from sqlalchemy.orm import Session
from services import documentos as documentos_service
from services import leitura_aso, leitura_ca, leitura_identificacao


#====================================Colaboradores====================================

# Setor e função são obrigatórios e a função deve pertencer ao setor escolhido
def _validar_setor_funcao(setor_id: int, funcao_id: int, db: Session):
    setor = db.query(models.Setor).filter(models.Setor.id == setor_id).first()
    funcao = db.query(models.Funcao).filter(models.Funcao.id == funcao_id).first()
    if not setor:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Selecione um setor cadastrado.")
    if not funcao:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Selecione uma função cadastrada.")
    if funcao.setor_id != setor.id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"A função {funcao.nome} não pertence ao setor {setor.nome}.")


# Criar um novo colaborador
def criar_colaborador_banco(colaborador: schemas.ColaboradorCreate, db: Session):
    _validar_setor_funcao(colaborador.setor_id, colaborador.funcao_id, db)
    # Verificação de CPF duplicado
    cpf_existente = db.query(models.Colaborador).filter(models.Colaborador.cpf == colaborador.cpf).first()
    if cpf_existente:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="CPF já cadastrado no sistema.")
    
    novo_colaborador = models.Colaborador(**colaborador.model_dump())
    db.add(novo_colaborador)
    db.commit()
    db.refresh(novo_colaborador)
    return novo_colaborador


# Buscar colaboradores por nome, caso nao tenha o nome, busca todos
def listar_colaboradores_banco(db: Session, nome: Optional[str] = None, apenas_ativos: bool = True):
    query = db.query(models.Colaborador)
    if nome:
        query = query.filter(models.Colaborador.nome.ilike(f"%{nome}%"))
    if apenas_ativos:
        query = query.filter(models.Colaborador.ativo.is_(True))
    return query.all()


# Buscar colaboradores por id
def buscar_colaborador_por_id_banco(colaborador_id: int, db: Session):
    colaborador = db.query(models.Colaborador).filter(models.Colaborador.id == colaborador_id).first()
    if not colaborador:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Colaborador não encontrado")
    return colaborador


# Atualizar colaborador por id
def atualizar_colaborador_por_id_banco(colaborador_id: int, dados_novos: schemas.ColaboradorCreate, db: Session):
    colaborador_banco = db.query(models.Colaborador).filter(models.Colaborador.id == colaborador_id).first()
    if not colaborador_banco:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Colaborador não encontrado")
    _validar_setor_funcao(dados_novos.setor_id, dados_novos.funcao_id, db)

    for chave, valor in dados_novos.model_dump().items():
        setattr(colaborador_banco, chave, valor)
    
    db.commit()
    db.refresh(colaborador_banco)
    return colaborador_banco

# Lê o documento de identificação e devolve os dados para conferência (não grava no banco)
def importar_documento_colaborador(conteudo: bytes, db: Session):
    dados = leitura_identificacao.ler_documento_identificacao(conteudo)
    dados["colaborador_existente"] = None
    if dados["cpf"]:
        dados["colaborador_existente"] = db.query(models.Colaborador).filter(models.Colaborador.cpf == dados["cpf"]).first()
    return dados


# Soft Delete (Desativa) colaborador por id
def desativar_colaborador_por_id_banco(colaborador_id: int, db: Session):
    colaborador_banco = db.query(models.Colaborador).filter(models.Colaborador.id == colaborador_id).first()
    if not colaborador_banco:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Colaborador não encontrado")
    
    colaborador_banco.ativo = False
    db.commit()
    return {"mensagem": "Colaborador desativado com sucesso"}

#====================================Setores====================================

# Criar um novo setor
def criar_setor_banco(setor: schemas.SetorCreate, db: Session):
    # Verifica se o setor ja existe para devolver o erro correto
    setor_existente = db.query(models.Setor).filter(models.Setor.nome == setor.nome).first()
    
    if setor_existente:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Já existe um setor cadastrado com este nome.")
    
    novo_setor = models.Setor(**setor.model_dump())
    db.add(novo_setor)
    db.commit()
    db.refresh(novo_setor)
    return novo_setor

# Buscar setores por nome, caso nao possua, lista todos
def listar_setores_banco(db: Session, nome: Optional[str] = None, apenas_ativos: bool = True):
    query = db.query(models.Setor)
    if nome:
        query = query.filter(models.Setor.nome.ilike(f"%{nome}%"))
    if apenas_ativos:
        query = query.filter(models.Setor.ativo.is_(True))
    return query.all()

# Buscar setor por id
def buscar_setor_por_id_banco(setor_id: int, db: Session):
    setor = db.query(models.Setor).filter(models.Setor.id == setor_id).first()
    if not setor:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Setor não encontrado")
    return setor

# Atualizar um setor por id
def atualizar_setor_por_id_banco(setor_id: int, dados_novos: schemas.SetorCreate, db: Session):
    setor_banco = db.query(models.Setor).filter(models.Setor.id == setor_id).first()
    if not setor_banco:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Setor não encontrado")

    setor_banco.nome = dados_novos.nome
    setor_banco.descricao = dados_novos.descricao
    setor_banco.ativo = dados_novos.ativo

    db.commit()
    db.refresh(setor_banco)
    return setor_banco

# Soft Delete (Desativa) setor por id
def desativar_setor_por_id_banco(setor_id: int, db: Session):
    setor_banco = db.query(models.Setor).filter(models.Setor.id == setor_id).first()
    if not setor_banco:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Setor não encontrado")
    
    colaborador_vinculado = db.query(models.Colaborador).filter(
        models.Colaborador.setor_id == setor_id,
        models.Colaborador.ativo.is_(True)
    ).first()
    funcao_vinculada = db.query(models.Funcao).filter(
            models.Funcao.setor_id == setor_id,
            models.Funcao.ativo.is_(True)
        ).first()
    
    if colaborador_vinculado:
        raise HTTPException(
            status_code=400, 
            detail="Não é possível desativar este setor pois existem colaboradores ativos vinculados a ele."
        )
    if funcao_vinculada:
            raise HTTPException(
                status_code=400, 
                detail="Não é possível desativar este setor pois existem funcoes ativas vinculadas a ele."
            )

    setor_banco.ativo = False
    db.commit()
    return {"mensagem": "Setor desativado com sucesso"}

#====================================Funcoes====================================

# NRs oferecidas no cadastro de função: nome do treinamento e validade da reciclagem (meses), quando a NR fixa
CATALOGO_NR = {
    "NR-06": ("Equipamento de proteção individual", None),
    "NR-10": ("Segurança em instalações e serviços em eletricidade", 24),
    "NR-11": ("Transporte, movimentação, armazenagem e manuseio de materiais", None),
    "NR-12": ("Segurança no trabalho em máquinas e equipamentos", None),
    "NR-18": ("Condições e meio ambiente de trabalho na indústria da construção", None),
    "NR-33": ("Segurança e saúde nos trabalhos em espaços confinados", 12),
    "NR-35": ("Trabalho em altura", 24),
}


# Converte "NR-35"/"NR 35"/"nr35" ou o nome de outro treinamento no certificado do catálogo, criando-o se não existir
def _certificado_do_treinamento(texto: str, db: Session) -> models.Certificado:
    texto = " ".join(texto.split())
    codigo = re.fullmatch(r"(?i)nr[\s-]*0*(\d{1,2})", texto)
    if codigo:
        nr_codigo = f"NR-{int(codigo.group(1)):02d}"
        certificado = db.query(models.Certificado).filter(models.Certificado.nr_codigo == nr_codigo).order_by(models.Certificado.id).first()
        if certificado:
            return certificado
        nome, validade_meses = CATALOGO_NR.get(nr_codigo, (f"Treinamento {nr_codigo}", None))
        certificado = models.Certificado(nome=nome, nr_codigo=nr_codigo, validade_meses=validade_meses)
    else:
        certificado = db.query(models.Certificado).filter(
            models.Certificado.nr_codigo.is_(None),
            func.lower(models.Certificado.nome) == texto.lower(),
        ).first()
        if certificado:
            return certificado
        certificado = models.Certificado(nome=texto)
    db.add(certificado)
    db.flush()
    return certificado


def _treinamentos_obrigatorios(treinamentos: list[str], db: Session) -> list[models.Certificado]:
    certificados = {}
    for texto in treinamentos:
        if not texto.strip():
            continue
        if len(texto) > 120:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="O nome do treinamento deve ter até 120 caracteres.")
        certificado = _certificado_do_treinamento(texto, db)
        certificados[certificado.id] = certificado
    return list(certificados.values())


# Criar uma nova função
def criar_funcao_banco(funcao: schemas.FuncaoCreate, db: Session):
    setor = db.query(models.Setor).filter(models.Setor.id == funcao.setor_id).first()
            
    if not setor:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Setor nao encontrado")
    
    nova_funcao = models.Funcao(**funcao.model_dump(exclude={"treinamentos_obrigatorios"}))
    nova_funcao.treinamentos_obrigatorios = _treinamentos_obrigatorios(funcao.treinamentos_obrigatorios or [], db)
    db.add(nova_funcao)
    db.commit()
    db.refresh(nova_funcao)
    return nova_funcao


# Buscar funções por nome, caso nao tenha o nome, busca todas
def listar_funcoes_banco(db: Session, nome: Optional[str] = None, apenas_ativos: bool = True):
    query = db.query(models.Funcao)
    if nome:
        query = query.filter(models.Funcao.nome.ilike(f"%{nome}%"))
    if apenas_ativos:
        query = query.filter(models.Funcao.ativo.is_(True))
    return query.all()


# Buscar função por id
def buscar_funcao_por_id_banco(funcao_id: int, db: Session):
    funcao = db.query(models.Funcao).filter(models.Funcao.id == funcao_id).first()
    if not funcao:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Função não encontrada")
    return funcao


# Atualizar função por id
def atualizar_funcao_por_id_banco(funcao_id: int, dados_novos: schemas.FuncaoCreate, db: Session):
    funcao_banco = db.query(models.Funcao).filter(models.Funcao.id == funcao_id).first()
    if not funcao_banco:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Função não encontrada")

    for chave, valor in dados_novos.model_dump(exclude={"treinamentos_obrigatorios"}).items():
        setattr(funcao_banco, chave, valor)
    if dados_novos.treinamentos_obrigatorios is not None:
        funcao_banco.treinamentos_obrigatorios = _treinamentos_obrigatorios(dados_novos.treinamentos_obrigatorios, db)

    db.commit()
    db.refresh(funcao_banco)
    return funcao_banco


# Soft Delete (Desativa) função por id
def desativar_funcao_por_id_banco(funcao_id: int, db: Session):
    funcao_banco = db.query(models.Funcao).filter(models.Funcao.id == funcao_id).first()
    if not funcao_banco:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Função não encontrada")
    
    colaborador_vinculado = db.query(models.Colaborador).filter(
            models.Colaborador.funcao_id == funcao_id,
            models.Colaborador.ativo.is_(True)
        ).first()
        
    if colaborador_vinculado:
        raise HTTPException(
            status_code=400, 
            detail="Não é possível desativar esta funcao pois existem colaboradores ativos vinculados a ela."
        )

    funcao_banco.ativo = False
    db.commit()
    return {"mensagem": "Função desativada com sucesso"}


#====================================EPI====================================

# Criar um novo EPI
def criar_epi_banco(epi: schemas.EpiCreate, db: Session):
    novo_epi = models.Epi(**epi.model_dump())
    db.add(novo_epi)
    db.commit()
    db.refresh(novo_epi)
    return novo_epi


# Buscar EPIs por nome, caso nao tenha o nome, busca todos
def listar_epis_banco(db: Session, nome: Optional[str] = None, apenas_ativos: bool = True):
    query = db.query(models.Epi)
    if nome:
        query = query.filter(models.Epi.nome.ilike(f"%{nome}%"))
    if apenas_ativos:
        query = query.filter(models.Epi.ativo.is_(True))
    return query.all()


# Buscar EPI por id
def buscar_epi_por_id_banco(epi_id: int, db: Session):
    epi = db.query(models.Epi).filter(models.Epi.id == epi_id).first()
    if not epi:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="EPI não encontrado")
    return epi


# Atualizar EPI por id
def atualizar_epi_por_id_banco(epi_id: int, dados_novos: schemas.EpiCreate, db: Session):
    epi_banco = db.query(models.Epi).filter(models.Epi.id == epi_id).first()
    if not epi_banco:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="EPI não encontrado")
    for chave, valor in dados_novos.model_dump().items():
        setattr(epi_banco, chave, valor)
    db.commit()
    db.refresh(epi_banco)
    return epi_banco


# Lê o PDF do CA e devolve os dados para conferência (não grava no banco)
def importar_ca_epi(conteudo: bytes, db: Session):
    dados = leitura_ca.ler_certificado_aprovacao(conteudo)
    # compara só os dígitos, pois o CA pode ter sido cadastrado com ponto (ex.: 41.370)
    dados["epi_existente"] = db.query(models.Epi).filter(
        func.regexp_replace(models.Epi.ca_numero, r"\D", "", "g") == dados["ca_numero"]
    ).first()
    return dados


# Soft Delete (Desativa) EPI por id
def desativar_epi_por_id_banco(epi_id: int, db: Session):
    epi_banco = db.query(models.Epi).filter(models.Epi.id == epi_id).first()
    if not epi_banco:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="EPI não encontrado")

    epi_banco.ativo = False
    db.commit()
    return {"mensagem": "EPI desativado com sucesso"}


#====================================ASO====================================

# admissional, periódico, retorno e mudança de risco vencem em 12 meses (prazo padrão da NR-7; o PCMSO pode reduzir)
MESES_VALIDADE_ASO = 12


def _buscar_colaborador(colaborador_id: int, db: Session) -> models.Colaborador:
    colaborador = db.query(models.Colaborador).filter(models.Colaborador.id == colaborador_id).first()
    if not colaborador:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Colaborador não encontrado")
    return colaborador


def _dados_aso(aso: schemas.AsoCreate) -> dict:
    # modo json: as datas dos exames vão para a coluna jsonb como texto AAAA-MM-DD
    return {**aso.model_dump(exclude={"exames"}), "exames": aso.model_dump(mode="json")["exames"]}


# O ASO mais recente define a aptidão para altura do cadastro (ex.: apto no admissional, inapto no periódico)
def _sincronizar_aptidao_altura(colaborador_id: int, db: Session):
    mais_recente = (
        db.query(models.Aso)
        .filter(models.Aso.colaborador_id == colaborador_id)
        .order_by(models.Aso.data_emissao.desc(), models.Aso.id.desc())
        .first()
    )
    if mais_recente and mais_recente.apto_trabalho_altura is not None:
        _buscar_colaborador(colaborador_id, db).apto_trabalho_altura = mais_recente.apto_trabalho_altura


def _palavras(texto: str) -> list[str]:
    return leitura_identificacao._sem_acentos(texto).split()


# Lê o PDF do ASO e devolve os dados para conferência (não grava no banco)
def importar_documento_aso(conteudo: bytes, colaborador_id: int, db: Session):
    colaborador = _buscar_colaborador(colaborador_id, db)
    dados = leitura_aso.ler_aso(conteudo)
    if dados["tipo"] and dados["tipo"] != "Demissional" and dados["data_emissao"]:
        dados["data_vencimento"] = _add_months(dados["data_emissao"], MESES_VALIDADE_ASO)

    # o ASO pode ser de outra pessoa: avisa em vez de bloquear, quem confere é o usuário
    if dados["cpf"] and dados["cpf"] != colaborador.cpf:
        dados["avisos"].append(f"O CPF do ASO é diferente do CPF de {colaborador.nome}. Confira se o arquivo é desta pessoa.")
    elif dados["nome"]:
        lido, cadastrado = _palavras(dados["nome"]), _palavras(colaborador.nome)
        if lido[0] != cadastrado[0] or lido[-1] != cadastrado[-1]:
            dados["avisos"].append(f"O nome no ASO ({dados['nome']}) é diferente do cadastro. Confira se o arquivo é desta pessoa.")
    return dados


# Criar um novo ASO
def criar_aso_banco(aso: schemas.AsoCreate, db: Session):
    _buscar_colaborador(aso.colaborador_id, db)
    novo_aso = models.Aso(**_dados_aso(aso))
    db.add(novo_aso)
    db.flush()
    _sincronizar_aptidao_altura(aso.colaborador_id, db)
    db.commit()
    db.refresh(novo_aso)
    return novo_aso


# Buscar ASOs por colaborador, caso nao tenha o colaborador, busca todos
def listar_asos_banco(db: Session, colaborador_id: Optional[int] = None):
    query = db.query(models.Aso)
    if colaborador_id:
        query = query.filter(models.Aso.colaborador_id == colaborador_id)
    return query.order_by(models.Aso.data_emissao.desc(), models.Aso.id.desc()).all()


# Buscar ASO por id
def buscar_aso_por_id_banco(aso_id: int, db: Session):
    aso = db.query(models.Aso).filter(models.Aso.id == aso_id).first()
    if not aso:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="ASO não encontrado")
    return aso


# Atualizar ASO por id
def atualizar_aso_por_id_banco(aso_id: int, dados_novos: schemas.AsoCreate, db: Session):
    aso_banco = buscar_aso_por_id_banco(aso_id, db)
    _buscar_colaborador(dados_novos.colaborador_id, db)
    for chave, valor in _dados_aso(dados_novos).items():
        setattr(aso_banco, chave, valor)
    db.flush()
    _sincronizar_aptidao_altura(aso_banco.colaborador_id, db)
    db.commit()
    db.refresh(aso_banco)
    return aso_banco


# Deletar ASO por id
def deletar_aso_por_id_banco(aso_id: int, db: Session):
    aso_banco = buscar_aso_por_id_banco(aso_id, db)
    db.delete(aso_banco)
    db.flush()
    _sincronizar_aptidao_altura(aso_banco.colaborador_id, db)
    db.commit()
    return {"mensagem": "ASO deletado com sucesso"}


#====================================Certificados====================================

# Criar um novo certificado
def criar_certificado_banco(certificado: schemas.CertificadoCreate, db: Session):
    novo_certificado = models.Certificado(**certificado.model_dump())
    db.add(novo_certificado)
    db.commit()
    db.refresh(novo_certificado)
    return novo_certificado


# Buscar certificados por nome, caso nao tenha o nome, busca todos
def listar_certificados_banco(db: Session, nome: Optional[str] = None):
    query = db.query(models.Certificado)
    if nome:
        query = query.filter(models.Certificado.nome.ilike(f"%{nome}%"))
    return query.all()


# Buscar certificado por id
def buscar_certificado_por_id_banco(certificado_id: int, db: Session):
    certificado = db.query(models.Certificado).filter(models.Certificado.id == certificado_id).first()
    if not certificado:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Certificado não encontrado")
    return certificado


# Atualizar certificado por id
def atualizar_certificado_banco(certificado_id: int, dados: schemas.CertificadoCreate, db: Session):
    certificado_banco = db.query(models.Certificado).filter(models.Certificado.id == certificado_id).first()
    if not certificado_banco:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Certificado não encontrado")
    for chave, valor in dados.model_dump().items():
        setattr(certificado_banco, chave, valor)
    db.commit()
    db.refresh(certificado_banco)
    return certificado_banco


# Deletar certificado por id
def deletar_certificado_banco(certificado_id: int, db: Session):
    certificado_banco = db.query(models.Certificado).filter(models.Certificado.id == certificado_id).first()
    if not certificado_banco:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Certificado não encontrado")
    db.delete(certificado_banco)
    db.commit()
    return {"mensagem": "Certificado deletado com sucesso"}


#====================================Colaborador Certificado====================================

# Adicionar um certificado ao colaborador
def criar_colaborador_certificado_banco(item: schemas.ColaboradorCertificadoCreate, db: Session):
    colaborador = db.query(models.Colaborador).filter(models.Colaborador.id == item.colaborador_id).first()
    certificado = db.query(models.Certificado).filter(models.Certificado.id == item.certificado_id).first()
    
    if not colaborador:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Colaborador nao encontrado")
    if not certificado:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Certificado nao encontrado")
    
    novo_item = models.ColaboradorCertificado(**item.model_dump())
    db.add(novo_item)
    db.commit()
    db.refresh(novo_item)
    return novo_item


# nome do treinamento, template, carga horária (h) e validade (meses) usados ao criar o certificado no catálogo
CERTIFICADOS_POR_NR = {
    "NR-06": ("Equipamento de proteção individual", "CERTIFICADO_NR_06_Template.docx", 2, None),
    "NR-18": ("Condições e meio ambiente de trabalho na indústria da construção", "CERTIFICADO_NR_18_Template.docx", 6, None),
    "NR-35": ("Trabalho em altura", "CERTIFICADO_NR_35_Template.docx", 8, 24),
}
# NR-12 em espera: modelo de certificado ainda não definido
CERTIFICADOS_EM_ESPERA = {"NR-12"}


def _add_months(value: date, months: int) -> date:
    month_index = value.month - 1 + months
    year = value.year + month_index // 12
    month = month_index % 12 + 1
    return date(year, month, min(value.day, monthrange(year, month)[1]))


def gerar_certificado_documento_banco(dados: schemas.GerarCertificadoRequest, db: Session):
    colaborador = db.query(models.Colaborador).filter(models.Colaborador.id == dados.colaborador_id).first()
    if not colaborador:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Colaborador não encontrado")

    if dados.nr_codigo in CERTIFICADOS_EM_ESPERA:
        raise HTTPException(status_code=status.HTTP_501_NOT_IMPLEMENTED, detail=f"O certificado da {dados.nr_codigo} ainda não está disponível")
    nome_treinamento, nome_modelo, carga_horaria, validade_meses = CERTIFICADOS_POR_NR[dados.nr_codigo]

    if dados.nr_codigo == "NR-35" and colaborador.apto_trabalho_altura is False:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="O colaborador está marcado como inapto para trabalho em altura. O certificado de NR-35 não pode ser emitido.",
        )

    if dados.data_conclusao > date.today():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="A data do treinamento não pode estar no futuro")

    certificado = db.query(models.Certificado).filter(models.Certificado.nr_codigo == dados.nr_codigo).first()
    if certificado:
        _validar_nova_emissao(db, colaborador.id, certificado, dados)
    else:
        certificado = models.Certificado(
            nome=nome_treinamento,
            nr_codigo=dados.nr_codigo,
            carga_horaria=carga_horaria,
            validade_meses=validade_meses,
        )
        db.add(certificado)
        db.flush()

    vencimento = _add_months(dados.data_conclusao, certificado.validade_meses) if certificado.validade_meses else None
    registro = models.ColaboradorCertificado(
        colaborador_id=colaborador.id,
        certificado_id=certificado.id,
        data_conclusao=dados.data_conclusao,
        data_vencimento=vencimento,
    )
    db.add(registro)
    db.flush()
    treinamento = _registrar_treinamento_do_certificado(db, registro)

    dados_documento = schemas.CertificadoDocumentoDados(
        nome_colaborador=colaborador.nome,
        cpf=colaborador.cpf,
        funcao_colaborador=colaborador.funcao.nome if colaborador.funcao else "Não informada",
        data_conclusao=dados.data_conclusao,
    )
    caminho_saida = documentos_service.caminho_certificado(registro.id, dados.nr_codigo)
    try:
        documentos_service.gerar_docx_certificado(dados_documento, nome_modelo, caminho_saida)
        registro.url_certificado = f"/colaborador-certificados/{registro.id}/documento"
        db.commit()
        db.refresh(registro)
        db.refresh(treinamento)
    except Exception:
        db.rollback()
        caminho_saida.unlink(missing_ok=True)
        raise

    return registro, treinamento, caminho_saida


# mesma janela do "a vencer" do dashboard
DIAS_ANTECEDENCIA_RECICLAGEM = 30


# Reemissão (reciclagem) permitida para todas as NRs: com vencimento, a partir de 30 dias antes do último
# certificado vencer; sem vencimento, a qualquer momento (ex.: regra do cliente exige novo treinamento)
def _validar_nova_emissao(db: Session, colaborador_id: int, certificado: models.Certificado, dados: schemas.GerarCertificadoRequest):
    ultimo = db.query(models.ColaboradorCertificado).filter(
        models.ColaboradorCertificado.colaborador_id == colaborador_id,
        models.ColaboradorCertificado.certificado_id == certificado.id,
    ).order_by(models.ColaboradorCertificado.data_conclusao.desc()).first()
    if not ultimo:
        return
    if ultimo.data_vencimento is not None:
        liberada_em = ultimo.data_vencimento - timedelta(days=DIAS_ANTECEDENCIA_RECICLAGEM)
        if date.today() < liberada_em:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"A {dados.nr_codigo} deste colaborador está válida até {ultimo.data_vencimento:%d/%m/%Y}. A reciclagem será liberada a partir de {liberada_em:%d/%m/%Y}",
            )
    if dados.data_conclusao <= ultimo.data_conclusao:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"A data da reciclagem deve ser posterior ao último treinamento ({ultimo.data_conclusao:%d/%m/%Y})",
        )


# Cria o registro de treinamento vinculado ao certificado emitido (mesma transação da emissão).
# Novos dados do treinamento (ex.: instrutor) devem ser repassados aqui.
def _registrar_treinamento_do_certificado(db: Session, registro: models.ColaboradorCertificado) -> models.Treinamento:
    treinamento = models.Treinamento(
        colaborador_id=registro.colaborador_id,
        certificado_id=registro.certificado_id,
        colaborador_certificado_id=registro.id,
        data_emissao=registro.data_conclusao,
    )
    db.add(treinamento)
    db.flush()
    return treinamento


# Buscar certificados por colaborador, caso nao tenha o colaborador, busca todos
def listar_colaborador_certificados_banco(db: Session, colaborador_id: Optional[int] = None):
    query = db.query(models.ColaboradorCertificado)
    if colaborador_id:
        query = query.filter(models.ColaboradorCertificado.colaborador_id == colaborador_id)
    return query.all()


# Buscar vínculo por id
def buscar_colaborador_certificado_por_id_banco(item_id: int, db: Session):
    item = db.query(models.ColaboradorCertificado).filter(models.ColaboradorCertificado.id == item_id).first()
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Registro não encontrado")
    return item


# Atualizar vínculo por id
def atualizar_colaborador_certificado_banco(item_id: int, dados: schemas.ColaboradorCertificadoCreate, db: Session):
    item_banco = db.query(models.ColaboradorCertificado).filter(models.ColaboradorCertificado.id == item_id).first()
    if not item_banco:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Registro não encontrado")
    for chave, valor in dados.model_dump().items():
        setattr(item_banco, chave, valor)
    db.commit()
    db.refresh(item_banco)
    return item_banco


# Deletar vínculo por id
def deletar_colaborador_certificado_banco(item_id: int, db: Session):
    item_banco = db.query(models.ColaboradorCertificado).filter(models.ColaboradorCertificado.id == item_id).first()
    if not item_banco:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Registro não encontrado")
    # o treinamento gerado junto com o certificado é removido com ele
    if item_banco.treinamento:
        db.delete(item_banco.treinamento)
    nr_codigo = item_banco.certificado.nr_codigo if item_banco.certificado else None
    db.delete(item_banco)
    db.commit()
    if nr_codigo:
        documentos_service.caminho_certificado(item_id, nr_codigo).unlink(missing_ok=True)
    return {"mensagem": "Registro deletado com sucesso"}


#====================================Treinamento====================================

def criar_treinamento_banco(treinamento: schemas.TreinamentoCreate, db: Session):
    colaborador = db.query(models.Colaborador).filter(
        models.Colaborador.id == treinamento.colaborador_id
    ).first()
    certificado = db.query(models.Certificado).filter(
        models.Certificado.id == treinamento.certificado_id
    ).first()

    if not colaborador:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Colaborador não encontrado")
    if not certificado:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Certificado não encontrado")
    if treinamento.colaborador_certificado_id is not None:
        registro = db.query(models.ColaboradorCertificado).filter(
            models.ColaboradorCertificado.id == treinamento.colaborador_certificado_id
        ).first()
        if not registro:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Certificado emitido não encontrado")
        if registro.treinamento:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Este certificado emitido já possui um treinamento vinculado")

    novo_treinamento = models.Treinamento(**treinamento.model_dump())
    db.add(novo_treinamento)
    db.commit()
    db.refresh(novo_treinamento)
    return novo_treinamento


def _historico_item(treinamento: models.Treinamento, tipo: str) -> schemas.TreinamentoHistoricoResponse:
    registro = treinamento.colaborador_certificado
    return schemas.TreinamentoHistoricoResponse(
        id=treinamento.id,
        colaborador_id=treinamento.colaborador_id,
        certificado_id=treinamento.certificado_id,
        colaborador_certificado_id=treinamento.colaborador_certificado_id,
        data_emissao=treinamento.data_emissao,
        criado_em=treinamento.criado_em,
        nr_codigo=treinamento.certificado.nr_codigo,
        nome_certificado=treinamento.certificado.nome,
        tipo=tipo,
        data_vencimento=registro.data_vencimento if registro else None,
        url_certificado=registro.url_certificado if registro else None,
    )


# Histórico de treinamentos em ordem cronológica; o primeiro de cada colaborador + certificado é o inicial
def listar_treinamentos_banco(db: Session, colaborador_id: Optional[int] = None, certificado_id: Optional[int] = None):
    query = db.query(models.Treinamento)
    if colaborador_id:
        query = query.filter(models.Treinamento.colaborador_id == colaborador_id)
    if certificado_id:
        query = query.filter(models.Treinamento.certificado_id == certificado_id)
    treinamentos = query.order_by(models.Treinamento.data_emissao, models.Treinamento.id).all()

    vistos = set()
    historico = []
    for treinamento in treinamentos:
        chave = (treinamento.colaborador_id, treinamento.certificado_id)
        historico.append(_historico_item(treinamento, "reciclagem" if chave in vistos else "inicial"))
        vistos.add(chave)
    return historico


def buscar_treinamento_por_id_banco(treinamento_id: int, db: Session):
    treinamento = db.query(models.Treinamento).filter(models.Treinamento.id == treinamento_id).first()
    if not treinamento:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Treinamento não encontrado")
    anterior = db.query(models.Treinamento).filter(
        models.Treinamento.colaborador_id == treinamento.colaborador_id,
        models.Treinamento.certificado_id == treinamento.certificado_id,
        (models.Treinamento.data_emissao < treinamento.data_emissao)
        | ((models.Treinamento.data_emissao == treinamento.data_emissao) & (models.Treinamento.id < treinamento.id)),
    ).first()
    return _historico_item(treinamento, "reciclagem" if anterior else "inicial")


#====================================Funcao EPI Obrigatorio====================================

# Adicionar EPI obrigatório à função
def criar_funcao_epi_banco(item: schemas.FuncaoEpiObrigatorioCreate, db: Session):
    funcao = db.query(models.Funcao).filter(models.Funcao.id == item.funcao_id).first()
    epi = db.query(models.Epi).filter(models.Epi.id == item.epi_id).first()
    
    # Antes de criar, verifica se a funcao e o epi existem no banco (pelo id)
    if not funcao:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Funcão não encontrada")
    if not epi:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="EPI não encontrado")
        
    novo_item = models.FuncaoEpiObrigatorio(**item.model_dump())    
    
    db.add(novo_item)
    db.commit()
    db.refresh(novo_item)
    return novo_item


# Buscar vínculos por função, caso nao tenha a função, busca todos
def listar_funcao_epis_banco(db: Session, funcao_id: Optional[int] = None):
    query = db.query(models.FuncaoEpiObrigatorio)
    if funcao_id:
        query = query.filter(models.FuncaoEpiObrigatorio.funcao_id == funcao_id)
    return query.all()


# Buscar vínculo por id
def buscar_funcao_epi_por_id_banco(funcao_epi_id: int, db: Session):
    item = db.query(models.FuncaoEpiObrigatorio).filter(models.FuncaoEpiObrigatorio.id == funcao_epi_id).first()
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Vínculo Função-EPI não encontrado")
    return item


# Atualizar vínculo por id
def atualizar_funcao_epi_banco(funcao_epi_id: int, dados: schemas.FuncaoEpiObrigatorioCreate, db: Session):
    item_banco = db.query(models.FuncaoEpiObrigatorio).filter(models.FuncaoEpiObrigatorio.id == funcao_epi_id).first()
    
    if not item_banco:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Vínculo Função-EPI não encontrado")
    for chave, valor in dados.model_dump().items():
        setattr(item_banco, chave, valor)
    db.commit()
    db.refresh(item_banco)
    return item_banco


# Deletar vínculo por id
def deletar_funcao_epi_banco(funcao_epi_id: int, db: Session):
    item_banco = db.query(models.FuncaoEpiObrigatorio).filter(models.FuncaoEpiObrigatorio.id == funcao_epi_id).first()
    if not item_banco:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Vínculo Função-EPI não encontrado")
    db.delete(item_banco)
    db.commit()
    return {"mensagem": "Vínculo Função-EPI deletado com sucesso"}


#====================================Historico Funcao====================================

# Criar um novo histórico de função
def criar_historico_funcao_banco(historico: schemas.HistoricoFuncaoCreate, db: Session):
    colaborador = db.query(models.Colaborador).filter(models.Colaborador.id == historico.colaborador_id).first()
    setor = db.query(models.Setor).filter(models.Setor.id == historico.setor_id).first()
    funcao = db.query(models.Funcao).filter(models.Funcao.id == historico.funcao_id).first()
    
    if not colaborador:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Colaborador nao encontrado")
    if not setor:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Setor nao encontrado")
    if not funcao:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Funcao nao encontrada")
    
    novo_historico = models.HistoricoFuncao(**historico.model_dump())
    db.add(novo_historico)
    db.commit()
    db.refresh(novo_historico)
    return novo_historico


# Buscar históricos por colaborador, caso nao tenha o colaborador, busca todos
def listar_historicos_funcao_banco(db: Session, colaborador_id: Optional[int] = None):
    query = db.query(models.HistoricoFuncao)
    if colaborador_id:
        query = query.filter(models.HistoricoFuncao.colaborador_id == colaborador_id)
    return query.all()


# Buscar histórico por id
def buscar_historico_funcao_por_id_banco(historico_id: int, db: Session):
    historico = db.query(models.HistoricoFuncao).filter(models.HistoricoFuncao.id == historico_id).first()
    if not historico:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Histórico de função não encontrado")
    return historico


# Atualizar histórico por id
def atualizar_historico_funcao_banco(historico_id: int, dados: schemas.HistoricoFuncaoCreate, db: Session):
    historico_banco = db.query(models.HistoricoFuncao).filter(models.HistoricoFuncao.id == historico_id).first()
    if not historico_banco:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Histórico de função não encontrado")
    for chave, valor in dados.model_dump().items():
        setattr(historico_banco, chave, valor)
    db.commit()
    db.refresh(historico_banco)
    return historico_banco


# Deletar histórico por id
def deletar_historico_funcao_banco(historico_id: int, db: Session):
    historico_banco = db.query(models.HistoricoFuncao).filter(models.HistoricoFuncao.id == historico_id).first()
    if not historico_banco:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Histórico de função não encontrado")
    db.delete(historico_banco)
    db.commit()
    return {"mensagem": "Histórico de função deletado com sucesso"}


#====================================Entrega EPI====================================

# Criar uma nova entrega de EPI
def criar_entrega_epi_banco(entrega: schemas.EntregaEpiCreate, db: Session):
    colaborador = db.query(models.Colaborador).filter(models.Colaborador.id == entrega.colaborador_id).first()
    epi = db.query(models.Epi).filter(models.Epi.id == entrega.epi_id).first()
        
    if not colaborador:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Colaborador nao encontrado")
    if not epi:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="EPI nao encontrado")
    
    nova_entrega = models.EntregaEpi(**entrega.model_dump())
    db.add(nova_entrega)
    db.commit()
    db.refresh(nova_entrega)
    return nova_entrega


# Buscar entregas por colaborador, caso nao tenha o colaborador, busca todas
def listar_entregas_epi_banco(db: Session, colaborador_id: Optional[int] = None):
    query = db.query(models.EntregaEpi)
    if colaborador_id:
        query = query.filter(models.EntregaEpi.colaborador_id == colaborador_id)
    return query.all()


# Buscar entrega por id
def buscar_entrega_epi_por_id_banco(entrega_id: int, db: Session):
    entrega = db.query(models.EntregaEpi).filter(models.EntregaEpi.id == entrega_id).first()
    if not entrega:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Entrega de EPI não encontrada")
    return entrega


# Atualizar entrega por id
def atualizar_entrega_epi_banco(entrega_id: int, dados: schemas.EntregaEpiCreate, db: Session):
    entrega_banco = db.query(models.EntregaEpi).filter(models.EntregaEpi.id == entrega_id).first()
    if not entrega_banco:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Entrega de EPI não encontrada")
    for chave, valor in dados.model_dump().items():
        setattr(entrega_banco, chave, valor)
    db.commit()
    db.refresh(entrega_banco)
    return entrega_banco


# Deletar entrega por id
def deletar_entrega_epi_banco(entrega_id: int, db: Session):
    entrega_banco = db.query(models.EntregaEpi).filter(models.EntregaEpi.id == entrega_id).first()
    if not entrega_banco:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Entrega de EPI não encontrada")
    db.delete(entrega_banco)
    db.commit()
    return {"mensagem": "Entrega de EPI deletada com sucesso"}


#====================================Ordem de Servico====================================

# Criar uma nova ordem de serviço
def criar_ordem_servico_banco(os: schemas.OrdemServicoCreate, db: Session):
    colaborador = db.query(models.Colaborador).filter(models.Colaborador.id == os.colaborador_id).first()
    
    if not colaborador:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Colaborador nao encontrado")
    
    nova_os = models.OrdemServico(**os.model_dump())
    db.add(nova_os)
    db.commit()
    db.refresh(nova_os)
    return nova_os


# Buscar ordens por colaborador, caso nao tenha o colaborador, busca todas
def listar_ordens_servico_banco(db: Session, colaborador_id: Optional[int] = None):
    query = db.query(models.OrdemServico)
    if colaborador_id:
        query = query.filter(models.OrdemServico.colaborador_id == colaborador_id)
    return query.all()


# Buscar ordem de serviço por id
def buscar_ordem_servico_por_id_banco(os_id: int, db: Session):
    ordem_servico = db.query(models.OrdemServico).filter(models.OrdemServico.id == os_id).first()
    if not ordem_servico:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ordem de Serviço não encontrada")
    return ordem_servico


# Atualizar ordem de serviço por id
def atualizar_ordem_servico_banco(os_id: int, dados: schemas.OrdemServicoCreate, db: Session):
    os_banco = db.query(models.OrdemServico).filter(models.OrdemServico.id == os_id).first()
    if not os_banco:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ordem de Serviço não encontrada")
    for chave, valor in dados.model_dump().items():
        setattr(os_banco, chave, valor)
    db.commit()
    db.refresh(os_banco)
    return os_banco


# Deletar ordem de serviço por id
def deletar_ordem_servico_banco(os_id: int, db: Session):
    os_banco = db.query(models.OrdemServico).filter(models.OrdemServico.id == os_id).first()
    if not os_banco:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ordem de Serviço não encontrada")
    db.delete(os_banco)
    db.commit()
    return {"mensagem": "Ordem de Serviço deletada com sucesso"}


#====================================Ficha Registro====================================

# Criar uma nova ficha de registro
def criar_ficha_registro_banco(ficha: schemas.FichaRegistroCreate, db: Session):
    colaborador = db.query(models.Colaborador).filter(models.Colaborador.id == ficha.colaborador_id).first()
    
    if not colaborador:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Colaborador nao encontrado")
    
    nova_ficha = models.FichaRegistro(**ficha.model_dump())
    db.add(nova_ficha)
    db.commit()
    db.refresh(nova_ficha)
    return nova_ficha


# Buscar fichas por colaborador, caso nao tenha o colaborador, busca todas
def listar_fichas_registro_banco(db: Session, colaborador_id: Optional[int] = None):
    query = db.query(models.FichaRegistro)
    if colaborador_id:
        query = query.filter(models.FichaRegistro.colaborador_id == colaborador_id)
    return query.all()


# Buscar ficha por id
def buscar_ficha_registro_por_id_banco(ficha_id: int, db: Session):
    ficha = db.query(models.FichaRegistro).filter(models.FichaRegistro.id == ficha_id).first()
    if not ficha:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ficha de Registro não encontrada")
    return ficha


# Atualizar ficha por id
def atualizar_ficha_registro_banco(ficha_id: int, dados: schemas.FichaRegistroCreate, db: Session):
    ficha_banco = db.query(models.FichaRegistro).filter(models.FichaRegistro.id == ficha_id).first()
    if not ficha_banco:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ficha de Registro não encontrada")
    for chave, valor in dados.model_dump().items():
        setattr(ficha_banco, chave, valor)
    db.commit()
    db.refresh(ficha_banco)
    return ficha_banco


# Deletar ficha por id
def deletar_ficha_registro_banco(ficha_id: int, db: Session):
    ficha_banco = db.query(models.FichaRegistro).filter(models.FichaRegistro.id == ficha_id).first()
    if not ficha_banco:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ficha de Registro não encontrada")
    db.delete(ficha_banco)
    db.commit()
    return {"mensagem": "Ficha de Registro deletada com sucesso"}
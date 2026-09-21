from typing import Optional
import models, schemas
from fastapi import HTTPException, status
from sqlalchemy.orm import Session


#====================================Colaboradores====================================

# Criar um novo colaborador
def criar_colaborador_banco(colaborador: schemas.ColaboradorCreate, db: Session):
    setor = db.query(models.Setor).filter(models.Setor.id == colaborador.setor_id).first()
    funcao = db.query(models.Funcao).filter(models.Funcao.id == colaborador.funcao_id).first()
    # Verificação de CPF duplicado
    cpf_existente = db.query(models.Colaborador).filter(models.Colaborador.cpf == colaborador.cpf).first()
    
    if not setor:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Setor nao encontrado")
    if not funcao:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Funcao nao encontrada")
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
    
    for chave, valor in dados_novos.model_dump().items():
        setattr(colaborador_banco, chave, valor)
    
    db.commit()
    db.refresh(colaborador_banco)
    return colaborador_banco

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

# Criar uma nova função
def criar_funcao_banco(funcao: schemas.FuncaoCreate, db: Session):
    setor = db.query(models.Setor).filter(models.Setor.id == funcao.setor_id).first()
            
    if not setor:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Setor nao encontrado")
    
    nova_funcao = models.Funcao(**funcao.model_dump())
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

    for chave, valor in dados_novos.model_dump().items():
        setattr(funcao_banco, chave, valor)

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


# Soft Delete (Desativa) EPI por id
def desativar_epi_por_id_banco(epi_id: int, db: Session):
    epi_banco = db.query(models.Epi).filter(models.Epi.id == epi_id).first()
    if not epi_banco:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="EPI não encontrado")

    epi_banco.ativo = False
    db.commit()
    return {"mensagem": "EPI desativado com sucesso"}


#====================================ASO====================================

# Criar um novo ASO
def criar_aso_banco(aso: schemas.AsoCreate, db: Session):
    colaborador = db.query(models.Colaborador).filter(models.Colaborador.id == aso.colaborador_id).first()
    
    if not colaborador:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Colaborador nao encontrado")
    
    novo_aso = models.Aso(**aso.model_dump())
    db.add(novo_aso)
    db.commit()
    db.refresh(novo_aso)
    return novo_aso


# Buscar ASOs por colaborador, caso nao tenha o colaborador, busca todos
def listar_asos_banco(db: Session, colaborador_id: Optional[int] = None):
    query = db.query(models.Aso)
    if colaborador_id:
        query = query.filter(models.Aso.colaborador_id == colaborador_id)
    return query.all()


# Buscar ASO por id
def buscar_aso_por_id_banco(aso_id: int, db: Session):
    aso = db.query(models.Aso).filter(models.Aso.id == aso_id).first()
    if not aso:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="ASO não encontrado")
    return aso


# Atualizar ASO por id
def atualizar_aso_por_id_banco(aso_id: int, dados_novos: schemas.AsoCreate, db: Session):
    aso_banco = db.query(models.Aso).filter(models.Aso.id == aso_id).first()
    if not aso_banco:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="ASO não encontrado")
    for chave, valor in dados_novos.model_dump().items():
        setattr(aso_banco, chave, valor)
    db.commit()
    db.refresh(aso_banco)
    return aso_banco


# Deletar ASO por id
def deletar_aso_por_id_banco(aso_id: int, db: Session):
    aso_banco = db.query(models.Aso).filter(models.Aso.id == aso_id).first()
    if not aso_banco:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="ASO não encontrado")
    db.delete(aso_banco)
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
    db.delete(item_banco)
    db.commit()
    return {"mensagem": "Registro deletado com sucesso"}


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
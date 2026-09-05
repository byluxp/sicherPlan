# cd backend
# python -m uvicorn main:app --reload

from typing import Optional
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from database import engine, Base, get_db
import models, schemas
from routers import colaborador
#from services.documentos import gerar_docx_certificado

app = FastAPI(title="SicherPlan API")

# Permite a conexão do Frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  #Substituir pelo dominio do front
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

Base.metadata.create_all(bind=engine)

@app.get("/")
def home():
    return {"status": "Backend do SicherPlan rodando"}


# ----------------- Teste: Geração de Certificado Word -----------------
#@app.post("/testes/gerar-certificado-word")
#def gerar_certificado_word_teste(dados: schemas.CertificadoDocumentoDados, db: Session = Depends(get_db)):
    caminho_saida = gerar_docx_certificado(dados=dados, db=db)
    return {"mensagem": "Certificado gerado com sucesso", "caminho_arquivo": caminho_saida}

# Colaborador
app.include_router(colaborador.router)

# ----------------- Setor -----------------
@app.post("/setores", response_model=schemas.SetorResponse)
def criar_setor(setor: schemas.SetorCreate, db: Session = Depends(get_db)):
    novo_setor = models.Setor(**setor.model_dump())
    db.add(novo_setor)
    db.commit()
    db.refresh(novo_setor)
    return novo_setor

@app.get("/setores", response_model=list[schemas.SetorResponse])
def listar_setores(nome: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(models.Setor)
    if nome:
        query = query.filter(models.Setor.nome.ilike(f"%{nome}%"))
    return query.all()

@app.get("/setores/{setor_id}", response_model=schemas.SetorResponse)
def buscar_setor_por_id(setor_id: int, db: Session = Depends(get_db)):
    setor = db.query(models.Setor).filter(models.Setor.id == setor_id).first()
    if not setor:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Setor não encontrado")
    return setor

@app.put("/setores/{setor_id}", response_model=schemas.SetorResponse)
def atualizar_setor_por_id(setor_id: int, dados_novos: schemas.SetorCreate, db: Session = Depends(get_db)):
    setor_banco = db.query(models.Setor).filter(models.Setor.id == setor_id).first()
    if not setor_banco:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Setor não encontrado")
    
    setor_banco.nome = dados_novos.nome
    setor_banco.descricao = dados_novos.descricao
    setor_banco.ativo = dados_novos.ativo
    
    db.commit()
    db.refresh(setor_banco)
    return setor_banco

@app.delete("/setores/{setor_id}")
def deletar_setor_por_id(setor_id: int, db: Session = Depends(get_db)):
    setor_banco = db.query(models.Setor).filter(models.Setor.id == setor_id).first()
    if not setor_banco:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Setor não encontrado")
    db.delete(setor_banco)
    db.commit() 
    return {"mensagem": "Setor deletado com sucesso"}


# ----------------- Função -----------------
@app.post("/funcoes", response_model=schemas.FuncaoResponse)
def criar_funcao(funcao: schemas.FuncaoCreate, db: Session = Depends(get_db)):
    nova_funcao = models.Funcao(**funcao.model_dump())
    db.add(nova_funcao)
    db.commit()
    db.refresh(nova_funcao)
    return nova_funcao

@app.get("/funcoes", response_model=list[schemas.FuncaoResponse])
def listar_funcoes(nome: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(models.Funcao)
    if nome:
        query = query.filter(models.Funcao.nome.ilike(f"%{nome}%"))
    return query.all()

@app.get("/funcoes/{funcao_id}", response_model=schemas.FuncaoResponse)
def buscar_funcao_por_id(funcao_id: int, db: Session = Depends(get_db)):
    funcao = db.query(models.Funcao).filter(models.Funcao.id == funcao_id).first()
    if not funcao:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Função não encontrada")
    return funcao

@app.put("/funcoes/{funcao_id}", response_model=schemas.FuncaoResponse)
def atualizar_funcao_por_id(funcao_id: int, dados_novos: schemas.FuncaoCreate, db: Session = Depends(get_db)):
    funcao_banco = db.query(models.Funcao).filter(models.Funcao.id == funcao_id).first()
    if not funcao_banco:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Função não encontrada")
    
    funcao_banco.nome = dados_novos.nome
    funcao_banco.descricao = dados_novos.descricao
    
    db.commit()
    db.refresh(funcao_banco)
    return funcao_banco

@app.delete("/funcoes/{funcao_id}")
def deletar_funcao_por_id(funcao_id: int, db: Session = Depends(get_db)):
    funcao_banco = db.query(models.Funcao).filter(models.Funcao.id == funcao_id).first()
    if not funcao_banco:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Função não encontrada")
    db.delete(funcao_banco)
    db.commit()
    return {"mensagem": "Função deletada com sucesso"}


# ----------------- EPI -----------------
@app.post("/epis", response_model=schemas.EpiResponse)
def criar_epi(epi: schemas.EpiCreate, db: Session = Depends(get_db)):
    novo_epi = models.Epi(**epi.model_dump())
    db.add(novo_epi)
    db.commit()
    db.refresh(novo_epi)
    return novo_epi

@app.get("/epis", response_model=list[schemas.EpiResponse])
def listar_epis(nome: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(models.Epi)
    if nome:
        query = query.filter(models.Epi.nome.ilike(f"%{nome}%"))
    return query.all()

@app.get("/epis/{epi_id}", response_model=schemas.EpiResponse)
def buscar_epi_por_id(epi_id: int, db: Session = Depends(get_db)):
    epi = db.query(models.Epi).filter(models.Epi.id == epi_id).first()
    if not epi:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="EPI não encontrado")
    return epi

@app.put("/epis/{epi_id}", response_model=schemas.EpiResponse)
def atualizar_epi_por_id(epi_id: int, dados_novos: schemas.EpiCreate, db: Session = Depends(get_db)):
    epi_banco = db.query(models.Epi).filter(models.Epi.id == epi_id).first()
    if not epi_banco:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="EPI não encontrado")
    for chave, valor in dados_novos.model_dump().items():
        setattr(epi_banco, chave, valor)
    db.commit()
    db.refresh(epi_banco)
    return epi_banco

@app.delete("/epis/{epi_id}")
def deletar_epi_por_id(epi_id: int, db: Session = Depends(get_db)):
    epi_banco = db.query(models.Epi).filter(models.Epi.id == epi_id).first()
    if not epi_banco:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="EPI não encontrado")
    db.delete(epi_banco)
    db.commit()
    return {"mensagem": "EPI deletado com sucesso"}


# ----------------- ASO -----------------
@app.post("/asos", response_model=schemas.AsoResponse)
def criar_aso(aso: schemas.AsoCreate, db: Session = Depends(get_db)):
    novo_aso = models.Aso(**aso.model_dump())
    db.add(novo_aso)
    db.commit()
    db.refresh(novo_aso)
    return novo_aso

@app.get("/asos", response_model=list[schemas.AsoResponse])
def listar_asos(colaborador_id: Optional[int] = None, db: Session = Depends(get_db)):
    query = db.query(models.Aso)
    if colaborador_id:
        query = query.filter(models.Aso.colaborador_id == colaborador_id)
    return query.all()

@app.get("/asos/{aso_id}", response_model=schemas.AsoResponse)
def buscar_aso_por_id(aso_id: int, db: Session = Depends(get_db)):
    aso = db.query(models.Aso).filter(models.Aso.id == aso_id).first()
    if not aso:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="ASO não encontrado")
    return aso

@app.put("/asos/{aso_id}", response_model=schemas.AsoResponse)
def atualizar_aso_por_id(aso_id: int, dados_novos: schemas.AsoCreate, db: Session = Depends(get_db)):
    aso_banco = db.query(models.Aso).filter(models.Aso.id == aso_id).first()
    if not aso_banco:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="ASO não encontrado")
    for chave, valor in dados_novos.model_dump().items():
        setattr(aso_banco, chave, valor)
    db.commit()
    db.refresh(aso_banco)
    return aso_banco

@app.delete("/asos/{aso_id}")
def deletar_aso_por_id(aso_id: int, db: Session = Depends(get_db)):
    aso_banco = db.query(models.Aso).filter(models.Aso.id == aso_id).first()
    if not aso_banco:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="ASO não encontrado")
    db.delete(aso_banco)
    db.commit()
    return {"mensagem": "ASO deletado com sucesso"}


# ----------------- Certificado -----------------


@app.post("/certificados", response_model=schemas.CertificadoResponse)
def criar_certificado(certificado: schemas.CertificadoCreate, db: Session = Depends(get_db)):
    novo_certificado = models.Certificado(**certificado.model_dump())
    db.add(novo_certificado)
    db.commit()
    db.refresh(novo_certificado)
    return novo_certificado

@app.get("/certificados", response_model=list[schemas.CertificadoResponse])
def listar_certificados(nome: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(models.Certificado)
    if nome:
        query = query.filter(models.Certificado.nome.ilike(f"%{nome}%"))
    return query.all()

@app.get("/certificados/{certificado_id}", response_model=schemas.CertificadoResponse)
def buscar_certificado_por_id(certificado_id: int, db: Session = Depends(get_db)):
    certificado = db.query(models.Certificado).filter(models.Certificado.id == certificado_id).first()
    if not certificado:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Certificado não encontrado")
    return certificado

@app.put("/certificados/{certificado_id}", response_model=schemas.CertificadoResponse)
def atualizar_certificado(certificado_id: int, dados: schemas.CertificadoCreate, db: Session = Depends(get_db)):
    certificado_banco = db.query(models.Certificado).filter(models.Certificado.id == certificado_id).first()
    if not certificado_banco:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Certificado não encontrado")
    for chave, valor in dados.model_dump().items():
        setattr(certificado_banco, chave, valor)
    db.commit()
    db.refresh(certificado_banco)
    return certificado_banco

@app.delete("/certificados/{certificado_id}")
def deletar_certificado(certificado_id: int, db: Session = Depends(get_db)):
    certificado_banco = db.query(models.Certificado).filter(models.Certificado.id == certificado_id).first()
    if not certificado_banco:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Certificado não encontrado")
    db.delete(certificado_banco)
    db.commit()
    return {"mensagem": "Certificado deletado com sucesso"}


# ----------------- Colaborador Certificado (Vínculo) -----------------
@app.post("/colaborador-certificados", response_model=schemas.ColaboradorCertificadoResponse)
def criar_colaborador_certificado(item: schemas.ColaboradorCertificadoCreate, db: Session = Depends(get_db)):
    novo_item = models.ColaboradorCertificado(**item.model_dump())
    db.add(novo_item)
    db.commit()
    db.refresh(novo_item)
    return novo_item

@app.get("/colaborador-certificados", response_model=list[schemas.ColaboradorCertificadoResponse])
def listar_colaborador_certificados(colaborador_id: Optional[int] = None, db: Session = Depends(get_db)):
    query = db.query(models.ColaboradorCertificado)
    if colaborador_id:
        query = query.filter(models.ColaboradorCertificado.colaborador_id == colaborador_id)
    return query.all()

@app.get("/colaborador-certificados/{item_id}", response_model=schemas.ColaboradorCertificadoResponse)
def buscar_colaborador_certificado_por_id(item_id: int, db: Session = Depends(get_db)):
    item = db.query(models.ColaboradorCertificado).filter(models.ColaboradorCertificado.id == item_id).first()
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Registro não encontrado")
    return item

@app.put("/colaborador-certificados/{item_id}", response_model=schemas.ColaboradorCertificadoResponse)
def atualizar_colaborador_certificado(item_id: int, dados: schemas.ColaboradorCertificadoCreate, db: Session = Depends(get_db)):
    item_banco = db.query(models.ColaboradorCertificado).filter(models.ColaboradorCertificado.id == item_id).first()
    if not item_banco:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Registro não encontrado")
    for chave, valor in dados.model_dump().items():
        setattr(item_banco, chave, valor)
    db.commit()
    db.refresh(item_banco)
    return item_banco

@app.delete("/colaborador-certificados/{item_id}")
def deletar_colaborador_certificado(item_id: int, db: Session = Depends(get_db)):
    item_banco = db.query(models.ColaboradorCertificado).filter(models.ColaboradorCertificado.id == item_id).first()
    if not item_banco:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Registro não encontrado")
    db.delete(item_banco)
    db.commit()
    return {"mensagem": "Registro deletado com sucesso"}


# ----------------- Funcao Epi Obrigatorio -----------------
@app.post("/funcao-epis", response_model=schemas.FuncaoEpiObrigatorioResponse)
def criar_funcao_epi(item: schemas.FuncaoEpiObrigatorioCreate, db: Session = Depends(get_db)):
    novo_item = models.FuncaoEpiObrigatorio(**item.model_dump())
    db.add(novo_item)
    db.commit()
    db.refresh(novo_item)
    return novo_item

@app.get("/funcao-epis", response_model=list[schemas.FuncaoEpiObrigatorioResponse])
def listar_funcao_epis(funcao_id: Optional[int] = None, db: Session = Depends(get_db)):
    query = db.query(models.FuncaoEpiObrigatorio)
    if funcao_id:
        query = query.filter(models.FuncaoEpiObrigatorio.funcao_id == funcao_id)
    return query.all()

@app.get("/funcao-epis/{funcao_epi_id}", response_model=schemas.FuncaoEpiObrigatorioResponse)
def buscar_funcao_epi_por_id(funcao_epi_id: int, db: Session = Depends(get_db)):
    item = db.query(models.FuncaoEpiObrigatorio).filter(models.FuncaoEpiObrigatorio.id == funcao_epi_id).first()
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Vínculo Função-EPI não encontrado")
    return item

@app.put("/funcao-epis/{funcao_epi_id}", response_model=schemas.FuncaoEpiObrigatorioResponse)
def atualizar_funcao_epi(funcao_epi_id: int, dados: schemas.FuncaoEpiObrigatorioCreate, db: Session = Depends(get_db)):
    item_banco = db.query(models.FuncaoEpiObrigatorio).filter(models.FuncaoEpiObrigatorio.id == funcao_epi_id).first()
    if not item_banco:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Vínculo Função-EPI não encontrado")
    for chave, valor in dados.model_dump().items():
        setattr(item_banco, chave, valor)
    db.commit()
    db.refresh(item_banco)
    return item_banco

@app.delete("/funcao-epis/{funcao_epi_id}")
def deletar_funcao_epi(funcao_epi_id: int, db: Session = Depends(get_db)):
    item_banco = db.query(models.FuncaoEpiObrigatorio).filter(models.FuncaoEpiObrigatorio.id == funcao_epi_id).first()
    if not item_banco:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Vínculo Função-EPI não encontrado")
    db.delete(item_banco)
    db.commit()
    return {"mensagem": "Vínculo Função-EPI deletado com sucesso"}


# ----------------- Historico Funcao -----------------
@app.post("/historicos-funcao", response_model=schemas.HistoricoFuncaoResponse)
def criar_historico_funcao(historico: schemas.HistoricoFuncaoCreate, db: Session = Depends(get_db)):
    novo_historico = models.HistoricoFuncao(**historico.model_dump())
    db.add(novo_historico)
    db.commit()
    db.refresh(novo_historico)
    return novo_historico

@app.get("/historicos-funcao", response_model=list[schemas.HistoricoFuncaoResponse])
def listar_historicos_funcao(colaborador_id: Optional[int] = None, db: Session = Depends(get_db)):
    query = db.query(models.HistoricoFuncao)
    if colaborador_id:
        query = query.filter(models.HistoricoFuncao.colaborador_id == colaborador_id)
    return query.all()

@app.get("/historicos-funcao/{historico_id}", response_model=schemas.HistoricoFuncaoResponse)
def buscar_historico_funcao_por_id(historico_id: int, db: Session = Depends(get_db)):
    historico = db.query(models.HistoricoFuncao).filter(models.HistoricoFuncao.id == historico_id).first()
    if not historico:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Histórico de função não encontrado")
    return historico

@app.put("/historicos-funcao/{historico_id}", response_model=schemas.HistoricoFuncaoResponse)
def atualizar_historico_funcao(historico_id: int, dados: schemas.HistoricoFuncaoCreate, db: Session = Depends(get_db)):
    historico_banco = db.query(models.HistoricoFuncao).filter(models.HistoricoFuncao.id == historico_id).first()
    if not historico_banco:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Histórico de função não encontrado")
    for chave, valor in dados.model_dump().items():
        setattr(historico_banco, chave, valor)
    db.commit()
    db.refresh(historico_banco)
    return historico_banco

@app.delete("/historicos-funcao/{historico_id}")
def deletar_historico_funcao(historico_id: int, db: Session = Depends(get_db)):
    historico_banco = db.query(models.HistoricoFuncao).filter(models.HistoricoFuncao.id == historico_id).first()
    if not historico_banco:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Histórico de função não encontrado")
    db.delete(historico_banco)
    db.commit()
    return {"mensagem": "Histórico de função deletado com sucesso"}


# ----------------- Entrega Epi -----------------
@app.post("/entregas-epi", response_model=schemas.EntregaEpiResponse)
def criar_entrega_epi(entrega: schemas.EntregaEpiCreate, db: Session = Depends(get_db)):
    nova_entrega = models.EntregaEpi(**entrega.model_dump())
    db.add(nova_entrega)
    db.commit()
    db.refresh(nova_entrega)
    return nova_entrega

@app.get("/entregas-epi", response_model=list[schemas.EntregaEpiResponse])
def listar_entregas_epi(colaborador_id: Optional[int] = None, db: Session = Depends(get_db)):
    query = db.query(models.EntregaEpi)
    if colaborador_id:
        query = query.filter(models.EntregaEpi.colaborador_id == colaborador_id)
    return query.all()

@app.get("/entregas-epi/{entrega_id}", response_model=schemas.EntregaEpiResponse)
def buscar_entrega_epi_por_id(entrega_id: int, db: Session = Depends(get_db)):
    entrega = db.query(models.EntregaEpi).filter(models.EntregaEpi.id == entrega_id).first()
    if not entrega:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Entrega de EPI não encontrada")
    return entrega

@app.put("/entregas-epi/{entrega_id}", response_model=schemas.EntregaEpiResponse)
def atualizar_entrega_epi(entrega_id: int, dados: schemas.EntregaEpiCreate, db: Session = Depends(get_db)):
    entrega_banco = db.query(models.EntregaEpi).filter(models.EntregaEpi.id == entrega_id).first()
    if not entrega_banco:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Entrega de EPI não encontrada")
    for chave, valor in dados.model_dump().items():
        setattr(entrega_banco, chave, valor)
    db.commit()
    db.refresh(entrega_banco)
    return entrega_banco

@app.delete("/entregas-epi/{entrega_id}")
def deletar_entrega_epi(entrega_id: int, db: Session = Depends(get_db)):
    entrega_banco = db.query(models.EntregaEpi).filter(models.EntregaEpi.id == entrega_id).first()
    if not entrega_banco:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Entrega de EPI não encontrada")
    db.delete(entrega_banco)
    db.commit()
    return {"mensagem": "Entrega de EPI deletada com sucesso"}


# ----------------- Ordem De Servico -----------------
@app.post("/ordens-servico", response_model=schemas.OrdemServicoResponse)
def criar_ordem_servico(os: schemas.OrdemServicoCreate, db: Session = Depends(get_db)):
    nova_os = models.OrdemServico(**os.model_dump())
    db.add(nova_os)
    db.commit()
    db.refresh(nova_os)
    return nova_os

@app.get("/ordens-servico", response_model=list[schemas.OrdemServicoResponse])
def listar_ordens_servico(colaborador_id: Optional[int] = None, db: Session = Depends(get_db)):
    query = db.query(models.OrdemServico)
    if colaborador_id:
        query = query.filter(models.OrdemServico.colaborador_id == colaborador_id)
    return query.all()

@app.get("/ordens-servico/{os_id}", response_model=schemas.OrdemServicoResponse)
def buscar_ordem_servico_por_id(os_id: int, db: Session = Depends(get_db)):
    os = db.query(models.OrdemServico).filter(models.OrdemServico.id == os_id).first()
    if not os:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ordem de Serviço não encontrada")
    return os

@app.put("/ordens-servico/{os_id}", response_model=schemas.OrdemServicoResponse)
def atualizar_ordem_servico(os_id: int, dados: schemas.OrdemServicoCreate, db: Session = Depends(get_db)):
    os_banco = db.query(models.OrdemServico).filter(models.OrdemServico.id == os_id).first()
    if not os_banco:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ordem de Serviço não encontrada")
    for chave, valor in dados.model_dump().items():
        setattr(os_banco, chave, valor)
    db.commit()
    db.refresh(os_banco)
    return os_banco

@app.delete("/ordens-servico/{os_id}")
def deletar_ordem_servico(os_id: int, db: Session = Depends(get_db)):
    os_banco = db.query(models.OrdemServico).filter(models.OrdemServico.id == os_id).first()
    if not os_banco:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ordem de Serviço não encontrada")
    db.delete(os_banco)
    db.commit()
    return {"mensagem": "Ordem de Serviço deletada com sucesso"}


# ----------------- Ficha Registro -----------------
@app.post("/fichas-registro", response_model=schemas.FichaRegistroResponse)
def criar_ficha_registro(ficha: schemas.FichaRegistroCreate, db: Session = Depends(get_db)):
    nova_ficha = models.FichaRegistro(**ficha.model_dump())
    db.add(nova_ficha)
    db.commit()
    db.refresh(nova_ficha)
    return nova_ficha

@app.get("/fichas-registro", response_model=list[schemas.FichaRegistroResponse])
def listar_fichas_registro(colaborador_id: Optional[int] = None, db: Session = Depends(get_db)):
    query = db.query(models.FichaRegistro)
    if colaborador_id:
        query = query.filter(models.FichaRegistro.colaborador_id == colaborador_id)
    return query.all()

@app.get("/fichas-registro/{ficha_id}", response_model=schemas.FichaRegistroResponse)
def buscar_ficha_registro_por_id(ficha_id: int, db: Session = Depends(get_db)):
    ficha = db.query(models.FichaRegistro).filter(models.FichaRegistro.id == ficha_id).first()
    if not ficha:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ficha de Registro não encontrada")
    return ficha

@app.put("/fichas-registro/{ficha_id}", response_model=schemas.FichaRegistroResponse)
def atualizar_ficha_registro(ficha_id: int, dados: schemas.FichaRegistroCreate, db: Session = Depends(get_db)):
    ficha_banco = db.query(models.FichaRegistro).filter(models.FichaRegistro.id == ficha_id).first()
    if not ficha_banco:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ficha de Registro não encontrada")
    for chave, valor in dados.model_dump().items():
        setattr(ficha_banco, chave, valor)
    db.commit()
    db.refresh(ficha_banco)
    return ficha_banco

@app.delete("/fichas-registro/{ficha_id}")
def deletar_ficha_registro(ficha_id: int, db: Session = Depends(get_db)):
    ficha_banco = db.query(models.FichaRegistro).filter(models.FichaRegistro.id == ficha_id).first()
    if not ficha_banco:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ficha de Registro não encontrada")
    db.delete(ficha_banco)
    db.commit()
    return {"mensagem": "Ficha de Registro deletada com sucesso"}
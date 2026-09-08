"""
Comandos para rodar o projeto:
1. cd backend
2. uvicorn main:app --reload
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import engine, Base
from routers import (
    aso,
    colaborador,
    colaborador_certificado,
    entrega_epi,
    epi,
    ficha_registro,
    funcao,
    funcao_epi,
    historico_funcao,
    ordem_servico,
    setor,
    certificado,
)

app = FastAPI(title="SicherPlan API")

# Permite a conexão do Frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Substituir pelo dominio do front
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

Base.metadata.create_all(bind=engine)


@app.get("/")
def home():
    return {"status": "Backend do SicherPlan rodando"}


app.include_router(colaborador.router)

app.include_router(setor.router)

app.include_router(funcao.router)

app.include_router(epi.router)

app.include_router(aso.router)

app.include_router(certificado.router)

app.include_router(colaborador_certificado.router)

app.include_router(funcao_epi.router)

app.include_router(historico_funcao.router)

app.include_router(entrega_epi.router)

app.include_router(ordem_servico.router)

app.include_router(ficha_registro.router)

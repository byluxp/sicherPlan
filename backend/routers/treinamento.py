from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
import schemas
from services import services

router = APIRouter(prefix="/treinamentos", tags=["Treinamentos"])


@router.post("/", response_model=schemas.TreinamentoResponse)
def criar_treinamento(treinamento: schemas.TreinamentoCreate, db: Session = Depends(get_db)):
    return services.criar_treinamento_banco(treinamento, db)
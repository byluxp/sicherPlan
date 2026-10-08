import os
from dotenv import find_dotenv, load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

load_dotenv(find_dotenv(usecwd=True))

POSTGRES_DB = os.getenv("POSTGRES_DB", "sicherplan")
POSTGRES_USER = os.getenv("POSTGRES_USER", "sicherplan")
POSTGRES_PASSWORD = os.getenv("POSTGRES_PASSWORD", "sicherplan")
POSTGRES_HOST = os.getenv("POSTGRES_HOST", "localhost")
POSTGRES_PORT = os.getenv("POSTGRES_PORT", "5432")

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    f"postgresql+psycopg2://{POSTGRES_USER}:{POSTGRES_PASSWORD}@{POSTGRES_HOST}:{POSTGRES_PORT}/{POSTGRES_DB}",
)

engine = create_engine(DATABASE_URL, pool_pre_ping=True)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
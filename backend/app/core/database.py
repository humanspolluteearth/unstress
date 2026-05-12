from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from .config import settings

db_url = settings.get_database_url

engine_args = {}
if db_url.startswith("postgresql"):
    engine_args = {
        "pool_size": 10,
        "max_overflow": 20
    }

engine = create_engine(
    db_url,
    **engine_args
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

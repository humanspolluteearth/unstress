from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# Standardized DB URL for unstress modular monolith
SQLALCHEMY_DATABASE_URL = "postgresql://user:pass@localhost/unstress_db"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    # Standard connection pooling for PostgreSQL
    pool_size=10,
    max_overflow=20
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

# Dependency for route handlers
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

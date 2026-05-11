from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional

class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql://user:pass@localhost/unstress_db"
    SECRET_KEY: str = "secret-key-for-development"
    PROJECT_NAME: str = "unstress"
    
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

settings = Settings()

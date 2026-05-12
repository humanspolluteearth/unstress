import os
from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional

class Settings(BaseSettings):
    DATABASE_URL: Optional[str] = None
    SECRET_KEY: str = "secret-key-for-development"
    PROJECT_NAME: str = "unstress"
    
    @property
    def get_database_url(self) -> str:
        if self.DATABASE_URL:
            return self.DATABASE_URL
        
        # Fallback to SQLite in user data dir for portability (AppImage)
        data_dir = os.environ.get("UNSTRESS_DATA_DIR")
        if not data_dir:
            # Standard Linux local data path
            data_dir = os.path.join(os.path.expanduser("~"), ".local", "share", "unstress")
        
        os.makedirs(data_dir, exist_ok=True)
        db_path = os.path.join(data_dir, "unstress.db")
        return f"sqlite:///{db_path}"
    
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

settings = Settings()

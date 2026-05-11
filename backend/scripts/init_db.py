import logging
import sys
import os

# Add the app directory to sys.path to allow importing from app
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.core.database import engine
from app.models.base import Base
# Import all models to ensure they are registered with Base.metadata
from app.models import finance, goals, focus, habits, schedule

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def init_db():
    """Initializes the database by creating all tables."""
    logger.info("Initializing database...")
    try:
        # Tables are created in the order they are defined in the metadata.
        # SQLAlchemy handles foreign key dependencies automatically if models are imported.
        Base.metadata.create_all(bind=engine)
        logger.info("Database initialization complete. All tables created.")
    except Exception as e:
        logger.error(f"Error initializing database: {e}")
        sys.exit(1)

if __name__ == "__main__":
    init_db()

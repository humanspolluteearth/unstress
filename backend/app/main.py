from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import logging
from app.core.database import engine
from app.models.base import Base
# Import all models to ensure they are registered with Base.metadata
from app.models import finance, goals, focus, habits, schedule

from app.api.goals import router as goals_router
from app.api.tasks import router as tasks_router
from app.api.finance import router as api_finance_router
from app.api.focus import router as focus_router
from app.api.habits import router as habits_router
from app.api.schedules import router as schedules_router
from app.core.actions_router import router as actions_router

# Python 3.14 Compatibility: Ensure standard asyncio is used
import asyncio

import time
from sqlalchemy.exc import OperationalError

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# --- Database Persistence Activation with Retry Logic ---
def init_db(retries=5, delay=2):
    """Wait for the database to be ready and initialize tables."""
    from sqlalchemy import inspect, text
    db_url = engine.url
    db_type = "PostgreSQL" if "postgresql" in str(db_url) else "SQLite"
    logger.info(f"Attempting to connect to {db_type}...")
    
    for i in range(retries):
        try:
            Base.metadata.create_all(bind=engine)
            
            # --- Lightweight Migration: Add missing columns ---
            inspector = inspect(engine)
            columns = [c["name"] for c in inspector.get_columns("schedule_events")]
            
            if "repeat_pattern" not in columns:
                logger.info("Migrating database: Adding 'repeat_pattern' to 'schedule_events'")
                with engine.begin() as conn:
                    if db_type == "SQLite":
                        conn.execute(text("ALTER TABLE schedule_events ADD COLUMN repeat_pattern VARCHAR"))
                    else:
                        conn.execute(text("ALTER TABLE schedule_events ADD COLUMN repeat_pattern VARCHAR"))
            
            logger.info(f"{db_type} connection established and tables synchronized.")
            return True
        except OperationalError as e:
            logger.warning(f"Database not ready (attempt {i+1}/{retries}): {e}")
            if i < retries - 1:
                time.sleep(delay)
            else:
                logger.error(f"CRITICAL: Could not connect to {db_type} after multiple attempts.")
                return False

# init_db()  <-- Removed top-level call

app = FastAPI(title="unstress Backend")

# --- Global Exception Handler ---
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Global Exception: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={
            "success": False,
            "error": "Internal Server Error",
            "detail": str(exc) if app.debug else "An unexpected error occurred."
        }
    )

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Standardized API Mounting ---
# All domain modules are now centralized in app/api/ and follow the same pattern.
# We mount them with explicit /api prefixes.

app.include_router(goals_router, prefix="/api/goals", tags=["goals"])
app.include_router(tasks_router, prefix="/api/tasks", tags=["tasks"])
app.include_router(api_finance_router, prefix="/api/finance", tags=["finance"])
app.include_router(focus_router, prefix="/api/focus", tags=["focus"])
app.include_router(habits_router, prefix="/api/habits", tags=["habits"])
app.include_router(schedules_router, prefix="/api/schedules", tags=["schedules"])

# Infrastructure & Legacy Actions
app.include_router(actions_router, prefix="/api/actions", tags=["infrastructure"])

@app.get("/")
async def root():
    return {"status": "unstress_api_monolith_active"}

@app.get("/health")
async def health():
    return {"status": "ok"}

if __name__ == "__main__":
    import uvicorn
    import sys
    
    # Print port for Tauri sidecar detection
    print("PORT:8000", flush=True)
    
    try:
        init_db()
    except Exception as e:
        print(f"DATABASE_INIT_ERROR: {e}", file=sys.stderr, flush=True)
        # We continue to let the server start so it can report health errors if needed
    
    uvicorn.run(app, host="127.0.0.1", port=8000)

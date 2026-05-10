from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import Base, engine
import app.models as models

from app.api.goals import router as goals_router
from app.api.tasks import router as tasks_router
from app.api.finance import router as api_finance_router
from app.api.focus import router as focus_router
from app.core.actions_router import router as actions_router
from app.modules.habits.router import router as habits_router
from app.modules.schedules.router import router as schedules_router

# Python 3.14 Compatibility: Ensure standard asyncio is used
import asyncio

# --- Database Persistence Activation ---
# This ensures tables are created in unstress_db on startup
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="unstress Backend")

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Standardized API Mounting ---
# Every domain module is mounted under the global /api namespace.
app.include_router(goals_router, prefix="/api/goals", tags=["goals"])
app.include_router(tasks_router, prefix="/api/tasks", tags=["tasks"])
app.include_router(api_finance_router, prefix="/api/finance", tags=["finance"])
app.include_router(focus_router, prefix="/api/focus", tags=["focus"])
app.include_router(habits_router, prefix="/api/habits", tags=["habits"])
app.include_router(schedules_router, prefix="/api/schedules", tags=["schedules"])

# Infrastructure & Legacy Actions (Mounted under /api/actions)
app.include_router(actions_router, prefix="/api/actions", tags=["infrastructure"])

@app.get("/")
async def root():
    return {"status": "unstress_api_v1_online"}

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.goals import router as goals_router
from app.api.tasks import router as tasks_router
from app.api.finance import router as api_finance_router
from app.modules.finance.router import router as finance_router
from app.core.actions_router import router as actions_router
from app.modules.habits.router import router as habits_router
from app.modules.schedules.router import router as schedules_router

# Python 3.14 Compatibility: Ensure standard asyncio is used
import asyncio

app = FastAPI(title="unstress Backend")

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Route Mounting - Registered in order of module hierarchy
# Consolidate all API routes under /api for consistency
app.include_router(goals_router, prefix="/api/goals", tags=["goals"])
app.include_router(tasks_router, prefix="/api/tasks", tags=["tasks"])
app.include_router(api_finance_router, prefix="/api/finance", tags=["finance"])

# Legacy / Infrastructure Routes
app.include_router(actions_router)
app.include_router(habits_router)
app.include_router(schedules_router)

@app.get("/")
async def root():
    return {"status": "unstress_api_v1_online"}

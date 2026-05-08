import uvicorn
import socket
import sys
import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.results import Result
from app.core.broker import broker
from app.core.review import ReviewService
from app.core.insights import StatisticsService
from app.core.search import SearchService
from app.modules.tasks.listeners import handle_finance_transaction_added
from app.modules.finance.listeners import handle_habit_logged
from app.modules.goals.listeners import (
    handle_finance_goal_update,
    handle_task_goal_update,
    handle_habit_goal_update
)
from app.modules.schedules.listeners import handle_task_completed
from app.modules.finance.router import router as finance_router
from app.core.actions_router import router as actions_router
from app.modules.habits.router import router as habits_router
from app.modules.goals.router import router as goals_router
from app.modules.schedules.router import router as schedules_router

# Performance Optimization: Use uvloop on Linux
if sys.platform != "win32":
    try:
        import uvloop
        import asyncio
        asyncio.set_event_loop_policy(uvloop.EventLoopPolicy())
    except ImportError:
        pass

from datetime import datetime, timezone

app = FastAPI(title="unstress Backend")

@app.get("/system-time")
async def get_system_time() -> Result[dict, str]:
    """
    Returns the current backend system time in ISO 8601 format.
    """
    return Result.ok({"time": datetime.now(timezone.utc).isoformat()})

app.include_router(finance_router)
app.include_router(actions_router)
app.include_router(habits_router)
app.include_router(goals_router)
app.include_router(schedules_router)

# Standard CORS for Tauri Localhost communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup_event():
    """Register all cross-module listeners here to maintain decoupling."""
    broker.subscribe("FINANCE_TRANSACTION_ADDED", handle_finance_transaction_added)
    broker.subscribe("HABIT_LOGGED", handle_habit_logged)
    
    # Goals Module Subscriptions
    broker.subscribe("FINANCE_TRANSACTION_ADDED", handle_finance_goal_update)
    broker.subscribe("TASK_COMPLETED", handle_task_goal_update)
    broker.subscribe("HABIT_LOGGED", handle_habit_goal_update)
    
    # Schedules Module Subscriptions
    broker.subscribe("TASK_COMPLETED", handle_task_completed)
    
    print("Event Broker initialized: All module listeners registered.")

@app.get("/health")
async def health_check() -> Result[dict, str]:
    """
    Health check endpoint using the Result Pattern.
    """
    return Result.ok({"status": "healthy", "version": "0.1.0"})

@app.get("/review/weekly")
async def get_weekly_review() -> Result[dict, str]:
    """
    Returns a 7-day summary of all module activity.
    """
    return ReviewService.get_weekly_summary()

@app.get("/insights/health-report")
async def get_health_report() -> Result[dict, str]:
    """
    Triggers and returns a deterministic system health report.
    """
    return await StatisticsService.generate_report()

@app.get("/search")
async def search(q: str = "") -> Result[list, str]:
    """
    Global search endpoint.
    """
    return await SearchService.global_search(q)

def get_free_port() -> int:
    """Finds a free port on the local machine."""
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.bind(("", 0))
        return s.getsockname()[1]

def start():
    """Entry point for the sidecar executable with dynamic port discovery."""
    try:
        port = get_free_port()
        # The port MUST be printed to stdout so Tauri can capture it
        print(f"PORT:{port}")
        sys.stdout.flush()
        
        # loop="uvloop" is implicitly used by uvicorn if installed, 
        # but we've explicitly set the policy above.
        uvicorn.run("app.main:app", host="127.0.0.1", port=port, log_level="info")
    except Exception as e:
        print(f"ERROR: Failed to start server: {e}")
        sys.exit(1)

if __name__ == "__main__":
    start()

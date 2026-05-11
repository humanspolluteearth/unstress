from fastapi import APIRouter
from app.core.dispatcher import ActionDispatcher
from app.schemas.tasks import TaskCreate
from app.schemas.finance import TransactionCreate
from app.schemas.habits import HabitLogCreate
from app.core.results import Result
from typing import Any

router = APIRouter(tags=["actions"])

@router.post("/finance/transaction")
async def create_transaction(data: TransactionCreate) -> Result[dict, str]:
    return await ActionDispatcher.dispatch_finance_transaction(data)

@router.post("/tasks/task")
async def create_task(data: TaskCreate) -> Result[dict, str]:
    return await ActionDispatcher.dispatch_task_creation(data)

@router.put("/tasks/task/{task_id}")
async def update_task(task_id: str, data: TaskCreate) -> Result[dict, str]:
    return await ActionDispatcher.dispatch_task_update(task_id, data)

@router.delete("/tasks/task/{task_id}")
async def delete_task(task_id: str) -> Result[dict, str]:
    return await ActionDispatcher.dispatch_task_deletion(task_id)

@router.patch("/tasks/task/{task_id}/status")
async def update_task_status(task_id: str, status: str) -> Result[dict, str]:
    return await ActionDispatcher.dispatch_task_status_update(task_id, status)

@router.post("/habits/log")
async def create_habit_log(data: HabitLogCreate) -> Result[dict, str]:
    return await ActionDispatcher.dispatch_habit_log(data)

@router.post("/system/reset-module")
async def reset_module(module: str) -> Result[dict, str]:
    return await ActionDispatcher.reset_module(module)

@router.post("/system/clear-events")
async def clear_events() -> Result[dict, str]:
    return await ActionDispatcher.clear_events()

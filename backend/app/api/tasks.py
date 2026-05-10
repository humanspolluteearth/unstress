from fastapi import APIRouter
from pydantic import BaseModel
from typing import List, Optional
from app.core.results import Result
import uuid

# Schema Definitions
class TaskCreate(BaseModel):
    title: str
    description: Optional[str] = None
    priority: int = 0  # 0: Low, 1: Med, 2: High
    tags: List[str] = []
    deadline: Optional[str] = None
    project_link: Optional[str] = None
    goal_id: Optional[str] = None # Linking to Goal ID

class Task(TaskCreate):
    id: str
    status: str = "Todo"

router = APIRouter()

@router.get("")
@router.get("/")
async def get_tasks() -> Result[List[Task], str]:
    from app.core.dispatcher import TaskService
    return await TaskService.get_tasks()

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from app.core.results import Result
from sqlalchemy.orm import Session
from app.database import get_db
import app.models as models
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

class TaskPatchRequest(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    priority: Optional[int] = None
    status: Optional[str] = None
    tags: Optional[List[str]] = None
    deadline: Optional[str] = None
    project_link: Optional[str] = None
    goal_id: Optional[str] = None

class Task(BaseModel):
    id: str
    title: str
    description: Optional[str] = None
    priority: int = 0
    status: str = "Todo"
    tags: List[str] = []
    deadline: Optional[str] = None
    project_link: Optional[str] = None
    goal_id: Optional[str] = None

    class Config:
        from_attributes = True

router = APIRouter()

@router.get("", response_model=Result[List[Task], str])
@router.get("/", response_model=Result[List[Task], str])
async def get_tasks(db: Session = Depends(get_db)):
    """Retrieves all tasks from the database."""
    tasks = db.query(models.Task).all()
    return Result.ok(tasks)

@router.post("", response_model=Result[Task, str])
@router.post("/", response_model=Result[Task, str])
async def create_task(data: TaskCreate, db: Session = Depends(get_db)):
    """Creates a new task in the database."""
    try:
        new_task = models.Task(
            id=str(uuid.uuid4()),
            title=data.title,
            description=data.description,
            priority=data.priority,
            status="Todo",
            tags=data.tags,
            deadline=data.deadline,
            project_link=data.project_link,
            goal_id=data.goal_id
        )
        db.add(new_task)
        db.commit()
        db.refresh(new_task)
        return Result.ok(new_task)
    except Exception as e:
        db.rollback()
        return Result.fail(str(e))

@router.patch("/{task_id}", response_model=Result[Task, str])
async def update_task(task_id: str, data: TaskPatchRequest, db: Session = Depends(get_db)):
    """Updates an existing task in the database with support for partial updates."""
    task = db.query(models.Task).filter(models.Task.id == task_id).first()
    if not task:
        return Result.fail("Task not found")
    
    try:
        update_data = data.dict(exclude_unset=True)
        for key, value in update_data.items():
            setattr(task, key, value)
        
        db.commit()
        db.refresh(task)
        return Result.ok(task)
    except Exception as e:
        db.rollback()
        return Result.fail(str(e))

@router.delete("/{task_id}", response_model=Result[dict, str])
async def delete_task(task_id: str, db: Session = Depends(get_db)):
    """Deletes a task from the database."""
    task = db.query(models.Task).filter(models.Task.id == task_id).first()
    if not task:
        return Result.fail("Task not found")
    
    try:
        db.delete(task)
        db.commit()
        return Result.ok({"success": True, "status": "deleted"})
    except Exception as e:
        db.rollback()
        return Result.fail(str(e))

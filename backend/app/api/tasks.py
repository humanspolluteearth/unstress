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

class Task(TaskCreate):
    id: str
    status: str = "Todo"

router = APIRouter()

@router.get("", response_model=List[Task])
@router.get("/", response_model=List[Task])
async def get_tasks(db: Session = Depends(get_db)):
    """Retrieves all tasks from the database."""
    tasks = db.query(models.Task).all()
    return tasks

@router.post("", response_model=Task)
@router.post("/", response_model=Task)
async def create_task(data: TaskCreate, db: Session = Depends(get_db)):
    """Creates a new task in the database."""
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
    return new_task

@router.patch("/{task_id}", response_model=Task)
async def update_task(task_id: str, data: TaskCreate, db: Session = Depends(get_db)):
    """Updates an existing task in the database."""
    task = db.query(models.Task).filter(models.Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    task.title = data.title
    task.description = data.description
    task.priority = data.priority
    task.tags = data.tags
    task.deadline = data.deadline
    task.project_link = data.project_link
    task.goal_id = data.goal_id
    
    db.commit()
    db.refresh(task)
    return task

@router.delete("/{task_id}")
async def delete_task(task_id: str, db: Session = Depends(get_db)):
    """Deletes a task from the database."""
    task = db.query(models.Task).filter(models.Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    db.delete(task)
    db.commit()
    return {"success": True, "status": "deleted"}

from fastapi import APIRouter, Depends, HTTPException
from typing import List, Optional
import logging
from app.core.results import Result
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models import goals as models
from app.schemas import tasks as schemas
import uuid

logger = logging.getLogger(__name__)

router = APIRouter()

@router.get("", response_model=Result[List[schemas.Task], str])
@router.get("/", response_model=Result[List[schemas.Task], str])
async def get_tasks(db: Session = Depends(get_db)):
    """Retrieves all tasks from the database."""
    try:
        tasks = db.query(models.Task).all()
        return Result.ok(tasks)
    except Exception as e:
        logger.error(f"Error fetching tasks: {e}")
        return Result.fail(str(e))

@router.get("/archived", response_model=Result[List[schemas.Task], str])
async def get_archived_tasks(db: Session = Depends(get_db)):
    """Retrieves all archived tasks from the database."""
    try:
        tasks = db.query(models.Task).filter(models.Task.is_archived == True).all()
        return Result.ok(tasks)
    except Exception as e:
        logger.error(f"Error fetching archived tasks: {e}")
        return Result.fail(str(e))

@router.post("", response_model=Result[schemas.Task, str])
@router.post("/", response_model=Result[schemas.Task, str])
async def create_task(data: schemas.TaskCreate, db: Session = Depends(get_db)):
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
        logger.error(f"Error creating task: {e}")
        return Result.fail(str(e))

@router.patch("/{task_id}", response_model=Result[schemas.Task, str])
async def update_task(task_id: str, data: schemas.TaskPatchRequest, db: Session = Depends(get_db)):
    """Updates an existing task in the database with support for partial updates."""
    task = db.query(models.Task).filter(models.Task.id == task_id).first()
    if not task:
        return Result.fail("Task not found")
    
    try:
        update_data = data.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(task, key, value)
        
        db.commit()
        db.refresh(task)
        return Result.ok(task)
    except Exception as e:
        db.rollback()
        logger.error(f"Error updating task {task_id}: {e}")
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
        logger.error(f"Error deleting task {task_id}: {e}")
        return Result.fail(str(e))

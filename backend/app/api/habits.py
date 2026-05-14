from fastapi import APIRouter, Depends, HTTPException
from typing import List, Optional
import logging
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models import habits as models
from app.schemas import habits as schemas
from datetime import datetime, timezone
import uuid
from app.core.results import Result

logger = logging.getLogger(__name__)

router = APIRouter()

@router.get("", response_model=Result[List[schemas.Habit], str])
@router.get("/", response_model=Result[List[schemas.Habit], str])
async def get_habits(db: Session = Depends(get_db)):
    """Returns all habits with their logs from the database."""
    try:
        db_habits = db.query(models.Habit).all()
        results = []
        for h in db_habits:
            habit_data = schemas.Habit(
                id=h.id,
                name=h.name,
                frequency=h.frequency,
                unit=h.unit,
                habit_type=h.habit_type or 'numeric',
                two_min_threshold=h.two_min_threshold,
                normal_threshold=h.normal_threshold,
                hard_threshold=h.hard_threshold,
                impossible_threshold=h.impossible_threshold,
                logs=[
                    schemas.HabitLog(
                        id=l.id,
                        timestamp=l.timestamp.isoformat(),
                        value=l.value
                    ) for l in h.logs
                ]
            )
            results.append(habit_data)
        return Result.ok(results)
    except Exception as e:
        logger.error(f"Error fetching habits: {e}")
        return Result.fail(str(e))

@router.post("", response_model=Result[schemas.Habit, str])
@router.post("/", response_model=Result[schemas.Habit, str])
async def create_habit(data: schemas.HabitCreate, db: Session = Depends(get_db)):
    """Creates a new habit definition in the database."""
    try:
        new_habit = models.Habit(
            id=str(uuid.uuid4()),
            name=data.name,
            frequency=data.frequency,
            unit=data.unit,
            habit_type=data.habit_type,
            two_min_threshold=data.two_min_threshold,
            normal_threshold=data.normal_threshold,
            hard_threshold=data.hard_threshold,
            impossible_threshold=data.impossible_threshold
        )
        db.add(new_habit)
        db.commit()
        db.refresh(new_habit)
        
        habit_item = schemas.Habit(
            id=new_habit.id,
            name=new_habit.name,
            frequency=new_habit.frequency,
            unit=new_habit.unit,
            habit_type=new_habit.habit_type,
            two_min_threshold=new_habit.two_min_threshold,
            normal_threshold=new_habit.normal_threshold,
            hard_threshold=new_habit.hard_threshold,
            impossible_threshold=new_habit.impossible_threshold,
            logs=[]
        )
        return Result.ok(habit_item)
    except Exception as e:
        db.rollback()
        logger.error(f"Error creating habit: {e}")
        return Result.fail(str(e))

@router.put("/{habit_id}", response_model=Result[schemas.Habit, str])
@router.put("/{habit_id}/", response_model=Result[schemas.Habit, str])
async def update_habit(habit_id: str, data: schemas.HabitUpdate, db: Session = Depends(get_db)):
    """Updates an existing habit in the database."""
    habit = db.query(models.Habit).filter(models.Habit.id == habit_id).first()
    if not habit:
        return Result.fail("Habit not found")
    
    try:
        update_data = data.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(habit, key, value)
        
        db.commit()
        db.refresh(habit)
        return Result.ok(schemas.Habit.model_validate(habit))
    except Exception as e:
        db.rollback()
        logger.error(f"Error updating habit {habit_id}: {e}")
        return Result.fail(str(e))

@router.delete("/{habit_id}", response_model=Result[dict, str])
@router.delete("/{habit_id}/", response_model=Result[dict, str])
async def delete_habit(habit_id: str, db: Session = Depends(get_db)):
    """Permanently deletes a habit from the database."""
    habit = db.query(models.Habit).filter(models.Habit.id == habit_id).first()
    if not habit:
        return Result.fail("Habit not found")
    
    try:
        db.delete(habit)
        db.commit()
        return Result.ok({"success": True, "status": "deleted"})
    except Exception as e:
        db.rollback()
        logger.error(f"Error deleting habit {habit_id}: {e}")
        return Result.fail(str(e))

@router.post("/log", response_model=Result[dict, str])
@router.post("/log/", response_model=Result[dict, str])
async def add_habit_log(data: schemas.HabitLogCreate, db: Session = Depends(get_db)):
    """Adds a new log entry to the database."""
    habit = db.query(models.Habit).filter(models.Habit.id == data.habit_id).first()
    if not habit:
        return Result.fail("Habit not found")

    try:
        new_log = models.HabitLog(
            id=str(uuid.uuid4()),
            habit_id=data.habit_id,
            value=data.value,
            timestamp=datetime.now(timezone.utc)
        )
        db.add(new_log)
        db.commit()
        return Result.ok({"success": True, "status": "logged"})
    except Exception as e:
        db.rollback()
        logger.error(f"Error adding habit log: {e}")
        return Result.fail(str(e))

@router.put("/log", response_model=Result[dict, str])
@router.put("/log/", response_model=Result[dict, str])
async def update_habit_log(data: schemas.HabitLogCreate, db: Session = Depends(get_db)):
    """Updates today's log entry for a habit (simplified implementation)."""
    habit = db.query(models.Habit).filter(models.Habit.id == data.habit_id).first()
    if not habit:
        return Result.fail("Habit not found")

    try:
        # For simplicity in this direct API, we add a new log which aggregates
        # In a more complex setup, we'd find today's log and update it.
        # This matches the 'add' behavior but responds to the PUT method.
        new_log = models.HabitLog(
            id=str(uuid.uuid4()),
            habit_id=data.habit_id,
            value=data.value,
            timestamp=datetime.now(timezone.utc)
        )
        db.add(new_log)
        db.commit()
        return Result.ok({"success": True, "status": "updated"})
    except Exception as e:
        db.rollback()
        logger.error(f"Error updating habit log: {e}")
        return Result.fail(str(e))

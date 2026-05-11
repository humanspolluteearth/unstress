from fastapi import APIRouter, Depends, HTTPException
from typing import List, Optional
from sqlalchemy.orm import Session
from app.database import get_db
import app.models as models
from pydantic import BaseModel
from datetime import datetime, date, timezone
import uuid
from app.core.results import Result

# --- Schemas ---

class HabitLog(BaseModel):
    id: str
    timestamp: str
    value: float

class Habit(BaseModel):
    id: str
    name: str
    frequency: str
    unit: str = 'rep'
    habit_type: str = 'numeric'
    two_min_threshold: float
    normal_threshold: float
    hard_threshold: float
    impossible_threshold: float
    logs: List[HabitLog] = []

    model_config = {"from_attributes": True}

class HabitCreate(BaseModel):
    name: str
    frequency: str
    unit: str = 'rep'
    habit_type: str = 'numeric'
    two_min_threshold: float
    normal_threshold: float
    hard_threshold: float
    impossible_threshold: float

class HabitUpdate(BaseModel):
    name: Optional[str] = None
    frequency: Optional[str] = None
    unit: Optional[str] = None
    habit_type: Optional[str] = None
    two_min_threshold: Optional[float] = None
    normal_threshold: Optional[float] = None
    hard_threshold: Optional[float] = None
    impossible_threshold: Optional[float] = None

class HabitLogCreate(BaseModel):
    habit_id: str
    value: float

# --- Router ---

router = APIRouter()

@router.get("", response_model=Result[List[Habit], str])
@router.get("/", response_model=Result[List[Habit], str])
async def get_habits(db: Session = Depends(get_db)):
    """Returns all habits with their logs from the database."""
    db_habits = db.query(models.Habit).all()
    results = []
    for h in db_habits:
        habit_data = Habit(
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
                HabitLog(
                    id=l.id,
                    timestamp=l.timestamp.isoformat(),
                    value=l.value
                ) for l in h.logs
            ]
        )
        results.append(habit_data)
    return Result.ok(results)

@router.post("", response_model=Result[Habit, str])
@router.post("/", response_model=Result[Habit, str])
async def create_habit(data: HabitCreate, db: Session = Depends(get_db)):
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
        
        habit_item = Habit(
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
        return Result.fail(str(e))

@router.put("/{habit_id}", response_model=Result[Habit, str])
@router.put("/{habit_id}/", response_model=Result[Habit, str])
async def update_habit(habit_id: str, data: HabitUpdate, db: Session = Depends(get_db)):
    """Updates an existing habit in the database."""
    habit = db.query(models.Habit).filter(models.Habit.id == habit_id).first()
    if not habit:
        return Result.fail("Habit not found")
    
    try:
        update_data = data.dict(exclude_unset=True)
        for key, value in update_data.items():
            setattr(habit, key, value)
        
        db.commit()
        db.refresh(habit)
        return Result.ok(Habit.from_attributes(habit))
    except Exception as e:
        db.rollback()
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
        return Result.fail(str(e))

@router.post("/log", response_model=Result[dict, str])
@router.post("/log/", response_model=Result[dict, str])
async def add_habit_log(data: HabitLogCreate, db: Session = Depends(get_db)):
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
        return Result.fail(str(e))

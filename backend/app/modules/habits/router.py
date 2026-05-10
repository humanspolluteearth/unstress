from fastapi import APIRouter, Depends
from app.modules.habits.service import HabitsService, HabitUpdate, HabitLogCreate, HabitCreate, Habit
from app.core.results import Result
from typing import List
from sqlalchemy.orm import Session
from app.database import get_db

router = APIRouter(prefix="/habits", tags=["habits"])

@router.get("/")
async def get_habits(db: Session = Depends(get_db)) -> Result[List[Habit], str]:
    return await HabitsService.get_habits(db)

@router.post("/")
async def create_habit(data: HabitCreate, db: Session = Depends(get_db)) -> Result[Habit, str]:
    return await HabitsService.create_habit(data, db)

@router.put("/{habit_id}")
async def update_habit(habit_id: str, data: HabitUpdate, db: Session = Depends(get_db)) -> Result[dict, str]:
    return await HabitsService.update_habit(habit_id, data, db)

@router.delete("/{habit_id}")
async def delete_habit(habit_id: str, db: Session = Depends(get_db)) -> Result[dict, str]:
    return await HabitsService.delete_habit(habit_id, db)

@router.post("/log")
async def add_habit_log(data: HabitLogCreate, db: Session = Depends(get_db)) -> Result[dict, str]:
    return await HabitsService.add_habit_log(data, db)

@router.put("/log")
async def update_habit_log(data: HabitLogCreate, db: Session = Depends(get_db)) -> Result[dict, str]:
    return await HabitsService.update_habit_log(data, db)

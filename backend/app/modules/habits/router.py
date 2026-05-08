from fastapi import APIRouter
from app.modules.habits.service import HabitsService, HabitUpdate, HabitLogCreate, HabitCreate
from app.core.results import Result

router = APIRouter(prefix="/habits", tags=["habits"])

@router.get("/")
async def get_habits() -> Result[list, str]:
    return await HabitsService.get_habits()

@router.post("/")
async def create_habit(data: HabitCreate) -> Result[dict, str]:
    return await HabitsService.create_habit(data)

@router.put("/{habit_id}")
async def update_habit(habit_id: str, data: HabitUpdate) -> Result[dict, str]:
    return await HabitsService.update_habit(habit_id, data)

@router.delete("/{habit_id}")
async def delete_habit(habit_id: str) -> Result[dict, str]:
    return await HabitsService.delete_habit(habit_id)

@router.post("/log")
async def add_habit_log(data: HabitLogCreate) -> Result[dict, str]:
    return await HabitsService.add_habit_log(data)

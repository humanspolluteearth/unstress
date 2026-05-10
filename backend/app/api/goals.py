from fastapi import APIRouter
from app.modules.goals.service import GoalService, GoalCreate, Goal
from app.core.results import Result
from typing import List, Any

router = APIRouter(prefix="/goals", tags=["goals"])

@router.get("/")
async def get_goals() -> Result[List[Goal], str]:
    return await GoalService.get_goals()

@router.post("/")
async def create_goal(data: GoalCreate) -> Result[Goal, str]:
    return await GoalService.create_goal(data)

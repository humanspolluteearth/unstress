from fastapi import APIRouter
from app.modules.goals.service import GoalService, GoalCreate, Goal
from app.core.results import Result
from pydantic import UUID4
from typing import List

router = APIRouter(prefix="/goals", tags=["goals"])

@router.get("/")
async def get_goals() -> Result[List[Goal], str]:
    return await GoalService.get_goals()

@router.post("/")
async def create_goal(data: GoalCreate) -> Result[Goal, str]:
    return await GoalService.create_goal(data)

@router.get("/{goal_id}/progress")
async def get_goal_progress(goal_id: UUID4) -> Result[float, str]:
    return await GoalService.get_goal_progress(goal_id)

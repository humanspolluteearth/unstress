from fastapi import APIRouter
from app.modules.goals.service import GoalService, GoalCreate, Goal, GoalUpdate
from app.core.results import Result
from pydantic import UUID4
from typing import List

router = APIRouter(prefix="/goals", tags=["goals"])

@router.get("/")
async def get_goals() -> Result[List[Goal], str]:
    return await GoalService.get_goals()

@router.patch("/{goal_id}")
async def update_goal(goal_id: UUID4, data: GoalUpdate) -> Result[Goal, str]:
    return await GoalService.update_goal(goal_id, data)

@router.get("/{goal_id}/progress")
async def get_goal_progress(goal_id: UUID4) -> Result[float, str]:
    return await GoalService.get_goal_progress(goal_id)

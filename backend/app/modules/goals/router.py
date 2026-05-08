from fastapi import APIRouter
from app.modules.goals.service import GoalsService, GoalCreate, GoalAdjust
from app.core.results import Result

router = APIRouter(prefix="/goals", tags=["goals"])

@router.get("/")
async def get_goals() -> Result[list, str]:
    return await GoalsService.get_goals()

@router.post("/")
async def create_goal(data: GoalCreate) -> Result[dict, str]:
    return await GoalsService.create_goal(data)

@router.patch("/{goal_id}/adjust")
async def adjust_goal(goal_id: str, data: GoalAdjust) -> Result[dict, str]:
    return await GoalsService.adjust_progress(goal_id, data.current)

@router.post("/{goal_id}/focus")
async def set_goal_focus(goal_id: str) -> Result[dict, str]:
    return await GoalsService.set_focus(goal_id)

from typing import List, Optional, Dict, Any
from pydantic import BaseModel, UUID4
from app.core.results import Result
import uuid

class Goal(BaseModel):
    id: UUID4
    name: str
    description: Optional[str] = None
    type: str
    is_current_focus: bool = False
    parent_id: Optional[UUID4] = None
    metadata: Dict[str, Any] = {}
    progress: float = 0.0

class GoalCreate(BaseModel):
    name: str
    description: Optional[str] = None
    type: str
    parent_id: Optional[UUID4] = None

class GoalService:
    # Note: Legacy service removed mock data.
    # Goal operations are now primarily handled via api/goals.py using SQLAlchemy.
    @staticmethod
    async def get_goals() -> Result[List[Goal], str]:
        return Result.fail("Use /api/goals instead.")

    @staticmethod
    async def create_goal(data: GoalCreate) -> Result[Any, str]:
        return Result.fail("Use /api/goals instead.")

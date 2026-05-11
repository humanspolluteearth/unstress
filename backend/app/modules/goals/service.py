from typing import List, Optional, Dict, Any
from app.core.results import Result
from app.schemas import goals as schemas
import uuid

class GoalService:
    # Note: Legacy service removed mock data.
    # Goal operations are now primarily handled via api/goals.py using SQLAlchemy.
    @staticmethod
    async def get_goals() -> Result[List[schemas.Goal], str]:
        return Result.fail("Use /api/goals instead.")

    @staticmethod
    async def create_goal(data: schemas.GoalBase) -> Result[Any, str]:
        return Result.fail("Use /api/goals instead.")

    @staticmethod
    async def increment_progress(goal_id: str) -> Result[None, str]:
        # Simple placeholder for legacy listener
        return Result.ok(None)

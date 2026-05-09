from typing import List, Optional
from pydantic import BaseModel, UUID4
from app.core.results import Result

class Goal(BaseModel):
    id: UUID4
    name: str
    description: Optional[str] = None
    type: str # 'weekly', 'monthly', 'yearly'
    is_current_focus: bool = False
    parent_id: Optional[UUID4] = None
    progress: float = 0.0

class GoalCreate(BaseModel):
    name: str
    description: Optional[str] = None
    type: str
    parent_id: Optional[UUID4] = None

class GoalService:
    # In-memory mock
    _goals: List[Goal] = []

    @staticmethod
    async def get_goals() -> Result[List[Goal], str]:
        return Result.ok(GoalService._goals)

    @staticmethod
    async def create_goal(data: GoalCreate) -> Result[Goal, str]:
        import uuid
        new_goal = Goal(
            id=uuid.uuid4(),
            name=data.name,
            description=data.description,
            type=data.type,
            parent_id=data.parent_id
        )
        GoalService._goals.append(new_goal)
        return Result.ok(new_goal)

    @staticmethod
    async def get_goal_progress(goal_id: UUID4) -> Result[float, str]:
        # Implementation would link to tasks DB
        return Result.ok(0.0)

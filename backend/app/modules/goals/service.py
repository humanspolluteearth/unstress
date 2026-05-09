from typing import List, Optional, Dict, Any
from pydantic import BaseModel, UUID4
from app.core.results import Result
import uuid

class Goal(BaseModel):
    id: UUID4
    name: str
    description: Optional[str] = None
    type: str # 'weekly', 'monthly', 'yearly'
    is_current_focus: bool = False
    parent_id: Optional[UUID4] = None
    metadata: Dict[str, Any] = {}
    progress: float = 0.0

class GoalCreate(BaseModel):
    name: str
    description: Optional[str] = None
    type: str
    parent_id: Optional[UUID4] = None

class GoalUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    is_current_focus: Optional[bool] = None
    metadata: Optional[Dict[str, Any]] = None

class GoalService:
    _goals: List[Goal] = []

    @staticmethod
    async def get_goals() -> Result[List[Goal], str]:
        return Result.ok(GoalService._goals)

    @staticmethod
    async def create_goal(data: GoalCreate) -> Result[Goal, str]:
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
    async def update_goal(goal_id: UUID4, data: GoalUpdate) -> Result[Goal, str]:
        for goal in GoalService._goals:
            if goal.id == goal_id:
                if data.name: goal.name = data.name
                if data.description is not None: goal.description = data.description
                if data.metadata: goal.metadata = {**goal.metadata, **data.metadata}
                if data.is_current_focus is not None and data.is_current_focus:
                    # Clear other focus goals of same type
                    for other in GoalService._goals:
                        if other.type == goal.type:
                            other.is_current_focus = False
                    goal.is_current_focus = True
                return Result.ok(goal)
        return Result.fail("Goal not found")

    @staticmethod
    async def get_goal_progress(goal_id: UUID4) -> Result[float, str]:
        # Implementation would link to tasks DB
        return Result.ok(0.0)

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, HttpUrl
from typing import List, Optional
import uuid

# Schema Definitions
class GoalModel(BaseModel):
    title: str
    description: str
    priority: str  # 'critical', 'high', 'medium', 'low'
    category: str
    time_frame: str # 'weekly', 'monthly', 'yearly'
    tags: List[str] = []
    links: List[HttpUrl] = []
    references: List[str] = []
    tasks: List[dict] = [] # Each task: id, text, completed

class Goal(GoalModel):
    id: uuid.UUID
    progress: float = 0.0

# Helper Logic
def calculate_goal_progress(tasks: List[dict]) -> float:
    if not tasks:
        return 0.0
    completed = [t for t in tasks if t.get('completed') is True]
    return round((len(completed) / len(tasks)) * 100, 2)

# In-memory store
goals_db: List[Goal] = []

router = APIRouter()

@router.get("")
async def get_goals() -> List[Goal]:
    """Retrieves all goals from the in-memory store."""
    return goals_db

@router.post("")
async def create_goal(goal_data: GoalModel) -> Goal:
    """Creates a new goal with calculated progress."""
    progress = calculate_goal_progress(goal_data.tasks)
    new_goal = Goal(
        id=uuid.uuid4(),
        progress=progress,
        **goal_data.model_dump()
    )
    goals_db.append(new_goal)
    return new_goal

@router.put("/{goal_id}")
async def update_goal(goal_id: uuid.UUID, goal_data: GoalModel) -> Goal:
    """Updates an existing goal and recalculates progress."""
    for i, g in enumerate(goals_db):
        if g.id == goal_id:
            progress = calculate_goal_progress(goal_data.tasks)
            updated_goal = Goal(
                id=goal_id,
                progress=progress,
                **goal_data.model_dump()
            )
            goals_db[i] = updated_goal
            return updated_goal
    raise HTTPException(status_code=404, detail="Goal not found")

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
    label_color: str = "#ffffff" # Hex string for UI personalization
    assignee_initials: str = "--" # Visual marker for delegation
    tags: List[str] = []
    links: List[HttpUrl] = []
    references: List[str] = []
    tasks: List[dict] = [] # Each task: id, text, completed

class Goal(GoalModel):
    id: uuid.UUID
    progress: float = 0.0
    total_tasks: int = 0
    completed_tasks: int = 0

# Helper Logic
def sync_goal_stats(goal: Goal):
    """Recalculates progress and task counts for a goal."""
    tasks = goal.tasks
    goal.total_tasks = len(tasks)
    goal.completed_tasks = len([t for t in tasks if t.get('completed') is True])
    if goal.total_tasks > 0:
        goal.progress = round((goal.completed_tasks / goal.total_tasks) * 100, 2)
    else:
        goal.progress = 0.0

# In-memory store
goals_db: List[Goal] = []

router = APIRouter()

@router.get("")
async def get_goals() -> List[Goal]:
    """Retrieves all goals from the in-memory store."""
    return goals_db

@router.post("")
async def create_goal(goal_data: GoalModel) -> Goal:
    """Creates a new goal and initializes stats."""
    new_goal = Goal(
        id=uuid.uuid4(),
        **goal_data.model_dump()
    )
    sync_goal_stats(new_goal)
    goals_db.append(new_goal)
    return new_goal

@router.put("/{goal_id}")
async def update_goal(goal_id: uuid.UUID, goal_data: GoalModel) -> Goal:
    """Updates an existing goal and recalculates stats."""
    for i, g in enumerate(goals_db):
        if g.id == goal_id:
            updated_goal = Goal(
                id=goal_id,
                **goal_data.model_dump()
            )
            sync_goal_stats(updated_goal)
            goals_db[i] = updated_goal
            return updated_goal
    raise HTTPException(status_code=404, detail="Goal not found")

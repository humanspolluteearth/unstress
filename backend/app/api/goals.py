from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, HttpUrl
from typing import List, Optional
import uuid

# Schema Definitions - Matching Habit Pydantic Pattern
class GoalModel(BaseModel):
    title: str
    description: str
    priority: str  # 'critical', 'high', 'medium', 'low'
    category: str
    tags: List[str] = []
    links: List[HttpUrl] = []
    references: List[str] = []
    tasks: List[dict] = []

class Goal(GoalModel):
    id: uuid.UUID

# In-memory store (Matching Habit modularity)
goals_db: List[Goal] = []

# Router Initialization - Matching Habit Router Pattern
router = APIRouter()

@router.get("")
async def get_goals() -> List[Goal]:
    """Retrieves all goals from the in-memory store."""
    return goals_db

@router.post("")
async def create_goal(goal_data: GoalModel) -> Goal:
    """Creates a new goal with a generated UUID."""
    new_goal = Goal(id=uuid.uuid4(), **goal_data.model_dump())
    goals_db.append(new_goal)
    return new_goal

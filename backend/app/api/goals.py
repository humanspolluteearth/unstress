from fastapi import APIRouter
from pydantic import BaseModel, HttpUrl
from typing import List, Optional
import uuid

# Schema Definitions
class GoalModel(BaseModel):
    title: str
    description: str
    priority: str
    category: str
    tags: List[str] = []
    links: List[HttpUrl] = []
    references: List[str] = []
    tasks: List[dict] = []

class Goal(GoalModel):
    id: uuid.UUID

# In-memory store
goals_db: List[Goal] = []

router = APIRouter()

@router.get("")
async def get_goals():
    return goals_db

@router.post("")
async def create_goal(goal_data: GoalModel):
    new_goal = Goal(id=uuid.uuid4(), **goal_data.model_dump())
    goals_db.append(new_goal)
    return new_goal

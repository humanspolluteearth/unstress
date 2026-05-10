from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel, HttpUrl
from typing import List, Optional
import uuid
from app.core.dispatcher import TaskService

# Schema Definitions
class GoalModel(BaseModel):
    title: str
    description: str
    markdown_content: str = "" # Detailed intelligence for the side panel
    priority: str  # 'critical', 'high', 'medium', 'low'
    category: str
    time_frame: str # 'weekly', 'monthly', 'yearly'
    deadline: Optional[str] = None # ISO date string
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
    active_tasks_count: int = 0 # Specifically requested field

# Helper Logic
def sync_goal_stats(goal: Goal):
    """Recalculates progress and task counts for a goal, including external tasks."""
    # Internal tasks (checklist)
    internal_tasks = goal.tasks
    
    # External tasks (linked via TaskService)
    # TaskService uses string IDs, so we convert goal.id to string for matching
    external_tasks = [t for t in TaskService._tasks.values() if t.get('goal_id') == str(goal.id)]
    
    total_internal = len(internal_tasks)
    completed_internal = len([t for t in internal_tasks if t.get('completed') is True])
    
    total_external = len(external_tasks)
    completed_external = len([t for t in external_tasks if t.get('status') == 'Done'])
    
    # Active tasks are those not in 'Done' status (for external) or not completed (for internal)
    active_internal = total_internal - completed_internal
    active_external = len([t for t in external_tasks if t.get('status') != 'Done'])
    
    goal.total_tasks = total_internal + total_external
    goal.completed_tasks = completed_internal + completed_external
    goal.active_tasks_count = active_internal + active_external
    
    if goal.total_tasks > 0:
        goal.progress = round((goal.completed_tasks / goal.total_tasks) * 100, 2)
    else:
        goal.progress = 0.0

# In-memory store (Starting clean)
goals_db: List[Goal] = []

router = APIRouter()

@router.get("")
async def get_goals() -> List[Goal]:
    """Retrieves all goals with updated stats from TaskService."""
    for goal in goals_db:
        sync_goal_stats(goal)
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

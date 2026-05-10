from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel, HttpUrl
from typing import List, Optional, Any
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
    active_tasks_count: int = 0

# Helper Logic
def sync_goal_stats(goal: Goal):
    """Recalculates progress and task counts for a goal, including external tasks."""
    internal_tasks = goal.tasks
    external_tasks = [t for t in TaskService._tasks.values() if t.get('goal_id') == str(goal.id)]
    
    total_internal = len(internal_tasks)
    completed_internal = len([t for t in internal_tasks if t.get('completed') is True])
    
    total_external = len(external_tasks)
    completed_external = len([t for t in external_tasks if t.get('status') == 'Done'])
    
    active_internal = total_internal - completed_internal
    active_external = len([t for t in external_tasks if t.get('status') != 'Done'])
    
    goal.total_tasks = total_internal + total_external
    goal.completed_tasks = completed_internal + completed_external
    goal.active_tasks_count = active_internal + active_external
    
    if goal.total_tasks > 0:
        goal.progress = round((goal.completed_tasks / goal.total_tasks) * 100, 2)
    else:
        goal.progress = 0.0

# Pre-defined UUIDs for seeding and linking
GOAL_INFRA_ID = uuid.UUID("e7b3a9c1-5c8e-4b9e-9d2a-7f1b2c3d4e5f")
GOAL_UI_ID = uuid.UUID("a1b2c3d4-e5f6-4a5b-bcde-1234567890ab")

# In-memory store seeded with mockup data
goals_db: List[Goal] = [
    Goal(
        id=GOAL_INFRA_ID,
        title="Stabilize Arch Linux Sidecar",
        description="Ensure the FastAPI backend runs natively on Python 3.14 without binary conflicts.",
        markdown_content="## Mission Objectives\n- Zero `uvloop` compilation errors.\n- Port 8000 consistency across reboots.\n- Direct 127.0.0.1 connectivity verified.",
        priority="critical",
        category="Infrastructure",
        time_frame="weekly",
        deadline="2026-05-15",
        label_color="#ef4444",
        assignee_initials="MH",
        tags=["arch", "python", "sys"],
        tasks=[
            {"id": "int-1", "text": "Audit main.py inclusion order", "completed": True},
            {"id": "int-2", "text": "Verify CORS allowance", "completed": False}
        ]
    ),
    Goal(
        id=GOAL_UI_ID,
        title="Implement High-Density Goal UI",
        description="Refactor the goal dashboard to use adaptive grid cards and Trello-style metadata.",
        markdown_content="## Design Specification\n- 3-column detail panel slide-out.\n- Trello-style checklist badges on cards.\n- Color-coded progress bars by priority.",
        priority="high",
        category="Frontend",
        time_frame="weekly",
        deadline="2026-05-12",
        label_color="#f97316",
        assignee_initials="MH",
        tags=["react", "lucide", "ui"],
        tasks=[
            {"id": "int-3", "text": "Create GoalCard component", "completed": True},
            {"id": "int-4", "text": "Implement GoalDetailPanel layout", "completed": True}
        ]
    )
]

router = APIRouter()

@router.get("")
async def get_goals() -> List[dict]:
    """Retrieves all goals with updated stats from TaskService."""
    results = []
    for goal in goals_db:
        sync_goal_stats(goal)
        goal_dict = goal.model_dump()
        external_tasks = [t for t in TaskService._tasks.values() if t.get('goal_id') == str(goal.id)]
        goal_dict['external_tasks'] = external_tasks
        results.append(goal_dict)
    return results

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

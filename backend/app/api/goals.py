from fastapi import APIRouter, HTTPException, Request, Depends
from pydantic import BaseModel, HttpUrl
from typing import List, Optional, Any
import uuid
from sqlalchemy.orm import Session
from app.database import get_db
import app.models as models
from app.core.results import Result

# Schema Definitions
class GoalModel(BaseModel):
    title: str
    description: str
    markdown_content: str = ""
    priority: str
    category: str
    time_frame: str
    deadline: Optional[str] = None
    label_color: str = "#ffffff"
    assignee_initials: str = "--"
    tags: List[str] = []
    links: List[HttpUrl] = []
    references: List[str] = []
    internal_tasks: List[dict] = []

class Goal(GoalModel):
    id: uuid.UUID
    progress: float = 0.0
    total_tasks: int = 0
    completed_tasks: int = 0
    active_tasks_count: int = 0

# Helper Logic
def sync_goal_stats(goal_obj: models.Goal, db_tasks: List[models.Task]):
    """Recalculates progress and task counts for a goal."""
    internal_tasks = goal_obj.internal_tasks or []
    external_tasks = db_tasks
    
    total_internal = len(internal_tasks)
    completed_internal = len([t for t in internal_tasks if t.get('completed') is True])
    
    total_external = len(external_tasks)
    completed_external = len([t for t in external_tasks if t.status == 'Done'])
    
    active_internal = total_internal - completed_internal
    active_external = len([t for t in external_tasks if t.status != 'Done'])
    
    total_tasks = total_internal + total_external
    completed_tasks = completed_internal + completed_external
    active_tasks_count = active_internal + active_external
    
    progress = 0.0
    if total_tasks > 0:
        progress = round((completed_tasks / total_tasks) * 100, 2)
        
    return {
        "progress": progress,
        "total_tasks": total_tasks,
        "completed_tasks": completed_tasks,
        "active_tasks_count": active_tasks_count
    }

router = APIRouter()

@router.get("", response_model=Result[List[dict], str])
async def get_goals(db: Session = Depends(get_db)):
    """Retrieves all goals with updated stats from the database."""
    goals = db.query(models.Goal).all()
    results = []
    for goal in goals:
        # Get tasks linked to this goal
        external_tasks = db.query(models.Task).filter(models.Task.goal_id == goal.id).all()
        stats = sync_goal_stats(goal, external_tasks)
        
        goal_dict = {
            "id": goal.id,
            "title": goal.title,
            "description": goal.description,
            "markdown_content": goal.markdown_content,
            "priority": goal.priority,
            "category": goal.category,
            "time_frame": goal.time_frame,
            "deadline": goal.deadline,
            "label_color": goal.label_color,
            "assignee_initials": goal.assignee_initials,
            "tags": goal.tags,
            "links": goal.links,
            "references": goal.references,
            "tasks": goal.internal_tasks,
            "external_tasks": [
                {
                    "id": t.id,
                    "title": t.title,
                    "status": t.status,
                    "priority": t.priority,
                    "goal_id": t.goal_id
                } for t in external_tasks
            ],
            **stats
        }
        results.append(goal_dict)
    return Result.ok(results)

@router.post("", response_model=Result[dict, str])
async def create_goal(goal_data: GoalModel, db: Session = Depends(get_db)):
    """Creates a new goal in the database."""
    try:
        new_goal = models.Goal(
            id=str(uuid.uuid4()),
            title=goal_data.title,
            description=goal_data.description,
            markdown_content=goal_data.markdown_content,
            priority=goal_data.priority,
            category=goal_data.category,
            time_frame=goal_data.time_frame,
            deadline=goal_data.deadline,
            label_color=goal_data.label_color,
            assignee_initials=goal_data.assignee_initials,
            tags=goal_data.tags,
            links=[str(l) for l in goal_data.links],
            references=goal_data.references,
            internal_tasks=goal_data.internal_tasks
        )
        db.add(new_goal)
        db.commit()
        db.refresh(new_goal)
        
        # Return with initial stats
        stats = sync_goal_stats(new_goal, [])
        return Result.ok({**new_goal.__dict__, **stats})
    except Exception as e:
        db.rollback()
        return Result.fail(str(e))

@router.put("/{goal_id}", response_model=Result[dict, str])
async def update_goal(goal_id: uuid.UUID, goal_data: GoalModel, db: Session = Depends(get_db)):
    """Updates an existing goal in the database."""
    goal = db.query(models.Goal).filter(models.Goal.id == str(goal_id)).first()
    if not goal:
        return Result.fail("Goal not found")
        
    try:
        goal.title = goal_data.title
        goal.description = goal_data.description
        goal.markdown_content = goal_data.markdown_content
        goal.priority = goal_data.priority
        goal.category = goal_data.category
        goal.time_frame = goal_data.time_frame
        goal.deadline = goal_data.deadline
        goal.label_color = goal_data.label_color
        goal.assignee_initials = goal_data.assignee_initials
        goal.tags = goal_data.tags
        goal.links = [str(l) for l in goal_data.links]
        goal.references = goal_data.references
        goal.internal_tasks = goal_data.internal_tasks
        
        db.commit()
        db.refresh(goal)
        
        external_tasks = db.query(models.Task).filter(models.Task.goal_id == goal.id).all()
        stats = sync_goal_stats(goal, external_tasks)
        return Result.ok({**goal.__dict__, **stats})
    except Exception as e:
        db.rollback()
        return Result.fail(str(e))

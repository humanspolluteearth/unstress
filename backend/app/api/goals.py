from fastapi import APIRouter, HTTPException, Request, Depends
from typing import List, Optional, Any
import uuid
import logging
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models import goals as models
from app.schemas import goals as schemas
from app.core.results import Result

logger = logging.getLogger(__name__)

# Helper Logic
def sync_goal_stats(goal_obj: models.Goal, db_tasks: List[Any]):
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
@router.get("/", response_model=Result[List[dict], str])
async def get_goals(db: Session = Depends(get_db)):
    """Retrieves all goals with updated stats from the database."""
    try:
        goals = db.query(models.Goal).all()
        results = []
        for goal in goals:
            # Import models.Task here to avoid circular if any, though not likely now
            # Actually models is app.models.goals which doesn't have Task if split
            # Wait, Task is in app.models.goals in my current split.
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
                "is_current_focus": goal.is_current_focus,
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
    except Exception as e:
        logger.error(f"Error fetching goals: {e}")
        return Result.fail(str(e))

@router.post("", response_model=Result[dict, str])
@router.post("/", response_model=Result[dict, str])
async def create_goal(goal_data: schemas.GoalBase, db: Session = Depends(get_db)):
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
            internal_tasks=goal_data.internal_tasks,
            is_current_focus=goal_data.is_current_focus
        )
        db.add(new_goal)
        db.commit()
        db.refresh(new_goal)
        
        # Return with initial stats
        stats = sync_goal_stats(new_goal, [])
        goal_dict = {
            "id": new_goal.id,
            "title": new_goal.title,
            "description": new_goal.description,
            "markdown_content": new_goal.markdown_content,
            "priority": new_goal.priority,
            "category": new_goal.category,
            "time_frame": new_goal.time_frame,
            "deadline": new_goal.deadline,
            "label_color": new_goal.label_color,
            "assignee_initials": new_goal.assignee_initials,
            "tags": new_goal.tags,
            "links": new_goal.links,
            "references": new_goal.references,
            "tasks": new_goal.internal_tasks,
            "is_current_focus": new_goal.is_current_focus,
        }
        return Result.ok({**goal_dict, **stats})
    except Exception as e:
        db.rollback()
        logger.error(f"Error creating goal: {e}")
        return Result.fail(str(e))

@router.put("/{goal_id}", response_model=Result[dict, str])
@router.put("/{goal_id}/", response_model=Result[dict, str])
async def update_goal(goal_id: uuid.UUID, goal_data: schemas.GoalBase, db: Session = Depends(get_db)):
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
        goal.is_current_focus = goal_data.is_current_focus
        
        db.commit()
        db.refresh(goal)
        
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
            "is_current_focus": goal.is_current_focus,
        }
        return Result.ok({**goal_dict, **stats})
    except Exception as e:
        db.rollback()
        logger.error(f"Error updating goal {goal_id}: {e}")
        return Result.fail(str(e))

@router.delete("/{goal_id}", response_model=Result[bool, str])
@router.delete("/{goal_id}/", response_model=Result[bool, str])
async def delete_goal(goal_id: uuid.UUID, db: Session = Depends(get_db)):
    """Deletes a goal and unlinks its tasks."""
    goal = db.query(models.Goal).filter(models.Goal.id == str(goal_id)).first()
    if not goal:
        return Result.fail("Goal not found")
    
    try:
        # Unlink tasks
        db.query(models.Task).filter(models.Task.goal_id == str(goal_id)).update({"goal_id": None})
        
        db.delete(goal)
        db.commit()
        return Result.ok(True)
    except Exception as e:
        db.rollback()
        logger.error(f"Error deleting goal {goal_id}: {e}")
        return Result.fail(str(e))

@router.post("/{goal_id}/focus", response_model=Result[bool, str])
@router.post("/{goal_id}/focus/", response_model=Result[bool, str])
async def set_goal_focus(goal_id: uuid.UUID, db: Session = Depends(get_db)):
    """Sets a goal as the current focus and unsets others."""
    goal = db.query(models.Goal).filter(models.Goal.id == str(goal_id)).first()
    if not goal:
        return Result.fail("Goal not found")
    
    try:
        # Unset focus for all other goals
        db.query(models.Goal).update({"is_current_focus": False})
        
        # Set focus for this goal
        goal.is_current_focus = True
        db.commit()
        return Result.ok(True)
    except Exception as e:
        db.rollback()
        logger.error(f"Error setting goal focus {goal_id}: {e}")
        return Result.fail(str(e))

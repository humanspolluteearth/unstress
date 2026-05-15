from fastapi import APIRouter, Depends, HTTPException, Body
from typing import List, Optional, Dict, Any
import logging
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models import schedule as models
from app.schemas import schedules as schemas
from datetime import datetime, timezone, timedelta
import uuid
from app.core.results import Result
from dateutil.relativedelta import relativedelta

logger = logging.getLogger(__name__)

router = APIRouter()

def ensure_utc(dt: datetime) -> datetime:
    """Ensures a datetime object is UTC-aware."""
    if dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(timezone.utc)

def expand_recurring_events(events: List[models.ScheduledEvent], days_ahead: int = 60) -> List[dict]:
    """Expands recurring events into individual instances for the UI."""
    expanded = []
    now = datetime.now(timezone.utc)
    end_window = now + timedelta(days=days_ahead)
    
    for e in events:
        start_time = ensure_utc(e.start_time)
        end_time = ensure_utc(e.end_time)
        
        # Always include the original/base event
        expanded.append({
            "id": e.id,
            "title": e.title,
            "start_time": start_time,
            "end_time": end_time,
            "item_type": "event",
            "is_conflict": e.is_conflict,
            "repeat_pattern": e.repeat_pattern,
            "goal_id": e.goal_id
        })
        
        if not e.repeat_pattern:
            continue
            
        current_start = start_time
        current_end = end_time
        
        # Generate instances up to the end_window
        while current_start < end_window:
            if e.repeat_pattern == 'Daily':
                current_start += timedelta(days=1)
                current_end += timedelta(days=1)
            elif e.repeat_pattern == 'Weekly':
                current_start += timedelta(weeks=1)
                current_end += timedelta(weeks=1)
            elif e.repeat_pattern == 'Monthly':
                current_start += relativedelta(months=1)
                current_end += relativedelta(months=1)
            else:
                break
                
            if current_start > end_window:
                break
                
            expanded.append({
                "id": f"{e.id}_{current_start.timestamp()}", # Unique ID for the instance
                "title": e.title,
                "start_time": current_start,
                "end_time": current_end,
                "item_type": "event",
                "is_conflict": e.is_conflict,
                "repeat_pattern": e.repeat_pattern,
                "goal_id": e.goal_id
            })
            
    return expanded

@router.get("", response_model=Result[List[dict], str])
@router.get("/", response_model=Result[List[dict], str])
async def get_schedule(db: Session = Depends(get_db)):
    """Retrieves all scheduled events with expanded recurring instances."""
    try:
        events = db.query(models.ScheduledEvent).all()
        results = expand_recurring_events(events)
        return Result.ok(results)
    except Exception as e:
        logger.error(f"Error fetching schedule: {e}")
        return Result.fail(str(e))

@router.post("", response_model=Result[dict, str])
@router.post("/", response_model=Result[dict, str])
async def create_event(data: schemas.EventCreate, db: Session = Depends(get_db)):
    """Creates a new event in the database."""
    try:
        # Check conflicts
        existing_events = db.query(models.ScheduledEvent).all()
        is_conflict = False
        new_start = ensure_utc(data.start_time)
        new_end = ensure_utc(data.end_time)
        
        for e in existing_events:
            e_start = ensure_utc(e.start_time)
            e_end = ensure_utc(e.end_time)
            if new_start < e_end and e_start < new_end:
                is_conflict = True
                break
                
        new_event = models.ScheduledEvent(
            id=str(uuid.uuid4()),
            title=data.title,
            start_time=new_start,
            end_time=new_end,
            repeat_pattern=data.repeat_pattern,
            is_conflict=is_conflict,
            goal_id=data.goal_id
        )
        db.add(new_event)
        db.commit()
        db.refresh(new_event)

        event_dict = {
            "id": new_event.id,
            "title": new_event.title,
            "start_time": new_event.start_time,
            "end_time": new_event.end_time,
            "item_type": "event",
            "is_conflict": new_event.is_conflict,
            "repeat_pattern": new_event.repeat_pattern,
            "goal_id": new_event.goal_id
        }
        return Result.ok(event_dict)
    except Exception as e:
        db.rollback()
        logger.error(f"Error creating event: {e}")
        return Result.fail(str(e))

@router.put("/{event_id}", response_model=Result[dict, str])
@router.put("/{event_id}/", response_model=Result[dict, str])
async def update_event(event_id: str, data: schemas.EventUpdate, db: Session = Depends(get_db)):
    """Updates an existing event in the database."""
    event = db.query(models.ScheduledEvent).filter(models.ScheduledEvent.id == event_id).first()
    if not event:
        return Result.fail("Event not found")
    
    try:
        update_data = data.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(event, key, value)
            
        # Re-check conflicts if times changed
        if "start_time" in update_data or "end_time" in update_data:
            existing_events = db.query(models.ScheduledEvent).filter(models.ScheduledEvent.id != event_id).all()
            is_conflict = False
            new_start = ensure_utc(event.start_time)
            new_end = ensure_utc(event.end_time)
            
            for e in existing_events:
                e_start = ensure_utc(e.start_time)
                e_end = ensure_utc(e.end_time)
                if new_start < e_end and e_start < new_end:
                    is_conflict = True
                    break
            event.is_conflict = is_conflict
            
        db.commit()
        db.refresh(event)
        
        event_dict = {
            "id": event.id,
            "title": event.title,
            "start_time": event.start_time,
            "end_time": event.end_time,
            "item_type": "event",
            "is_conflict": event.is_conflict,
            "repeat_pattern": event.repeat_pattern,
            "repeat_days": event.repeat_days,
            "goal_id": event.goal_id
        }
        return Result.ok(event_dict)
    except Exception as e:
        db.rollback()
        logger.error(f"Error updating event {event_id}: {e}")
        return Result.fail(str(e))

@router.delete("/{event_id}", response_model=Result[dict, str])
@router.delete("/{event_id}/", response_model=Result[dict, str])
async def delete_event(event_id: str, db: Session = Depends(get_db)):
    """Deletes an event from the database."""
    event = db.query(models.ScheduledEvent).filter(models.ScheduledEvent.id == event_id).first()
    if not event:
        return Result.fail("Event not found")
    
    try:
        db.delete(event)
        db.commit()
        return Result.ok({"success": True, "status": "deleted"})
    except Exception as e:
        db.rollback()
        logger.error(f"Error deleting event {event_id}: {e}")
        return Result.fail(str(e))
id}: {e}")
        return Result.fail(str(e))
        event_dict = {
            "id": event.id,
            "title": event.title,
            "start_time": event.start_time,
            "end_time": event.end_time,
            "item_type": "event",
            "is_conflict": event.is_conflict,
            "repeat_pattern": event.repeat_pattern,
            "goal_id": event.goal_id
        }
        return Result.ok(event_dict)
    except Exception as e:
        db.rollback()
        logger.error(f"Error updating event {event_id}: {e}")
        return Result.fail(str(e))

@router.delete("/{event_id}", response_model=Result[dict, str])
@router.delete("/{event_id}/", response_model=Result[dict, str])
async def delete_event(event_id: str, db: Session = Depends(get_db)):
    """Deletes an event from the database."""
    event = db.query(models.ScheduledEvent).filter(models.ScheduledEvent.id == event_id).first()
    if not event:
        return Result.fail("Event not found")
    
    try:
        db.delete(event)
        db.commit()
        return Result.ok({"success": True, "status": "deleted"})
    except Exception as e:
        db.rollback()
        logger.error(f"Error deleting event {event_id}: {e}")
        return Result.fail(str(e))

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
    # Window: 30 days back, 60 days forward
    start_window = now - timedelta(days=30)
    end_window = now + timedelta(days=days_ahead)
    
    for e in events:
        base_start = ensure_utc(e.start_time)
        base_end = ensure_utc(e.end_time)
        
        # Add the base event if it's within window
        if base_start < end_window and base_end > start_window:
            expanded.append({
                "id": e.id,
                "title": e.title,
                "start_time": base_start,
                "end_time": base_end,
                "item_type": "event",
                "is_conflict": e.is_conflict,
                "repeat_pattern": e.repeat_pattern,
                "repeat_days": e.repeat_days,
                "goal_id": e.goal_id
            })
        
        if not e.repeat_pattern:
            continue

        # Parse repeat_days safely
        r_days = []
        if e.repeat_days:
            try:
                if isinstance(e.repeat_days, str):
                    import json
                    r_days = [int(x) for x in json.loads(e.repeat_days)]
                else:
                    r_days = [int(x) for x in e.repeat_days]
            except Exception as ex:
                logger.error(f"Error parsing repeat_days for event {e.id}: {ex}")
                r_days = []
            
        # Optimization: Jump near the start window
        current_start = base_start
        current_end = base_end
        
        if current_start < start_window:
            if e.repeat_pattern == 'Daily':
                diff = (start_window - current_start).days
                current_start += timedelta(days=diff)
                current_end += timedelta(days=diff)
            elif e.repeat_pattern == 'Weekly':
                diff_weeks = (start_window - current_start).days // 7
                current_start += timedelta(weeks=diff_weeks)
                current_end += timedelta(weeks=diff_weeks)
            elif e.repeat_pattern == 'Monthly':
                diff_months = (start_window.year - current_start.year) * 12 + (start_window.month - current_start.month)
                if diff_months > 0:
                    current_start += relativedelta(months=diff_months)
                    current_end += relativedelta(months=diff_months)

        # Generate instances within the window
        while current_start < end_window:
            if e.repeat_pattern == 'Daily':
                current_start += timedelta(days=1)
                current_end += timedelta(days=1)
            elif e.repeat_pattern == 'Weekly':
                if r_days:
                    # For specific days, we move day-by-day
                    current_start += timedelta(days=1)
                    current_end += timedelta(days=1)
                    if current_start >= end_window: break
                    
                    js_weekday = (current_start.weekday() + 1) % 7
                    if js_weekday not in r_days:
                        continue
                else:
                    # Standard weekly recurrence
                    current_start += timedelta(weeks=1)
                    current_end += timedelta(weeks=1)
            elif e.repeat_pattern == 'Monthly':
                current_start += relativedelta(months=1)
                current_end += relativedelta(months=1)
            else:
                break
                
            if current_start > end_window:
                break
            
            # Avoid duplicating the base event
            if current_start == base_start:
                continue
            
            # Only add if within window
            if current_start > start_window:
                expanded.append({
                    "id": f"{e.id}_{current_start.timestamp()}",
                    "title": e.title,
                    "start_time": current_start,
                    "end_time": current_end,
                    "item_type": "event",
                    "is_conflict": e.is_conflict,
                    "repeat_pattern": e.repeat_pattern,
                    "repeat_days": e.repeat_days,
                    "goal_id": e.goal_id
                })
            
    return expanded

@router.get("", response_model=Result[List[schemas.ScheduledItem], str])
@router.get("/", response_model=Result[List[schemas.ScheduledItem], str])
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
            repeat_days=data.repeat_days,
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
            "repeat_days": new_event.repeat_days,
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

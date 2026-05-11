from fastapi import APIRouter, Depends, HTTPException, Body
from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from app.database import get_db
import app.models as models
from pydantic import BaseModel, validator
from datetime import datetime, timezone
import uuid
from app.core.results import Result

# --- Schemas ---

class EventCreate(BaseModel):
    title: str
    start_time: datetime
    end_time: datetime
    repeat_pattern: Optional[str] = None
    goal_id: Optional[str] = None

    @validator('start_time', 'end_time', pre=True)
    def ensure_utc_aware(cls, v):
        try:
            if isinstance(v, str):
                dt = datetime.fromisoformat(v.replace('Z', '+00:00'))
            elif isinstance(v, datetime):
                dt = v
            else:
                return v
            if dt.tzinfo is None:
                return dt.replace(tzinfo=timezone.utc)
            return dt.astimezone(timezone.utc)
        except Exception:
            raise ValueError("TIMEZONE_MISMATCH")

class EventUpdate(BaseModel):
    title: Optional[str] = None
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    repeat_pattern: Optional[str] = None
    goal_id: Optional[str] = None

    @validator('start_time', 'end_time', pre=True)
    def ensure_utc_aware(cls, v):
        if v is None:
            return None
        try:
            if isinstance(v, str):
                dt = datetime.fromisoformat(v.replace('Z', '+00:00'))
            elif isinstance(v, datetime):
                dt = v
            else:
                return v
            if dt.tzinfo is None:
                return dt.replace(tzinfo=timezone.utc)
            return dt.astimezone(timezone.utc)
        except Exception:
            raise ValueError("TIMEZONE_MISMATCH")

# --- Router ---

router = APIRouter()

@router.get("", response_model=Result[List[dict], str])
@router.get("/", response_model=Result[List[dict], str])
async def get_schedule(db: Session = Depends(get_db)):
    """Retrieves all scheduled events from the database."""
    events = db.query(models.ScheduledEvent).all()
    results = [
        {
            "id": e.id,
            "title": e.title,
            "start_time": e.start_time,
            "end_time": e.end_time,
            "item_type": "event",
            "is_conflict": e.is_conflict,
            "goal_id": e.goal_id
        } for e in events
    ]
    return Result.ok(results)

@router.post("", response_model=Result[dict, str])
@router.post("/", response_model=Result[dict, str])
async def create_event(data: EventCreate, db: Session = Depends(get_db)):
    """Creates a new event in the database."""
    try:
        # Simple overlap check for conflict flag
        existing_events = db.query(models.ScheduledEvent).all()
        is_conflict = False
        for e in existing_events:
            if data.start_time < e.end_time and e.start_time < data.end_time:
                is_conflict = True
                break
                
        new_event = models.ScheduledEvent(
            id=str(uuid.uuid4()),
            title=data.title,
            start_time=data.start_time,
            end_time=data.end_time,
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
            "goal_id": new_event.goal_id
        }
        return Result.ok(event_dict)
    except Exception as e:
        db.rollback()
        return Result.fail(str(e))

@router.put("/{event_id}", response_model=Result[dict, str])
@router.put("/{event_id}/", response_model=Result[dict, str])
async def update_event(event_id: str, data: EventUpdate, db: Session = Depends(get_db)):
    """Updates an existing event in the database."""
    event = db.query(models.ScheduledEvent).filter(models.ScheduledEvent.id == event_id).first()
    if not event:
        return Result.fail("Event not found")
    
    try:
        update_data = data.dict(exclude_unset=True)
        for key, value in update_data.items():
            setattr(event, key, value)
            
        # Re-check conflicts if times changed
        if "start_time" in update_data or "end_time" in update_data:
            existing_events = db.query(models.ScheduledEvent).filter(models.ScheduledEvent.id != event_id).all()
            is_conflict = False
            for e in existing_events:
                if event.start_time < e.end_time and e.start_time < event.end_time:
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
            "goal_id": event.goal_id
        }
        return Result.ok(event_dict)
    except Exception as e:
        db.rollback()
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
        return Result.fail(str(e))

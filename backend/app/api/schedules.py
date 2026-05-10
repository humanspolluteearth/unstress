from fastapi import APIRouter, Depends, HTTPException, Body
from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from app.database import get_db
import app.models as models
from pydantic import BaseModel, validator
from datetime import datetime, timezone
import uuid

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

# --- Router ---

router = APIRouter()

@router.get("", response_model=List[dict])
@router.get("/", response_model=List[dict])
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
    return results

@router.post("", response_model=dict)
@router.post("/", response_model=dict)
async def create_event(data: EventCreate, db: Session = Depends(get_db)):
    """Creates a new event in the database."""
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

    return {
        "id": new_event.id,
        "title": new_event.title,
        "start_time": new_event.start_time,
        "end_time": new_event.end_time,
        "item_type": "event",
        "is_conflict": new_event.is_conflict,
        "goal_id": new_event.goal_id
    }

@router.delete("/{event_id}")
@router.delete("/{event_id}/")
async def delete_event(event_id: str, db: Session = Depends(get_db)):
    """Deletes an event from the database."""
    event = db.query(models.ScheduledEvent).filter(models.ScheduledEvent.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    db.delete(event)
    db.commit()
    return {"success": True, "status": "deleted"}

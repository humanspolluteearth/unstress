from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime, timezone
import uuid
from sqlalchemy.orm import Session
from app.database import get_db
import app.models as models

router = APIRouter()

# --- Schemas ---

class FocusSessionCreate(BaseModel):
    duration_minutes: int
    mode: str = "pomodoro"
    date: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class FocusSession(FocusSessionCreate):
    id: uuid.UUID

class FocusStats(BaseModel):
    total_minutes: int
    total_hours: float
    session_count: int

# --- Endpoints ---

@router.post("/log", response_model=FocusSession)
@router.post("/log/", response_model=FocusSession)
async def log_focus_session(data: FocusSessionCreate, db: Session = Depends(get_db)):
    """Saves a completed focus session in the database."""
    new_session = models.FocusSession(
        id=str(uuid.uuid4()),
        duration_minutes=data.duration_minutes,
        mode=data.mode,
        date=data.date
    )
    db.add(new_session)
    db.commit()
    db.refresh(new_session)
    return new_session

@router.get("/stats", response_model=FocusStats)
@router.get("/stats/", response_model=FocusStats)
async def get_focus_stats(db: Session = Depends(get_db)):
    """Returns aggregated focus statistics from the database."""
    sessions = db.query(models.FocusSession).all()
    total_mins = sum(s.duration_minutes for s in sessions)
    return FocusStats(
        total_minutes=total_mins,
        total_hours=round(total_mins / 60, 2),
        session_count=len(sessions)
    )

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime, timezone
import uuid

router = APIRouter()

# --- Schemas ---

class FocusSessionCreate(BaseModel):
    duration_minutes: int
    mode: str = "pomodoro" # e.g., 'pomodoro', 'deep-work', 'reading'
    date: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class FocusSession(FocusSessionCreate):
    id: uuid.UUID

class FocusStats(BaseModel):
    total_minutes: int
    total_hours: float
    session_count: int

# --- In-Memory Store (Prototype) ---
focus_db: List[FocusSession] = []

# --- Endpoints ---

@router.post("/log", response_model=FocusSession)
@router.post("/log/", response_model=FocusSession)
async def log_focus_session(data: FocusSessionCreate):
    """
    Saves a completed focus session.
    """
    new_session = FocusSession(id=uuid.uuid4(), **data.model_dump())
    focus_db.append(new_session)
    return new_session

@router.get("/stats", response_model=FocusStats)
@router.get("/stats/", response_model=FocusStats)
async def get_focus_stats():
    """
    Returns aggregated focus statistics.
    """
    total_mins = sum(s.duration_minutes for s in focus_db)
    return FocusStats(
        total_minutes=total_mins,
        total_hours=round(total_mins / 60, 2),
        session_count=len(focus_db)
    )

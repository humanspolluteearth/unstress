from pydantic import BaseModel, Field
from datetime import datetime, timezone
import uuid

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

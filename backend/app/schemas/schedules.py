from pydantic import BaseModel, validator
from typing import Optional
from datetime import datetime, timezone

class EventBase(BaseModel):
    title: str
    start_time: datetime
    end_time: datetime
    repeat_pattern: Optional[str] = None
    repeat_days: Optional[list] = None
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

class EventCreate(EventBase):
    pass

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

class ScheduledItem(BaseModel):
    id: str
    title: str
    start_time: datetime
    end_time: datetime
    item_type: str
    is_conflict: bool = False
    repeat_pattern: Optional[str] = None
    repeat_days: Optional[list] = None
    goal_id: Optional[str] = None

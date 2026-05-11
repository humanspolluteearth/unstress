from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class HabitLogBase(BaseModel):
    value: float

class HabitLogCreate(HabitLogBase):
    habit_id: str

class HabitLog(HabitLogBase):
    id: Optional[str] = None
    timestamp: str

class HabitBase(BaseModel):
    name: str
    frequency: str
    unit: str = 'rep'
    habit_type: str = 'numeric'
    two_min_threshold: float
    normal_threshold: float
    hard_threshold: float
    impossible_threshold: float

class HabitCreate(HabitBase):
    pass

class HabitUpdate(BaseModel):
    name: Optional[str] = None
    frequency: Optional[str] = None
    unit: Optional[str] = None
    habit_type: Optional[str] = None
    two_min_threshold: Optional[float] = None
    normal_threshold: Optional[float] = None
    hard_threshold: Optional[float] = None
    impossible_threshold: Optional[float] = None

class Habit(HabitBase):
    id: str
    logs: List[HabitLog] = []

    class Config:
        from_attributes = True

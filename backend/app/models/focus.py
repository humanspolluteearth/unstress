from sqlalchemy import Column, String, Integer, DateTime
from .base import Base
from datetime import datetime, timezone
import uuid

class FocusSession(Base):
    __tablename__ = "focus_sessions"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    duration_minutes = Column(Integer, nullable=False)
    mode = Column(String, default="pomodoro")
    date = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

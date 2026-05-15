from sqlalchemy import Column, String, Boolean, DateTime, JSON
from .base import Base
import uuid

class ScheduledEvent(Base):
    __tablename__ = "schedule_events"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    title = Column(String, nullable=False)
    start_time = Column(DateTime(timezone=True), nullable=False)
    end_time = Column(DateTime(timezone=True), nullable=False)
    category = Column(String, default="general")
    is_conflict = Column(Boolean, default=False)
    repeat_pattern = Column(String, nullable=True)  # Daily, Weekly, Monthly
    repeat_days = Column(JSON, nullable=True)      # [0, 1, 2, 3, 4, 5, 6] for Sun-Sat
    goal_id = Column(String, nullable=True)

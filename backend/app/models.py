from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Text, JSON, Table
from sqlalchemy.orm import relationship
from .database import Base
from datetime import datetime, timezone
import uuid

# Many-to-many relationship for goal tags or linking?
# For now, let's keep it simple with JSON fields for tags/links to match prototypes.

class Goal(Base):
    __tablename__ = "goals"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    title = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    markdown_content = Column(Text, default="")
    priority = Column(String)  # critical, high, medium, low
    category = Column(String)
    time_frame = Column(String)
    deadline = Column(String, nullable=True)
    label_color = Column(String, default="#ffffff")
    assignee_initials = Column(String, default="--")
    tags = Column(JSON, default=list)
    links = Column(JSON, default=list)
    references = Column(JSON, default=list)
    internal_tasks = Column(JSON, default=list)  # In-goal checklist

    # Relationships
    tasks = relationship("Task", back_populates="goal")

class Task(Base):
    __tablename__ = "tasks"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    priority = Column(Integer, default=0)
    status = Column(String, default="Todo")
    tags = Column(JSON, default=list)
    deadline = Column(String, nullable=True)
    project_link = Column(String, nullable=True)
    
    goal_id = Column(String, ForeignKey("goals.id"), nullable=True)
    goal = relationship("Goal", back_populates="tasks")

class Transaction(Base):
    __tablename__ = "finance_transactions"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    amount = Column(Float, nullable=False)  # Unified amount for simplified finance API
    type = Column(String, nullable=False) # income, expense
    category = Column(String)
    tags = Column(JSON, default=list)
    date = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    description = Column(String, nullable=False)

class NetWorthSnapshot(Base):
    __tablename__ = "finance_net_worth"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    date = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    assets = Column(Float, default=0.0)
    liabilities = Column(Float, default=0.0)
    total = Column(Float, default=0.0)

class FocusSession(Base):
    __tablename__ = "focus_sessions"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    duration_minutes = Column(Integer, nullable=False)
    mode = Column(String, default="pomodoro")
    date = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

class Habit(Base):
    __tablename__ = "habits"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String, nullable=False)
    unit = Column(String, default="mins")
    frequency = Column(String, default="daily")
    two_min_threshold = Column(Float)
    normal_threshold = Column(Float)
    hard_threshold = Column(Float)
    impossible_threshold = Column(Float)
    
    logs = relationship("HabitLog", back_populates="habit", cascade="all, delete-orphan")

class HabitLog(Base):
    __tablename__ = "habit_logs"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    habit_id = Column(String, ForeignKey("habits.id"))
    value = Column(Float, nullable=False)
    timestamp = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    habit = relationship("Habit", back_populates="logs")

class ScheduledEvent(Base):
    __tablename__ = "schedule_events"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    title = Column(String, nullable=False)
    start_time = Column(DateTime(timezone=True), nullable=False)
    end_time = Column(DateTime(timezone=True), nullable=False)
    category = Column(String, default="general")
    is_conflict = Column(Boolean, default=False)
    goal_id = Column(String, nullable=True)

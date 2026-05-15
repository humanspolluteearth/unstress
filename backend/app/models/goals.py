from sqlalchemy import Column, String, Text, Boolean, JSON, ForeignKey, Integer
from sqlalchemy.orm import relationship
from .base import Base
import uuid

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
    internal_tasks = Column(JSON, default=list)
    is_current_focus = Column(Boolean, default=False)

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
    is_archived = Column(Boolean, default=False)
    
    goal_id = Column(String, ForeignKey("goals.id"), nullable=True)
    goal = relationship("Goal", back_populates="tasks")

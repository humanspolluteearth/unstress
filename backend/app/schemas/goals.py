from pydantic import BaseModel, HttpUrl
from typing import List, Optional
import uuid

class GoalBase(BaseModel):
    title: str
    description: str
    markdown_content: str = ""
    priority: str
    category: str
    time_frame: str
    deadline: Optional[str] = None
    label_color: str = "#ffffff"
    assignee_initials: str = "--"
    tags: List[str] = []
    links: List[HttpUrl] = []
    references: List[str] = []
    internal_tasks: List[dict] = []
    is_current_focus: bool = False

class GoalCreate(GoalBase):
    pass

class Goal(GoalBase):
    id: uuid.UUID
    progress: float = 0.0
    total_tasks: int = 0
    completed_tasks: int = 0
    active_tasks_count: int = 0

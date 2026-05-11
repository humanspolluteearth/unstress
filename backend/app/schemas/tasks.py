from pydantic import BaseModel
from typing import List, Optional

class TaskBase(BaseModel):
    title: str
    description: Optional[str] = None
    priority: int = 0
    tags: List[str] = []
    deadline: Optional[str] = None
    project_link: Optional[str] = None
    goal_id: Optional[str] = None

class TaskCreate(TaskBase):
    pass

class TaskPatchRequest(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    priority: Optional[int] = None
    status: Optional[str] = None
    tags: Optional[List[str]] = None
    deadline: Optional[str] = None
    project_link: Optional[str] = None
    goal_id: Optional[str] = None

class Task(TaskBase):
    id: str
    status: str = "Todo"

    class Config:
        from_attributes = True

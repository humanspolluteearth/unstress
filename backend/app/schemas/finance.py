from pydantic import BaseModel, Field
from typing import List, Optional, Literal
from datetime import datetime, timezone
import uuid

class TransactionBase(BaseModel):
    amount: float
    type: Literal["income", "expense"]
    category: str
    tags: List[str] = []
    date: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    description: str

class Transaction(TransactionBase):
    id: uuid.UUID

class NetWorthSnapshot(BaseModel):
    id: uuid.UUID
    date: datetime
    assets: float
    liabilities: float
    total: float

# Legacy / Double-entry schemas
class PostingCreate(BaseModel):
    account_id: str
    amount: int  # Cents
    memo: Optional[str] = None

class TransactionCreate(BaseModel):
    description: str
    postings: List[PostingCreate]
    tags: List[str] = []
    notes: Optional[str] = None
    is_recurring: bool = False

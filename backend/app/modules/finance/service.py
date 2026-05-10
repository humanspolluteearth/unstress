from typing import List, Optional, Dict
from pydantic import BaseModel, UUID4
from app.core.results import Result
from app.core.broker import broker, BaseEvent
from datetime import datetime, timedelta, timezone
import uuid

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

class Transaction(BaseModel):
    id: str
    description: str
    date: datetime
    postings: List[PostingCreate]
    tags: List[str] = []
    notes: Optional[str] = None
    is_recurring: bool = False

class FinanceService:
    # Note: Legacy service removed mock data.
    # Finance operations are now primarily handled via api/finance.py using SQLAlchemy.
    @staticmethod
    async def get_all_transactions() -> Result[List[Transaction], str]:
        return Result.fail("Use /api/finance/transactions instead.")

    @staticmethod
    async def add_transaction(data: TransactionCreate) -> Result[dict, str]:
        return Result.fail("Use /api/finance/transactions instead.")

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field
from typing import List, Optional, Literal
from datetime import datetime, timezone
import uuid

router = APIRouter(prefix="/api/finance", tags=["finance"])

# --- Schemas ---

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
    total: float # Calculated field

# --- In-Memory Store ---
transactions_db: List[Transaction] = [
    Transaction(
        id=uuid.uuid4(),
        amount=2500.00,
        type="income",
        category="Consulting",
        tags=["q2", "external"],
        date=datetime.now(timezone.utc),
        description="Q2 Framework Optimization"
    ),
    Transaction(
        id=uuid.uuid4(),
        amount=120.50,
        type="expense",
        category="Software",
        tags=["subscription", "infra"],
        date=datetime.now(timezone.utc),
        description="Cloud Hosting Monthly"
    ),
    Transaction(
        id=uuid.uuid4(),
        amount=45.00,
        type="expense",
        category="Food",
        tags=["team", "lunch"],
        date=datetime.now(timezone.utc),
        description="Strategic Planning Lunch"
    )
]

# --- Endpoints ---

@router.get("/transactions", response_model=List[Transaction])
async def get_transactions(
    timeframe: Optional[str] = Query(None, description="weekly, monthly, or yearly")
):
    """
    Returns transactions, optionally filtered by timeframe.
    """
    now = datetime.now(timezone.utc)
    if not timeframe:
        return transactions_db
    
    filtered = []
    for tx in transactions_db:
        if timeframe == "weekly":
            if (now - tx.date).days <= 7:
                filtered.append(tx)
        elif timeframe == "monthly":
            if tx.date.month == now.month and tx.date.year == now.year:
                filtered.append(tx)
        elif timeframe == "yearly":
            if tx.date.year == now.year:
                filtered.append(tx)
        else:
            filtered.append(tx)
            
    return filtered

@router.post("/transactions", response_model=Transaction)
async def create_transaction(tx_data: TransactionBase):
    """
    Creates a new transaction.
    """
    new_tx = Transaction(id=uuid.uuid4(), **tx_data.model_dump())
    transactions_db.append(new_tx)
    return new_tx

@router.get("/net-worth", response_model=List[NetWorthSnapshot])
async def get_net_worth():
    """
    Returns monthly/yearly aggregated net worth data.
    (Currently returns a mock snapshot based on transactions).
    """
    total_income = sum(t.amount for t in transactions_db if t.type == "income")
    total_expense = sum(t.amount for t in transactions_db if t.type == "expense")
    
    current_net = total_income - total_expense
    
    # Mocking a snapshot for the current moment
    return [
        NetWorthSnapshot(
            id=uuid.uuid4(),
            date=datetime.now(timezone.utc),
            assets=total_income,
            liabilities=total_expense,
            total=current_net
        )
    ]

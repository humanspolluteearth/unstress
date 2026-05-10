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
        amount=5000.00,
        type="income",
        category="Salary",
        tags=["primary", "work"],
        date=datetime.now(timezone.utc),
        description="Monthly Paycheck"
    ),
    Transaction(
        id=uuid.uuid4(),
        amount=120.50,
        type="expense",
        category="Food",
        tags=["groceries", "essential"],
        date=datetime.now(timezone.utc),
        description="Whole Foods"
    ),
    Transaction(
        id=uuid.uuid4(),
        amount=45.00,
        type="expense",
        category="Subscription",
        tags=["entertainment"],
        date=datetime.now(timezone.utc),
        description="Netflix & Spotify"
    ),
    Transaction(
        id=uuid.uuid4(),
        amount=200.00,
        type="income",
        category="Freelance",
        tags=["side-hustle"],
        date=datetime.now(timezone.utc),
        description="Logo Design"
    )
]

# Seed Net Worth for charts
net_worth_db: List[NetWorthSnapshot] = [
    NetWorthSnapshot(
        id=uuid.uuid4(),
        date=datetime(2026, 3, 1, tzinfo=timezone.utc),
        assets=15000.0,
        liabilities=2000.0,
        total=13000.0
    ),
    NetWorthSnapshot(
        id=uuid.uuid4(),
        date=datetime(2026, 4, 1, tzinfo=timezone.utc),
        assets=16500.0,
        liabilities=1800.0,
        total=14700.0
    ),
    NetWorthSnapshot(
        id=uuid.uuid4(),
        date=datetime(2026, 5, 1, tzinfo=timezone.utc),
        assets=18200.0,
        liabilities=1500.0,
        total=16700.0
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

@router.get("/summaries")
async def get_summaries():
    """
    Calculates weekly and yearly net flow summaries.
    """
    from datetime import timedelta
    now = datetime.now(timezone.utc)
    
    # Weekly (last 7 days)
    weekly = []
    for i in range(6, -1, -1):
        day = now - timedelta(days=i)
        day_str = day.strftime("%a")
        total_income = 0
        total_expense = 0
        for tx in transactions_db:
            if tx.date.date() == day.date():
                if tx.type == "income":
                    total_income += tx.amount
                else:
                    total_expense += tx.amount
        weekly.append({"label": day_str, "value": total_income - total_expense})

    # Yearly (last 12 months)
    yearly = []
    for i in range(11, -1, -1):
        # Specific month and year
        month = (now.month - i - 1) % 12 + 1
        year = now.year + (now.month - i - 1) // 12
        
        month_date = datetime(year, month, 1, tzinfo=timezone.utc)
        month_str = month_date.strftime("%b")
        
        total_income = 0
        total_expense = 0
        for tx in transactions_db:
            if tx.date.month == month and tx.date.year == year:
                if tx.type == "income":
                    total_income += tx.amount
                else:
                    total_expense += tx.amount
        yearly.append({"label": month_str, "value": total_income - total_expense})

    return {"success": True, "data": {"weekly": weekly, "yearly": yearly}}

@router.get("/net-worth", response_model=List[NetWorthSnapshot])
async def get_net_worth():
    """
    Returns monthly/yearly aggregated net worth data.
    """
    return net_worth_db

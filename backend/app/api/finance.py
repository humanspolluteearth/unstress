from fastapi import APIRouter, HTTPException, Query, Request, Depends
from pydantic import BaseModel, Field, HttpUrl
from typing import List, Optional, Literal, Any
from datetime import datetime, timezone, timedelta
import uuid
from sqlalchemy.orm import Session
from app.database import get_db
import app.models as models
from app.core.results import Result

# Schema Definitions
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

router = APIRouter()

@router.get("/transactions", response_model=Result[List[Transaction], str])
@router.get("/transactions/", response_model=Result[List[Transaction], str])
async def get_transactions(
    timeframe: Optional[str] = Query(None, description="weekly, monthly, or yearly"),
    db: Session = Depends(get_db)
):
    try:
        now = datetime.now(timezone.utc)
        query = db.query(models.Transaction)
        
        if timeframe == "weekly":
            start_date = now - timedelta(days=7)
            query = query.filter(models.Transaction.date >= start_date)
        elif timeframe == "monthly":
            query = query.filter(
                models.Transaction.date >= datetime(now.year, now.month, 1, tzinfo=timezone.utc)
            )
        elif timeframe == "yearly":
            query = query.filter(
                models.Transaction.date >= datetime(now.year, 1, 1, tzinfo=timezone.utc)
            )
                
        transactions = query.order_by(models.Transaction.date.desc()).all()
        return Result.ok(transactions)
    except Exception as e:
        return Result.fail(str(e))

@router.post("/transactions", response_model=Result[Transaction, str])
@router.post("/transactions/", response_model=Result[Transaction, str])
async def create_transaction(tx_data: TransactionBase, db: Session = Depends(get_db)):
    try:
        new_tx = models.Transaction(
            id=str(uuid.uuid4()),
            amount=tx_data.amount,
            type=tx_data.type,
            category=tx_data.category,
            tags=tx_data.tags,
            date=tx_data.date,
            description=tx_data.description
        )
        db.add(new_tx)
        db.commit()
        db.refresh(new_tx)
        return Result.ok(new_tx)
    except Exception as e:
        db.rollback()
        return Result.fail(str(e))

@router.delete("/transactions/{transaction_id}", response_model=Result[dict, str])
@router.delete("/transactions/{transaction_id}/", response_model=Result[dict, str])
async def delete_transaction(transaction_id: uuid.UUID, db: Session = Depends(get_db)):
    tx = db.query(models.Transaction).filter(models.Transaction.id == str(transaction_id)).first()
    if not tx:
        return Result.fail("Transaction not found")
    try:
        db.delete(tx)
        db.commit()
        return Result.ok({"success": True, "status": "deleted"})
    except Exception as e:
        db.rollback()
        return Result.fail(str(e))

@router.get("/summaries")
@router.get("/summaries/")
async def get_summaries(db: Session = Depends(get_db)):
    try:
        now = datetime.now(timezone.utc)
        transactions = db.query(models.Transaction).all()
        
        weekly = []
        for i in range(6, -1, -1):
            day = now - timedelta(days=i)
            day_str = day.strftime("%a")
            total_income = 0
            total_expense = 0
            for tx in transactions:
                if tx.date.date() == day.date():
                    if tx.type == "income":
                        total_income += tx.amount
                    else:
                        total_expense += tx.amount
            weekly.append({"label": day_str, "value": total_income - total_expense})

        yearly = []
        for i in range(11, -1, -1):
            month = (now.month - i - 1) % 12 + 1
            year = now.year + (now.month - i - 1) // 12
            month_date = datetime(year, month, 1, tzinfo=timezone.utc)
            month_str = month_date.strftime("%b")
            total_income = 0
            total_expense = 0
            for tx in transactions:
                if tx.date.month == month and tx.date.year == year:
                    if tx.type == "income":
                        total_income += tx.amount
                    else:
                        total_expense += tx.amount
            yearly.append({"label": month_str, "value": total_income - total_expense})

        return Result.ok({"weekly": weekly, "yearly": yearly})
    except Exception as e:
        return Result.fail(str(e))

@router.get("/net-worth", response_model=Result[List[NetWorthSnapshot], str])
@router.get("/net-worth/", response_model=Result[List[NetWorthSnapshot], str])
async def get_net_worth(db: Session = Depends(get_db)):
    try:
        snapshots = db.query(models.NetWorthSnapshot).order_by(models.NetWorthSnapshot.date.asc()).all()
        return Result.ok(snapshots)
    except Exception as e:
        return Result.fail(str(e))

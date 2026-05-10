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
    # In-memory storage for prototype
    _transactions: List[Transaction] = [
        Transaction(
            id="tx-1",
            description="Initial Capital",
            date=datetime.now(timezone.utc) - timedelta(days=30),
            postings=[
                PostingCreate(account_id="acc-assets", amount=100000, memo="Cash Deposit"),
                PostingCreate(account_id="acc-equity", amount=-100000, memo="Owner Investment")
            ],
            tags=["setup"],
            notes="Initial funding"
        ),
        Transaction(
            id="tx-2",
            description="Lunch with Client",
            date=datetime.now(timezone.utc) - timedelta(days=2),
            postings=[
                PostingCreate(account_id="acc-expenses", amount=4500, memo="Thai Food"),
                PostingCreate(account_id="acc-assets", amount=-4500, memo="Debit Card")
            ],
            tags=["marketing", "food"],
            notes="Business lunch"
        ),
        Transaction(
            id="tx-3",
            description="Software Subscription",
            date=datetime.now(timezone.utc) - timedelta(days=1),
            postings=[
                PostingCreate(account_id="acc-expenses", amount=2000, memo="Monthly SaaS"),
                PostingCreate(account_id="acc-assets", amount=-2000, memo="Auto-pay")
            ],
            tags=["software"],
            is_recurring=True
        )
    ]

    @staticmethod
    async def get_all_transactions() -> Result[List[Transaction], str]:
        return Result.ok(FinanceService._transactions)

    @staticmethod
    async def add_transaction(data: TransactionCreate) -> Result[dict, str]:
        """
        Adds a new financial transaction after validating double-entry integrity.
        """
        try:
            total_sum = sum(p.amount for p in data.postings)
            
            if total_sum != 0:
                return Result.fail(
                    f"Double-entry validation failed: Transaction is unbalanced by {total_sum} cents."
                )

            if len(data.postings) < 2:
                return Result.fail("A transaction must have at least two postings.")

            new_tx = Transaction(
                id=str(uuid.uuid4()),
                description=data.description,
                date=datetime.now(timezone.utc),
                postings=data.postings,
                tags=data.tags,
                notes=data.notes,
                is_recurring=data.is_recurring
            )
            
            FinanceService._transactions.append(new_tx)

            # Publish Event
            event = BaseEvent(
                event_type="FINANCE_TRANSACTION_ADDED",
                payload=new_tx.dict()
            )
            await broker.publish(event)

            return Result.ok({
                "transaction_id": new_tx.id,
                "status": "committed",
                "message": "Transaction added successfully."
            })

        except Exception as e:
            return Result.fail(f"Internal error: {str(e)}")

    @staticmethod
    async def get_summaries() -> Result[Dict[str, List[Dict]], str]:
        """
        Calculates weekly and yearly spending summaries.
        """
        try:
            now = datetime.now(timezone.utc)
            
            # Weekly (last 7 days)
            weekly = []
            for i in range(6, -1, -1):
                day = now - timedelta(days=i)
                day_str = day.strftime("%a")
                total = 0
                for tx in FinanceService._transactions:
                    if tx.date.date() == day.date():
                        # Spending is where expense increases (positive amount)
                        total += sum(p.amount for p in tx.postings if p.account_id == "acc-expenses" and p.amount > 0)
                weekly.append({"label": day_str, "value": total / 100})

            # Yearly (last 12 months)
            yearly = []
            for i in range(11, -1, -1):
                # Calculate the specific month and year
                month = (now.month - i - 1) % 12 + 1
                year = now.year + (now.month - i - 1) // 12
                
                month_date = datetime(year, month, 1, tzinfo=timezone.utc)
                month_str = month_date.strftime("%b")
                
                total = 0
                for tx in FinanceService._transactions:
                    if tx.date.month == month and tx.date.year == year:
                        total += sum(p.amount for p in tx.postings if p.account_id == "acc-expenses" and p.amount > 0)
                yearly.append({"label": month_str, "value": total / 100})

            return Result.ok({"weekly": weekly, "yearly": yearly})
        except Exception as e:
            return Result.fail(str(e))

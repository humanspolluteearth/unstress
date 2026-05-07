from typing import List, Optional
from pydantic import BaseModel, UUID4
from app.core.results import Result
from app.core.broker import broker, BaseEvent

class PostingCreate(BaseModel):
    account_id: UUID4
    amount: int  # Cents
    memo: Optional[str] = None

class TransactionCreate(BaseModel):
    description: str
    postings: List[PostingCreate]

class FinanceService:
    @staticmethod
    async def add_transaction(data: TransactionCreate) -> Result[dict, str]:
        """
        Adds a new financial transaction after validating double-entry integrity.
        Sum of amounts in postings must be zero (Debits + Credits = 0).
        """
        try:
            # 1. Validate Double-Entry Integrity
            # In our system: Positive = Debit, Negative = Credit
            total_sum = sum(p.amount for p in data.postings)
            
            if total_sum != 0:
                return Result.fail(
                    f"Double-entry validation failed: Transaction is unbalanced by {total_sum} cents."
                )

            if len(data.postings) < 2:
                return Result.fail("A transaction must have at least two postings.")

            # 2. Database Persistence Logic (Placeholder for ORM execution)
            # In a real implementation, this would use Drizzle/SQLAlchemy within a DB transaction.
            transaction_id = "mock-uuid-123" # This would come from the DB

            # 3. Publish Event via the Broker
            event = BaseEvent(
                event_type="FINANCE_TRANSACTION_ADDED",
                payload={
                    "transaction_id": transaction_id,
                    "description": data.description,
                    "postings": [p.dict() for p in data.postings]
                }
            )
            
            publish_result = await broker.publish(event)
            if not publish_result.success:
                # We log the event failure but consider the transaction added 
                # (or we could rollback if in a DB transaction).
                print(f"Warning: Failed to publish finance event: {publish_result.error}")

            return Result.ok({
                "transaction_id": transaction_id,
                "status": "committed",
                "message": "Transaction added and validated successfully."
            })

        except Exception as e:
            return Result.fail(f"Internal error while adding transaction: {str(e)}")

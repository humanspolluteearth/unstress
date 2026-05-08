from uuid import UUID
from app.core.broker import BaseEvent
from app.core.results import Result
from app.modules.finance.service import FinanceService, TransactionCreate, PostingCreate

# Mock Account IDs for the reinforcement logic
REWARDS_EXPENSE_ACCOUNT = UUID("00000000-0000-0000-0000-000000000001")
INTERNAL_REWARDS_ASSET = UUID("00000000-0000-0000-0000-000000000002")

async def handle_habit_logged(event: BaseEvent) -> Result[None, str]:
    """
    Listener for habit logging events.
    If a habit is successful, it rewards the user with a micro-transaction.
    """
    try:
        payload = event.payload
        status = payload.get("status")

        if status == "success":
            habit_id = payload.get("habit_id", "Unknown")
            
            # Prepare a $0.50 (50 cents) Micro-Reward
            # Double-entry: Debit Expense (+50), Credit Asset/Liability (-50)
            # In our system: Positive = Increase (Debit), Negative = Decrease (Credit)
            reward_data = TransactionCreate(
                description=f"Micro-Reward: Successfully logged habit {habit_id}",
                postings=[
                    PostingCreate(
                        account_id=REWARDS_EXPENSE_ACCOUNT,
                        amount=50,
                        memo="Habit Reinforcement Expense"
                    ),
                    PostingCreate(
                        account_id=INTERNAL_REWARDS_ASSET,
                        amount=-50,
                        memo="Internal Reward Allocation"
                    )
                ]
            )

            # Trigger the Finance Service
            result = await FinanceService.add_transaction(reward_data)
            
            if not result.success:
                return Result.fail(f"Failed to apply micro-reward: {result.error}")

            print(f"[Finance Module] Applied $0.50 micro-reward for habit {habit_id}.")
            return Result.ok(None)

        return Result.ok(None) # Not a successful habit log

    except Exception as e:
        return Result.fail(f"Error in Finance habit-listener: {str(e)}")

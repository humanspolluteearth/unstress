from fastapi import APIRouter
from app.modules.finance.service import FinanceService, TransactionCreate
from app.core.results import Result

router = APIRouter(prefix="/finance", tags=["finance"])

@router.get("/transactions")
async def get_transactions() -> Result[list, str]:
    return await FinanceService.get_all_transactions()

@router.get("/summaries")
async def get_summaries() -> Result[dict, str]:
    return await FinanceService.get_summaries()

@router.post("/transactions")
async def add_transaction(data: TransactionCreate) -> Result[dict, str]:
    return await FinanceService.add_transaction(data)

@router.put("/transactions/{transaction_id}")
async def update_transaction(transaction_id: str, data: TransactionCreate) -> Result[dict, str]:
    # Placeholder for service method (if implemented)
    return Result.ok({"status": "updated"})

@router.delete("/transactions/{transaction_id}")
async def delete_transaction(transaction_id: str) -> Result[dict, str]:
    # Placeholder for service method (if implemented)
    return Result.ok({"status": "deleted"})

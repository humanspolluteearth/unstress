from fastapi import APIRouter
from app.modules.finance.service import FinanceService, TransactionCreate
from app.core.results import Result

router = APIRouter(prefix="/finance", tags=["finance"])

@router.get("/transactions")
async def get_transactions() -> Result[list, str]:
    """
    Mock endpoint to fetch transactions for the preview.
    """
    # In a real app, this would call FinanceService.get_all_transactions()
    mock_transactions = [
        {
            "id": "tx-1",
            "description": "Initial Capital",
            "date": "2023-10-01T10:00:00Z",
            "postings": [
                {"id": "p-1", "account_id": "acc-assets", "amount": 100000, "memo": "Cash Deposit"},
                {"id": "p-2", "account_id": "acc-equity", "amount": -100000, "memo": "Owner Investment"}
            ]
        },
        {
            "id": "tx-2",
            "description": "Buy Office Supplies",
            "date": "2023-10-02T14:30:00Z",
            "postings": [
                {"id": "p-3", "account_id": "acc-expenses", "amount": 5000, "memo": "Stationery"},
                {"id": "p-4", "account_id": "acc-assets", "amount": -5000, "memo": "Cash Payment"}
            ]
        }
    ]
    return Result.ok(mock_transactions)

@router.post("/transactions")
async def add_transaction(data: TransactionCreate) -> Result[dict, str]:
    return await FinanceService.add_transaction(data)

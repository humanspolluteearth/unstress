import logging
from app.core.broker import BaseEvent
from app.core.results import Result

logger = logging.getLogger(__name__)

async def handle_finance_transaction_added(event: BaseEvent) -> Result[None, str]:
    """
    Listener for financial transactions. 
    If a transaction description contains a Task ID (e.g., "TASK_ID:123"),
    it updates the corresponding task's status.
    """
    try:
        payload = event.payload
        description = payload.get("description", "")
        
        # Simple pattern matching for "TASK_ID:uuid"
        if "TASK_ID:" in description:
            task_id = description.split("TASK_ID:")[1].split()[0]
            
            # 1. Logic to update Task Status
            logger.info(f"[Tasks Module] Detected funding for Task {task_id}. Updating status to 'Funded'.")
            
            # 2. Publish TASK_FUNDED event
            from app.core.broker import broker
            await broker.publish(BaseEvent(
                event_type="TASK_FUNDED",
                payload={"task_id": task_id}
            ))

            # 3. Return success via Result Pattern
            return Result.ok(None)
            
        return Result.ok(None) # Not a task-related transaction
        
    except Exception as e:
        return Result.fail(f"Error in Tasks listener: {str(e)}")

import logging
from app.core.broker import BaseEvent
from app.core.results import Result

logger = logging.getLogger(__name__)

async def handle_finance_goal_update(event: BaseEvent) -> Result[None, str]:
    """
    Updates Savings Goals when relevant financial transactions occur.
    Looks for "GOAL_ID:" in the transaction description.
    """
    try:
        payload = event.payload
        description = payload.get("description", "")
        
        if "GOAL_ID:" in description:
            goal_id = description.split("GOAL_ID:")[1].split()[0]
            # Sum up total amount from postings (or specific postings)
            # For simplicity, we assume the whole transaction is toward the goal
            amount = sum(p.get("amount", 0) for p in payload.get("postings", []))
            
            logger.info(f"[Goals Module] Financial update for Goal {goal_id}: +{amount} cents.")
            # Logic: GoalsService.update_progress(goal_id, amount)
            
            from app.core.broker import broker
            await broker.publish(BaseEvent(
                event_type="GOAL_UPDATE",
                payload={"goal_id": goal_id, "source": "finance", "amount": amount}
            ))
            
        return Result.ok(None)
    except Exception as e:
        return Result.fail(f"Goals Finance listener error: {str(e)}")

async def handle_task_goal_update(event: BaseEvent) -> Result[None, str]:
    """
    Updates Project Goals when tasks are completed.
    """
    try:
        from app.modules.goals.service import GoalService
        goal_id = event.payload.get("goal_id")
        if goal_id:
            logger.info(f"[Goals Module] Task completion update for Goal {goal_id}.")
            await GoalService.increment_progress(goal_id)
            
        return Result.ok(None)
    except Exception as e:
        return Result.fail(f"Goals Task listener error: {str(e)}")

async def handle_habit_goal_update(event: BaseEvent) -> Result[None, str]:
    """
    Updates Goals based on Habit consistency.
    """
    try:
        # Assuming HABIT_LOGGED payload has { "goal_id": "...", "status": "..." }
        payload = event.payload
        goal_id = payload.get("goal_id")
        
        if goal_id and payload.get("status") == "success":
            logger.info(f"[Goals Module] Habit success update for Goal {goal_id}.")
            # Logic: GoalsService.update_streak(goal_id)
            
            from app.core.broker import broker
            await broker.publish(BaseEvent(
                event_type="GOAL_UPDATE",
                payload={"goal_id": goal_id, "source": "habit"}
            ))
            
        return Result.ok(None)
    except Exception as e:
        return Result.fail(f"Goals Habit listener error: {str(e)}")

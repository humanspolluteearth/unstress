import logging
from typing import Any, Dict, Optional
from pydantic import BaseModel, UUID4
from app.core.results import Result
from app.modules.finance.service import FinanceService
from app.schemas.finance import TransactionCreate
from app.modules.habits.service import HabitsService
from app.schemas.habits import HabitLogCreate
from app.modules.goals.service import GoalService
from app.schemas.goals import GoalCreate
from app.core.broker import broker, BaseEvent
from app.schemas.tasks import TaskCreate, Task

logger = logging.getLogger(__name__)

class ActionDispatcher:
    """
    Centralized dispatcher for handling creation actions across the system.
    Note: Many actions now bypass the dispatcher and hit specific routers directly
    to utilize the standard get_db dependency injection.
    """
    @staticmethod
    async def dispatch_goal_creation(data: GoalCreate) -> Result[Any, str]:
        """
        Dispatches goal creation and publishes event.
        """
        try:
            result = await GoalService.create_goal(data)
            if result.success:
                await broker.publish(BaseEvent(
                    event_type="GOAL_CREATED",
                    payload=result.data
                ))
                return Result.ok({
                    "status": "created",
                    "data": result.data
                })
            return result
        except Exception as e:
            logger.error(f"Dispatcher Error in Goal Creation: {e}")
            return Result.fail(f"Dispatcher Error: {str(e)}")

    @staticmethod
    async def reset_module(module_name: str) -> Result[dict, str]:
        """
        Danger Zone: Resets a specific module's data.
        """
        try:
            logger.warning(f"[DANGER ZONE] Resetting module: {module_name}")
            
            await broker.publish(BaseEvent(
                event_type="MODULE_RESET",
                payload={"module": module_name}
            ))
            
            return Result.ok({"module": module_name, "status": "reset_successful"})
        except Exception as e:
            logger.error(f"Failed to reset module {module_name}: {e}")
            return Result.fail(f"Failed to reset module {module_name}: {str(e)}")

    @staticmethod
    async def clear_events() -> Result[dict, str]:
        """
        Danger Zone: Clears the global event history.
        """
        try:
            broker._history = []
            logger.warning("Global event history cleared.")
            return Result.ok({"status": "events_cleared"})
        except Exception as e:
            logger.error(f"Error clearing events: {e}")
            return Result.fail(str(e))

from typing import Any, Dict, Optional
from pydantic import BaseModel, UUID4
from app.core.results import Result
from app.modules.finance.service import FinanceService, TransactionCreate
from app.modules.habits.service import HabitsService, HabitLogCreate
from app.modules.goals.service import GoalService, GoalCreate
from app.core.broker import broker, BaseEvent

class TaskCreate(BaseModel):
    title: str
    description: Optional[str] = None
    priority: int = 0  # 0: Low, 1: Med, 2: High
    tags: Optional[list[str]] = []
    deadline: Optional[str] = None
    project_link: Optional[str] = None
    goal_id: Optional[str] = None

class TaskService:
    # In-memory store to link tasks to goals for event routing
    _tasks: Dict[str, dict] = {}

    @staticmethod
    async def create_task(data: TaskCreate) -> Result[dict, str]:
        """
        Creates a new task and publishes an event.
        """
        try:
            # 1. Database Persistence Logic (Placeholder)
            task_id = f"task-{len(TaskService._tasks) + 1}"
            
            task_entry = {
                "id": task_id,
                "title": data.title,
                "description": data.description,
                "priority": data.priority,
                "tags": data.tags,
                "deadline": data.deadline,
                "project_link": data.project_link,
                "goal_id": data.goal_id,
                "status": "Todo"
            }
            TaskService._tasks[task_id] = task_entry

            # 2. Publish TASK_CREATED Event
            event = BaseEvent(
                event_type="TASK_CREATED",
                payload=task_entry
            )
            await broker.publish(event)

            return Result.ok({
                "task_id": task_id,
                "status": "created",
                "message": "Task created successfully.",
                "data": task_entry
            })
        except Exception as e:
            return Result.fail(f"Internal error while creating task: {str(e)}")

    @staticmethod
    async def update_task(task_id: str, data: TaskCreate) -> Result[dict, str]:
        """
        Updates an existing task.
        """
        try:
            task = TaskService._tasks.get(task_id)
            if not task:
                return Result.fail(f"Task {task_id} not found")

            task.update({
                "title": data.title,
                "description": data.description,
                "priority": data.priority,
                "tags": data.tags,
                "deadline": data.deadline,
                "project_link": data.project_link,
                "goal_id": data.goal_id,
            })

            await broker.publish(BaseEvent(
                event_type="TASK_UPDATED",
                payload=task
            ))

            return Result.ok({
                "task_id": task_id,
                "status": "updated",
                "data": task
            })
        except Exception as e:
            return Result.fail(f"Failed to update task: {str(e)}")

    @staticmethod
    async def delete_task(task_id: str) -> Result[dict, str]:
        """
        Deletes a task.
        """
        try:
            if task_id in TaskService._tasks:
                task = TaskService._tasks.pop(task_id)
                await broker.publish(BaseEvent(
                    event_type="TASK_DELETED",
                    payload={"task_id": task_id, "goal_id": task.get("goal_id")}
                ))
                return Result.ok({"task_id": task_id, "status": "deleted"})
            return Result.fail(f"Task {task_id} not found")
        except Exception as e:
            return Result.fail(f"Failed to delete task: {str(e)}")

    @staticmethod
    async def update_task_status(task_id: str, status: str) -> Result[dict, str]:
        """
        Updates task status. Triggers TASK_COMPLETED if status is 'Done'.
        """
        try:
            task = TaskService._tasks.get(task_id)
            if task:
                task["status"] = status
            
            # 2. Publish Events
            if status == "Done":
                await broker.publish(BaseEvent(
                    event_type="TASK_COMPLETED",
                    payload={
                        "task_id": task_id,
                        "goal_id": task.get("goal_id") if task else None
                    }
                ))
            
            await broker.publish(BaseEvent(
                event_type="TASK_STATUS_CHANGED",
                payload={"task_id": task_id, "status": status}
            ))

            return Result.ok({"task_id": task_id, "new_status": status})
        except Exception as e:
            return Result.fail(f"Failed to update task status: {str(e)}")

class ActionDispatcher:
    """
    Centralized dispatcher for handling creation actions across the system.
    """
    @staticmethod
    async def dispatch_finance_transaction(data: TransactionCreate) -> Result[dict, str]:
        return await FinanceService.add_transaction(data)

    @staticmethod
    async def dispatch_task_creation(data: TaskCreate) -> Result[dict, str]:
        return await TaskService.create_task(data)

    @staticmethod
    async def dispatch_task_update(task_id: str, data: TaskCreate) -> Result[dict, str]:
        return await TaskService.update_task(task_id, data)

    @staticmethod
    async def dispatch_task_deletion(task_id: str) -> Result[dict, str]:
        return await TaskService.delete_task(task_id)

    @staticmethod
    async def dispatch_task_status_update(task_id: str, status: str) -> Result[dict, str]:
        return await TaskService.update_task_status(task_id, status)

    @staticmethod
    async def dispatch_habit_log(data: HabitLogCreate) -> Result[dict, str]:
        return await HabitsService.add_habit_log(data)

    @staticmethod
    async def dispatch_goal_creation(data: GoalCreate) -> Result[Any, str]:
        """
        Dispatches goal creation to GoalService and publishes event.
        """
        try:
            result = await GoalService.create_goal(data)
            if result.success:
                # result.data is already a dict from model_dump()
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
            return Result.fail(f"Dispatcher Error: {str(e)}")

    @staticmethod
    async def reset_module(module_name: str) -> Result[dict, str]:
        """
        Danger Zone: Resets a specific module's data.
        """
        try:
            # Logic to clear specific DB tables would go here
            print(f"[DANGER ZONE] Resetting module: {module_name}")
            
            await broker.publish(BaseEvent(
                event_type="MODULE_RESET",
                payload={"module": module_name}
            ))
            
            return Result.ok({"module": module_name, "status": "reset_successful"})
        except Exception as e:
            return Result.fail(f"Failed to reset module {module_name}: {str(e)}")

    @staticmethod
    async def clear_events() -> Result[dict, str]:
        """
        Danger Zone: Clears the global event history.
        """
        try:
            broker._history = []
            return Result.ok({"status": "events_cleared"})
        except Exception as e:
            return Result.fail(str(e))

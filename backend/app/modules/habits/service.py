from pydantic import BaseModel, UUID4
from app.core.results import Result
from app.core.broker import broker, BaseEvent

class HabitLogCreate(BaseModel):
    habit_id: UUID4
    status: str

class HabitsService:
    @staticmethod
    async def add_habit_log(data: HabitLogCreate) -> Result[dict, str]:
        """
        Logs a habit completion or status update.
        Returns a Result object and publishes an event on success.
        """
        try:
            # 1. Database Persistence Logic (Placeholder)
            # In a real implementation, this would use the DB session to insert into habit_logs.
            log_id = "mock-log-uuid-456"

            # 2. Publish HABIT_LOGGED Event
            event = BaseEvent(
                event_type="HABIT_LOGGED",
                payload={
                    "log_id": log_id,
                    "habit_id": str(data.habit_id),
                    "status": data.status
                }
            )
            
            publish_result = await broker.publish(event)
            if not publish_result.success:
                # Log warning but don't fail the primary action
                print(f"Warning: Failed to publish habit event: {publish_result.error}")

            return Result.ok({
                "log_id": log_id,
                "status": "recorded",
                "message": "Habit log added successfully."
            })

        except Exception as e:
            return Result.fail(f"Internal error while logging habit: {str(e)}")

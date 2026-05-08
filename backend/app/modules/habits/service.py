from typing import List, Optional
from pydantic import BaseModel, UUID4
from app.core.results import Result
from app.core.broker import broker, BaseEvent
from datetime import datetime, date, timezone
import uuid

class Habit(BaseModel):
    id: str
    title: str
    frequency: str # 'daily', 'weekly', 'monthly'
    target: int # e.g., 5 times per week
    habit_type: str = 'reps' # 'reps' or 'timed'
    duration_minutes: Optional[int] = None
    logs: List[str] = []

class HabitCreate(BaseModel):
    title: str
    frequency: str
    target: int
    habit_type: str = 'reps'
    duration_minutes: Optional[int] = None

class HabitUpdate(BaseModel):
    title: Optional[str] = None
    frequency: Optional[str] = None
    target: Optional[int] = None
    habit_type: Optional[str] = None
    duration_minutes: Optional[int] = None

class HabitLogCreate(BaseModel):
    habit_id: str
    status: str

class HabitsService:
    # In-memory storage
    _habits: List[Habit] = [
        Habit(
            id="h-1",
            title="Drink Water",
            frequency="daily",
            target=8,
            habit_type="reps",
            logs=["2026-05-07T10:00:00Z", "2026-05-06T09:00:00Z"]
        ),
        Habit(
            id="h-2",
            title="Deep Work",
            frequency="daily",
            target=1,
            habit_type="timed",
            duration_minutes=90,
            logs=["2026-05-05T18:00:00Z"]
        ),
        Habit(
            id="h-3",
            title="Gym",
            frequency="weekly",
            target=3,
            habit_type="reps",
            logs=[]
        )
    ]

    @staticmethod
    async def get_habits() -> Result[List[Habit], str]:
        """Returns all habits with their logs."""
        try:
            return Result.ok(HabitsService._habits)
        except Exception as e:
            return Result.fail(str(e))

    @staticmethod
    async def create_habit(data: HabitCreate) -> Result[Habit, str]:
        """Creates a new habit definition."""
        try:
            new_habit = Habit(
                id=str(uuid.uuid4()),
                title=data.title,
                frequency=data.frequency,
                target=data.target,
                habit_type=data.habit_type,
                duration_minutes=data.duration_minutes,
                logs=[]
            )
            HabitsService._habits.append(new_habit)
            return Result.ok(new_habit)
        except Exception as e:
            return Result.fail(str(e))

    @staticmethod
    async def update_habit(habit_id: str, data: HabitUpdate) -> Result[dict, str]:
        """Updates habit configuration."""
        try:
            for habit in HabitsService._habits:
                if habit.id == habit_id:
                    if data.title: habit.title = data.title
                    if data.frequency: habit.frequency = data.frequency
                    if data.target: habit.target = data.target
                    if data.habit_type: habit.habit_type = data.habit_type
                    if data.duration_minutes: habit.duration_minutes = data.duration_minutes
                    return Result.ok({"id": habit_id, "status": "updated"})
            return Result.fail("Habit not found")
        except Exception as e:
            return Result.fail(str(e))

    @staticmethod
    async def delete_habit(habit_id: str) -> Result[dict, str]:
        """Permanently deletes a habit."""
        try:
            HabitsService._habits = [h for h in HabitsService._habits if h.id != habit_id]
            
            await broker.publish(BaseEvent(
                event_type="HABIT_DELETED",
                payload={"habit_id": habit_id}
            ))
            
            return Result.ok({"id": habit_id, "status": "deleted"})
        except Exception as e:
            return Result.fail(str(e))

    @staticmethod
    async def toggle_habit_log(habit_id: str) -> Result[dict, str]:
        """
        Toggles a habit log for the current day.
        If already logged today, removes it. Otherwise, adds it.
        """
        try:
            today_str = date.today().isoformat()
            found_habit = None
            for habit in HabitsService._habits:
                if habit.id == habit_id:
                    found_habit = habit
                    break
            
            if not found_habit:
                return Result.fail("Habit not found")

            # Check if logged today
            today_log_index = -1
            for i, log in enumerate(found_habit.logs):
                if log.startswith(today_str):
                    today_log_index = i
                    break
            
            if today_log_index >= 0:
                # Remove today's log
                found_habit.logs.pop(today_log_index)
                action = "removed"
            else:
                # Add log for now
                found_habit.logs.append(datetime.now(timezone.utc).isoformat())
                action = "added"

            # Publish HABIT_LOGGED Event (can be used for both add/remove or create separate undo event)
            event = BaseEvent(
                event_type="HABIT_LOGGED",
                payload={
                    "habit_id": habit_id,
                    "action": action,
                    "status": "completed" if action == "added" else "undone"
                }
            )
            
            await broker.publish(event)

            return Result.ok({
                "status": action,
                "habit_id": habit_id
            })

        except Exception as e:
            return Result.fail(f"Internal error while toggling habit: {str(e)}")

    @staticmethod
    async def add_habit_log(data: HabitLogCreate) -> Result[dict, str]:
        """Legacy support for direct logging, now redirects to toggle if needed or just appends."""
        return await HabitsService.toggle_habit_log(data.habit_id)

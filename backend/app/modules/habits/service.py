from typing import List, Optional, Dict, Any
from pydantic import BaseModel, UUID4
from app.core.results import Result
from app.core.broker import broker, BaseEvent
from datetime import datetime, date, timezone
import uuid

class HabitLog(BaseModel):
    timestamp: str
    value: float

class Habit(BaseModel):
    id: str
    name: str
    frequency: str # 'daily', 'weekly', 'monthly'
    unit: str = 'rep' # 'rep' or 'min'
    two_min_threshold: int
    normal_threshold: int
    hard_threshold: int
    impossible_threshold: int
    points: int = 0
    level: int = 0
    logs: List[HabitLog] = []

class HabitCreate(BaseModel):
    name: str
    frequency: str
    unit: str = 'rep'
    two_min_threshold: int
    normal_threshold: int
    hard_threshold: int
    impossible_threshold: int
    points: Optional[int] = 0
    level: Optional[int] = 0

class HabitUpdate(BaseModel):
    title: Optional[str] = None
    frequency: Optional[str] = None
    unit: Optional[str] = None
    two_min_threshold: Optional[int] = None
    normal_threshold: Optional[int] = None
    hard_threshold: Optional[int] = None
    impossible_threshold: Optional[int] = None
    points: Optional[int] = None
    level: Optional[int] = None

class HabitLogCreate(BaseModel):
    habit_id: str
    value: float # reps or minutes

class HabitsService:
    # In-memory storage updated for progression model
    _habits: List[Habit] = [
        Habit(
            id="h-1",
            title="Drink Water",
            frequency="daily",
            unit="rep",
            two_min_threshold=1,
            normal_threshold=4,
            hard_threshold=8,
            impossible_threshold=12,
            logs=[HabitLog(timestamp="2026-05-07T10:00:00Z", value=8.0)]
        ),
        Habit(
            id="h-2",
            title="Deep Work",
            frequency="daily",
            unit="min",
            two_min_threshold=2,
            normal_threshold=60,
            hard_threshold=120,
            impossible_threshold=240,
            logs=[HabitLog(timestamp="2026-05-05T18:00:00Z", value=90.0)]
        )
    ]

    @staticmethod
    def _calculate_daily_points(habit: Habit, log_date: str) -> int:
        """Calculates total points for a specific date for a given habit."""
        # Sum all values for the given day
        daily_total = sum(log.value for log in habit.logs if log.timestamp.startswith(log_date))
        
        points = 0
        if daily_total >= habit.impossible_threshold:
            points = 4
        elif daily_total >= habit.hard_threshold:
            points = 3
        elif daily_total >= habit.normal_threshold:
            points = 2
        elif daily_total >= habit.two_min_threshold:
            points = 1
        return points

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
            # Domain Validation
            if not data.title or len(data.title.strip()) == 0:
                return Result.fail("VALIDATION_ERROR: Habit title is required.")
            
            if data.two_min_threshold < 0 or data.normal_threshold < 0:
                return Result.fail("VALIDATION_ERROR: Thresholds cannot be negative.")

            new_habit = Habit(
                id=str(uuid.uuid4()),
                title=data.title,
                frequency=data.frequency,
                unit=data.unit,
                two_min_threshold=data.two_min_threshold,
                normal_threshold=data.normal_threshold,
                hard_threshold=data.hard_threshold,
                impossible_threshold=data.impossible_threshold,
                points=data.points or 0,
                level=data.level or 0,
                logs=[]
            )
            
            # Simulate Database Latency/Checks
            # In a real scenario, this is where a Postgres 'Undefined Column' or 'Type Mismatch' would be caught
            HabitsService._habits.append(new_habit)
            
            return Result.ok(new_habit)
        except Exception as e:
            # Capture specific error signatures for AI/Log parsing
            error_detail = f"DB_ERROR: {str(e)}" if "database" in str(e).lower() else f"INTERNAL_ERROR: {str(e)}"
            return Result.fail(error_detail)

    @staticmethod
    async def update_habit(habit_id: str, data: HabitUpdate) -> Result[dict, str]:
        """Updates habit configuration."""
        try:
            for habit in HabitsService._habits:
                if habit.id == habit_id:
                    if data.title: habit.title = data.title
                    if data.frequency: habit.frequency = data.frequency
                    if data.unit: habit.unit = data.unit
                    if data.two_min_threshold is not None: habit.two_min_threshold = data.two_min_threshold
                    if data.normal_threshold is not None: habit.normal_threshold = data.normal_threshold
                    if data.hard_threshold is not None: habit.hard_threshold = data.hard_threshold
                    if data.impossible_threshold is not None: habit.impossible_threshold = data.impossible_threshold
                    if data.points is not None: habit.points = data.points
                    if data.level is not None: habit.level = data.level
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
    async def add_habit_log(data: HabitLogCreate) -> Result[dict, str]:
        """
        Adds a new log entry and returns daily points earned.
        """
        try:
            today_str = date.today().isoformat()
            found_habit = None
            for habit in HabitsService._habits:
                if habit.id == data.habit_id:
                    found_habit = habit
                    break
            
            if not found_habit:
                return Result.fail("Habit not found")

            # Add new log using LOCAL time for consistency with daily tracking
            found_habit.logs.append(HabitLog(
                timestamp=datetime.now().isoformat(),
                value=data.value
            ))

            # Calculate total points for today
            points = HabitsService._calculate_daily_points(found_habit, today_str)

            # Publish HABIT_LOGGED Event
            event = BaseEvent(
                event_type="HABIT_LOGGED",
                payload={
                    "habit_id": data.habit_id,
                    "value": data.value,
                    "daily_points": points
                }
            )
            
            await broker.publish(event)

            return Result.ok({
                "habit_id": data.habit_id,
                "daily_points": points,
                "status": "logged"
            })

        except Exception as e:
            return Result.fail(f"Internal error while logging habit: {str(e)}")

    @staticmethod
    async def update_habit_log(data: HabitLogCreate) -> Result[dict, str]:
        """
        Updates the daily total for a habit. 
        Replaces all logs for today with a single new value.
        """
        try:
            today_str = date.today().isoformat()
            found_habit = None
            for habit in HabitsService._habits:
                if habit.id == data.habit_id:
                    found_habit = habit
                    break
            
            if not found_habit:
                return Result.fail("Habit not found")

            # Remove all logs for today
            found_habit.logs = [l for l in found_habit.logs if not l.timestamp.startswith(today_str)]
            
            # Add the new replacement log using LOCAL time
            found_habit.logs.append(HabitLog(
                timestamp=datetime.now().isoformat(),
                value=data.value
            ))

            # Calculate total points for today
            points = HabitsService._calculate_daily_points(found_habit, today_str)

            # Publish HABIT_LOGGED Event
            event = BaseEvent(
                event_type="HABIT_LOGGED",
                payload={
                    "habit_id": data.habit_id,
                    "value": data.value,
                    "daily_points": points,
                    "is_update": True
                }
            )
            await broker.publish(event)

            return Result.ok({
                "habit_id": data.habit_id,
                "daily_points": points,
                "status": "updated"
            })

        except Exception as e:
            return Result.fail(f"Internal error while updating habit log: {str(e)}")

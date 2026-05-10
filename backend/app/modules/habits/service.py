from typing import List, Optional, Dict, Any
from pydantic import BaseModel, UUID4
from app.core.results import Result
from app.core.broker import broker, BaseEvent
from datetime import datetime, date, timezone
import uuid
from sqlalchemy.orm import Session
import app.models as models

class HabitLog(BaseModel):
    timestamp: str
    value: float

class Habit(BaseModel):
    id: str
    name: str
    frequency: str
    unit: str = 'rep'
    two_min_threshold: float
    normal_threshold: float
    hard_threshold: float
    impossible_threshold: float
    logs: List[HabitLog] = []

class HabitCreate(BaseModel):
    name: str
    frequency: str
    unit: str = 'rep'
    two_min_threshold: float
    normal_threshold: float
    hard_threshold: float
    impossible_threshold: float

class HabitUpdate(BaseModel):
    name: Optional[str] = None
    frequency: Optional[str] = None
    unit: Optional[str] = None
    two_min_threshold: Optional[float] = None
    normal_threshold: Optional[float] = None
    hard_threshold: Optional[float] = None
    impossible_threshold: Optional[float] = None

class HabitLogCreate(BaseModel):
    habit_id: str
    value: float

class HabitsService:
    @staticmethod
    def _calculate_daily_points(habit_obj: models.Habit, db_logs: List[models.HabitLog], log_date: str) -> int:
        """Calculates total points for a specific date for a given habit."""
        # Sum all values for the given day
        daily_total = sum(log.value for log in db_logs if log.timestamp.strftime("%Y-%m-%d") == log_date)
        
        points = 0
        if daily_total >= habit_obj.impossible_threshold:
            points = 4
        elif daily_total >= habit_obj.hard_threshold:
            points = 3
        elif daily_total >= habit_obj.normal_threshold:
            points = 2
        elif daily_total >= habit_obj.two_min_threshold:
            points = 1
        return points

    @staticmethod
    async def get_habits(db: Session) -> Result[List[Habit], str]:
        """Returns all habits with their logs from the database."""
        try:
            db_habits = db.query(models.Habit).all()
            results = []
            for h in db_habits:
                habit_data = Habit(
                    id=h.id,
                    name=h.name,
                    frequency=h.frequency,
                    unit=h.unit,
                    two_min_threshold=h.two_min_threshold,
                    normal_threshold=h.normal_threshold,
                    hard_threshold=h.hard_threshold,
                    impossible_threshold=h.impossible_threshold,
                    logs=[
                        HabitLog(
                            timestamp=l.timestamp.isoformat(),
                            value=l.value
                        ) for l in h.logs
                    ]
                )
                results.append(habit_data)
            return Result.ok(results)
        except Exception as e:
            return Result.fail(str(e))

    @staticmethod
    async def create_habit(data: HabitCreate, db: Session) -> Result[Habit, str]:
        """Creates a new habit definition in the database."""
        try:
            new_habit = models.Habit(
                id=str(uuid.uuid4()),
                name=data.name,
                frequency=data.frequency,
                unit=data.unit,
                two_min_threshold=data.two_min_threshold,
                normal_threshold=data.normal_threshold,
                hard_threshold=data.hard_threshold,
                impossible_threshold=data.impossible_threshold
            )
            db.add(new_habit)
            db.commit()
            db.refresh(new_habit)
            
            return Result.ok(Habit(
                id=new_habit.id,
                name=new_habit.name,
                frequency=new_habit.frequency,
                unit=new_habit.unit,
                two_min_threshold=new_habit.two_min_threshold,
                normal_threshold=new_habit.normal_threshold,
                hard_threshold=new_habit.hard_threshold,
                impossible_threshold=new_habit.impossible_threshold,
                logs=[]
            ))
        except Exception as e:
            return Result.fail(str(e))

    @staticmethod
    async def update_habit(habit_id: str, data: HabitUpdate, db: Session) -> Result[dict, str]:
        """Updates habit configuration in the database."""
        try:
            habit = db.query(models.Habit).filter(models.Habit.id == habit_id).first()
            if not habit:
                return Result.fail("Habit not found")
                
            if data.name is not None: habit.name = data.name
            if data.frequency is not None: habit.frequency = data.frequency
            if data.unit is not None: habit.unit = data.unit
            if data.two_min_threshold is not None: habit.two_min_threshold = data.two_min_threshold
            if data.normal_threshold is not None: habit.normal_threshold = data.normal_threshold
            if data.hard_threshold is not None: habit.hard_threshold = data.hard_threshold
            if data.impossible_threshold is not None: habit.impossible_threshold = data.impossible_threshold
            
            db.commit()
            return Result.ok({"id": habit_id, "status": "updated"})
        except Exception as e:
            return Result.fail(str(e))

    @staticmethod
    async def delete_habit(habit_id: str, db: Session) -> Result[dict, str]:
        """Permanently deletes a habit from the database."""
        try:
            habit = db.query(models.Habit).filter(models.Habit.id == habit_id).first()
            if not habit:
                return Result.fail("Habit not found")
            
            db.delete(habit)
            db.commit()
            
            await broker.publish(BaseEvent(
                event_type="HABIT_DELETED",
                payload={"habit_id": habit_id}
            ))
            
            return Result.ok({"id": habit_id, "status": "deleted"})
        except Exception as e:
            return Result.fail(str(e))

    @staticmethod
    async def add_habit_log(data: HabitLogCreate, db: Session) -> Result[dict, str]:
        """Adds a new log entry to the database."""
        try:
            habit = db.query(models.Habit).filter(models.Habit.id == data.habit_id).first()
            if not habit:
                return Result.fail("Habit not found")

            new_log = models.HabitLog(
                id=str(uuid.uuid4()),
                habit_id=data.habit_id,
                value=data.value,
                timestamp=datetime.now(timezone.utc)
            )
            db.add(new_log)
            db.commit()
            db.refresh(habit) # Refresh to get updated logs relationship

            today_str = date.today().isoformat()
            points = HabitsService._calculate_daily_points(habit, habit.logs, today_str)

            await broker.publish(BaseEvent(
                event_type="HABIT_LOGGED",
                payload={
                    "habit_id": data.habit_id,
                    "value": data.value,
                    "daily_points": points
                }
            ))

            return Result.ok({
                "habit_id": data.habit_id,
                "daily_points": points,
                "status": "logged"
            })
        except Exception as e:
            return Result.fail(str(e))

    @staticmethod
    async def update_habit_log(data: HabitLogCreate, db: Session) -> Result[dict, str]:
        """Updates the daily total for a habit by replacing today's logs."""
        try:
            habit = db.query(models.Habit).filter(models.Habit.id == data.habit_id).first()
            if not habit:
                return Result.fail("Habit not found")

            today = date.today()
            # Delete existing logs for today
            db.query(models.HabitLog).filter(
                models.HabitLog.habit_id == data.habit_id,
                models.HabitLog.timestamp >= datetime.combine(today, datetime.min.time(), tzinfo=timezone.utc)
            ).delete()
            
            new_log = models.HabitLog(
                id=str(uuid.uuid4()),
                habit_id=data.habit_id,
                value=data.value,
                timestamp=datetime.now(timezone.utc)
            )
            db.add(new_log)
            db.commit()
            db.refresh(habit)

            points = HabitsService._calculate_daily_points(habit, habit.logs, today.isoformat())

            await broker.publish(BaseEvent(
                event_type="HABIT_LOGGED",
                payload={
                    "habit_id": data.habit_id,
                    "value": data.value,
                    "daily_points": points,
                    "is_update": True
                }
            ))

            return Result.ok({
                "habit_id": data.habit_id,
                "daily_points": points,
                "status": "updated"
            })
        except Exception as e:
            return Result.fail(str(e))

from datetime import datetime, timezone
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, UUID4, validator
from app.core.results import Result
from app.core.broker import broker, BaseEvent

class EventCreate(BaseModel):
    title: str
    start_time: datetime
    end_time: datetime
    repeat_pattern: Optional[str] = None  # None, 'Daily', 'Weekly', 'Monthly'
    goal_id: Optional[UUID4] = None

    @validator('start_time', 'end_time', pre=True)
    def ensure_utc_aware(cls, v):
        try:
            if isinstance(v, str):
                # Handle 'Z' or other ISO formats
                dt = datetime.fromisoformat(v.replace('Z', '+00:00'))
            elif isinstance(v, datetime):
                dt = v
            else:
                return v

            if dt.tzinfo is None:
                return dt.replace(tzinfo=timezone.utc)
            return dt.astimezone(timezone.utc)
        except Exception:
            raise ValueError("TIMEZONE_MISMATCH")

class EventUpdate(BaseModel):
    title: Optional[str] = None
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    repeat_pattern: Optional[str] = None

    @validator('start_time', 'end_time', pre=True)
    def ensure_utc_aware(cls, v):
        if v is None: return None
        try:
            if isinstance(v, str):
                dt = datetime.fromisoformat(v.replace('Z', '+00:00'))
            elif isinstance(v, datetime):
                dt = v
            else:
                return v

            if dt.tzinfo is None:
                return dt.replace(tzinfo=timezone.utc)
            return dt.astimezone(timezone.utc)
        except Exception:
            raise ValueError("TIMEZONE_MISMATCH")

class ScheduledItem(BaseModel):
    """Represents any item already on the schedule (event, task, habit, or time block)."""
    id: str
    title: str
    start_time: datetime
    end_time: datetime
    item_type: str  # 'event', 'task', 'habit', 'time_block'
    is_conflict: bool = False
    repeat_pattern: Optional[str] = None

    @validator('start_time', 'end_time', pre=True)
    def ensure_utc_aware(cls, v):
        try:
            if isinstance(v, str):
                dt = datetime.fromisoformat(v.replace('Z', '+00:00'))
            elif isinstance(v, datetime):
                dt = v
            else:
                return v
            
            if dt.tzinfo is None:
                return dt.replace(tzinfo=timezone.utc)
            return dt.astimezone(timezone.utc)
        except Exception:
            raise ValueError("TIMEZONE_MISMATCH")

class SchedulesService:
    # In-memory store for mock
    _items: List[Dict[str, Any]] = [
        {
            "id": "s-1",
            "title": "Deep Work",
            "start_time": datetime.now(timezone.utc).replace(hour=9, minute=0, second=0),
            "end_time": datetime.now(timezone.utc).replace(hour=11, minute=0, second=0),
            "item_type": "time_block",
            "is_conflict": False,
            "repeat_pattern": "Daily"
        },
        {
            "id": "s-2",
            "title": "Weekly Sync",
            "start_time": datetime.now(timezone.utc).replace(hour=14, minute=0, second=0),
            "end_time": datetime.now(timezone.utc).replace(hour=15, minute=0, second=0),
            "item_type": "event",
            "is_conflict": False,
            "repeat_pattern": "Weekly"
        },
        {
            "id": "s-3",
            "title": "Strategy Session",
            "start_time": datetime.now(timezone.utc).replace(hour=16, minute=30, second=0),
            "end_time": datetime.now(timezone.utc).replace(hour=18, minute=0, second=0),
            "item_type": "event",
            "is_conflict": False,
            "repeat_pattern": None
        },
        {
            "id": "s-4",
            "title": "Morning Routine",
            "start_time": datetime.now(timezone.utc).replace(hour=7, minute=0, second=0),
            "end_time": datetime.now(timezone.utc).replace(hour=8, minute=0, second=0),
            "item_type": "habit",
            "is_conflict": False,
            "repeat_pattern": "Daily"
        }
    ]

    @staticmethod
    def _is_overlapping(start1: datetime, end1: datetime, start2: datetime, end2: datetime) -> bool:
        """Helper to check if two time ranges overlap. Assumes all datetimes are UTC-aware."""
        return start1 < end2 and start2 < end1

    @staticmethod
    async def get_all_items() -> Result[List[dict], str]:
        return Result.ok(SchedulesService._items)

    @staticmethod
    async def detect_conflicts(new_event: EventCreate, existing_items: List[dict]) -> List[dict]:
        """
        Detects overlaps between a new event and existing scheduled items.
        """
        conflicts = []
        for item in existing_items:
            # Pydantic validation handles new_event, but we should ensure mock items are also aware
            item_start = item["start_time"]
            item_end = item["end_time"]
            
            if item_start.tzinfo is None:
                item_start = item_start.replace(tzinfo=timezone.utc)
            if item_end.tzinfo is None:
                item_end = item_end.replace(tzinfo=timezone.utc)

            if SchedulesService._is_overlapping(
                new_event.start_time, new_event.end_time,
                item_start, item_end
            ):
                conflicts.append(item)
        return conflicts

    @staticmethod
    async def create_event(data: EventCreate) -> Result[Dict[str, Any], str]:
        """
        Creates a new event. If conflicts are detected, publishes a SCHEDULE_CONFLICT_DETECTED event.
        """
        try:
            # 1. Run Conflict Detection
            conflicts = await SchedulesService.detect_conflicts(data, SchedulesService._items)
            
            # 2. Handle Conflicts
            if conflicts:
                print(f"[Schedules] Conflict detected for '{data.title}'. Publishing event.")
                for c in conflicts:
                    c["is_conflict"] = True
                
                conflict_event = BaseEvent(
                    event_type="SCHEDULE_CONFLICT_DETECTED",
                    payload={
                        "new_event": data.dict(),
                        "conflicts": [c["id"] for c in conflicts]
                    }
                )
                await broker.publish(conflict_event)

            # 3. Persistence
            event_id = f"s-{len(SchedulesService._items) + 1}"
            new_item = {
                "id": event_id,
                "title": data.title,
                "start_time": data.start_time,
                "end_time": data.end_time,
                "item_type": "event",
                "is_conflict": len(conflicts) > 0,
                "repeat_pattern": data.repeat_pattern
            }
            SchedulesService._items.append(new_item)

            return Result.ok(new_item)

        except ValueError as ve:
            if str(ve) == "TIMEZONE_MISMATCH":
                return Result.fail("TIMEZONE_MISMATCH")
            return Result.fail(f"Validation error: {str(ve)}")
        except Exception as e:
            return Result.fail(f"Failed to create event: {str(e)}")

    @staticmethod
    async def update_event(event_id: str, data: EventUpdate) -> Result[Dict[str, Any], str]:
        """
        Updates an existing event. Re-runs conflict detection.
        """
        try:
            # 1. Find the item
            found_index = -1
            for i, item in enumerate(SchedulesService._items):
                if item["id"] == event_id:
                    found_index = i
                    break
            
            if found_index == -1:
                return Result.fail("Event not found")

            # 2. Update fields
            current_item = SchedulesService._items[found_index]
            update_dict = data.dict(exclude_unset=True)
            for key, value in update_dict.items():
                current_item[key] = value

            # 3. Run Conflict Detection (excluding current item)
            other_items = [item for item in SchedulesService._items if item["id"] != event_id]
            
            # Temporary mock of EventCreate for conflict detection logic
            check_data = EventCreate(
                title=current_item["title"],
                start_time=current_item["start_time"],
                end_time=current_item["end_time"],
                repeat_pattern=current_item.get("repeat_pattern")
            )
            
            conflicts = await SchedulesService.detect_conflicts(check_data, other_items)
            current_item["is_conflict"] = len(conflicts) > 0

            if conflicts:
                conflict_event = BaseEvent(
                    event_type="SCHEDULE_CONFLICT_DETECTED",
                    payload={
                        "new_event": current_item,
                        "conflicts": [c["id"] for c in conflicts]
                    }
                )
                await broker.publish(conflict_event)

            return Result.ok(current_item)

        except ValueError as ve:
            if str(ve) == "TIMEZONE_MISMATCH":
                return Result.fail("TIMEZONE_MISMATCH")
            return Result.fail(f"Validation error: {str(ve)}")
        except Exception as e:
            return Result.fail(f"Failed to update event: {str(e)}")

    @staticmethod
    async def delete_event(event_id: str) -> Result[bool, str]:
        """
        Deletes an event and publishes SCHEDULE_EVENT_DELETED.
        """
        try:
            initial_len = len(SchedulesService._items)
            SchedulesService._items = [item for item in SchedulesService._items if item["id"] != event_id]
            
            if len(SchedulesService._items) < initial_len:
                await broker.publish(BaseEvent(
                    event_type="SCHEDULE_EVENT_DELETED",
                    payload={"event_id": event_id}
                ))
                return Result.ok(True)
            return Result.fail("Event not found")
        except Exception as e:
            return Result.fail(f"Failed to delete event: {str(e)}")

    @staticmethod
    async def find_next_open_slot(current_time: Optional[datetime] = None) -> Optional[Dict[str, Any]]:
        """
        Finds the next available time slot after current_time.
        """
        now = current_time or datetime.now(timezone.utc)
        if now.tzinfo is None:
            now = now.replace(tzinfo=timezone.utc)
        
        from datetime import timedelta
        start_time = now + timedelta(minutes=15)
        return {
            "start_time": start_time,
            "end_time": start_time + timedelta(hours=1),
            "label": "Open Slot"
        }

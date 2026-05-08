from datetime import datetime
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, UUID4
from app.core.results import Result
from app.core.broker import broker, BaseEvent

class EventCreate(BaseModel):
    title: str
    start_time: datetime
    end_time: datetime
    repeat_pattern: Optional[str] = None  # None, 'Daily', 'Weekly', 'Monthly'
    goal_id: Optional[UUID4] = None

class ScheduledItem(BaseModel):
    """Represents any item already on the schedule (event, task, habit, or time block)."""
    id: str
    title: str
    start_time: datetime
    end_time: datetime
    item_type: str  # 'event', 'task', 'habit', 'time_block'
    is_conflict: bool = False
    repeat_pattern: Optional[str] = None

class SchedulesService:
    # In-memory store for mock
    _items: List[Dict[str, Any]] = [
        {
            "id": "s-1",
            "title": "Deep Work",
            "start_time": datetime.now().replace(hour=9, minute=0, second=0),
            "end_time": datetime.now().replace(hour=11, minute=0, second=0),
            "item_type": "time_block",
            "is_conflict": False,
            "repeat_pattern": "Daily"
        },
        {
            "id": "s-2",
            "title": "Weekly Sync",
            "start_time": datetime.now().replace(hour=14, minute=0, second=0),
            "end_time": datetime.now().replace(hour=15, minute=0, second=0),
            "item_type": "event",
            "is_conflict": False,
            "repeat_pattern": "Weekly"
        },
        {
            "id": "s-3",
            "title": "Strategy Session",
            "start_time": datetime.now().replace(hour=16, minute=30, second=0),
            "end_time": datetime.now().replace(hour=18, minute=0, second=0),
            "item_type": "event",
            "is_conflict": False,
            "repeat_pattern": None
        },
        {
            "id": "s-4",
            "title": "Morning Routine",
            "start_time": datetime.now().replace(hour=7, minute=0, second=0),
            "end_time": datetime.now().replace(hour=8, minute=0, second=0),
            "item_type": "habit",
            "is_conflict": False,
            "repeat_pattern": "Daily"
        }
    ]

    @staticmethod
    def _is_overlapping(start1: datetime, end1: datetime, start2: datetime, end2: datetime) -> bool:
        """Helper to check if two time ranges overlap."""
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
            if SchedulesService._is_overlapping(
                new_event.start_time, new_event.end_time,
                item["start_time"], item["end_time"]
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

        except Exception as e:
            return Result.fail(f"Failed to create event: {str(e)}")

    @staticmethod
    async def find_next_open_slot(current_time: Optional[datetime] = None) -> Optional[Dict[str, Any]]:
        """
        Finds the next available time slot after current_time.
        (Mock implementation for scaffolding)
        """
        now = current_time or datetime.utcnow()
        # In a real implementation, we would query DB for events/blocks after 'now'
        # and find the first gap of at least 30 minutes.
        
        # For mock: Suggest a slot starting in 15 minutes
        # We use timedelta to avoid issues with minutes overflow
        from datetime import timedelta
        start_time = now + timedelta(minutes=15)
        return {
            "start_time": start_time,
            "end_time": start_time + timedelta(hours=1),
            "label": "Open Slot"
        }

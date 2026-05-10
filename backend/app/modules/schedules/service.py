from datetime import datetime, timezone
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, UUID4, validator
from app.core.results import Result
from app.core.broker import broker, BaseEvent
from sqlalchemy.orm import Session
import app.models as models
import uuid

class EventCreate(BaseModel):
    title: str
    start_time: datetime
    end_time: datetime
    repeat_pattern: Optional[str] = None
    goal_id: Optional[str] = None

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
    id: str
    title: str
    start_time: datetime
    end_time: datetime
    item_type: str
    is_conflict: bool = False
    repeat_pattern: Optional[str] = None

class SchedulesService:
    @staticmethod
    def _is_overlapping(start1: datetime, end1: datetime, start2: datetime, end2: datetime) -> bool:
        return start1 < end2 and start2 < end1

    @staticmethod
    async def get_all_items(db: Session) -> Result[List[dict], str]:
        try:
            events = db.query(models.ScheduledEvent).all()
            results = [
                {
                    "id": e.id,
                    "title": e.title,
                    "start_time": e.start_time,
                    "end_time": e.end_time,
                    "item_type": "event",
                    "is_conflict": e.is_conflict,
                    "goal_id": e.goal_id
                } for e in events
            ]
            return Result.ok(results)
        except Exception as e:
            return Result.fail(str(e))

    @staticmethod
    async def detect_conflicts(new_start: datetime, new_end: datetime, existing_items: List[models.ScheduledEvent]) -> List[models.ScheduledEvent]:
        conflicts = []
        for item in existing_items:
            if SchedulesService._is_overlapping(new_start, new_end, item.start_time, item.end_time):
                conflicts.append(item)
        return conflicts

    @staticmethod
    async def create_event(data: EventCreate, db: Session) -> Result[Dict[str, Any], str]:
        try:
            existing_events = db.query(models.ScheduledEvent).all()
            conflicts = await SchedulesService.detect_conflicts(data.start_time, data.end_time, existing_events)
            
            is_conflict = len(conflicts) > 0
            if is_conflict:
                for c in conflicts:
                    c.is_conflict = True
                
                await broker.publish(BaseEvent(
                    event_type="SCHEDULE_CONFLICT_DETECTED",
                    payload={
                        "new_event": data.dict(),
                        "conflicts": [c.id for c in conflicts]
                    }
                ))

            new_event = models.ScheduledEvent(
                id=str(uuid.uuid4()),
                title=data.title,
                start_time=data.start_time,
                end_time=data.end_time,
                is_conflict=is_conflict,
                goal_id=data.goal_id
            )
            db.add(new_event)
            db.commit()
            db.refresh(new_event)

            return Result.ok({
                "id": new_event.id,
                "title": new_event.title,
                "start_time": new_event.start_time,
                "end_time": new_event.end_time,
                "item_type": "event",
                "is_conflict": new_event.is_conflict,
                "goal_id": new_event.goal_id
            })

        except Exception as e:
            return Result.fail(str(e))

    @staticmethod
    async def update_event(event_id: str, data: EventUpdate, db: Session) -> Result[Dict[str, Any], str]:
        try:
            event = db.query(models.ScheduledEvent).filter(models.ScheduledEvent.id == event_id).first()
            if not event:
                return Result.fail("Event not found")

            if data.title is not None: event.title = data.title
            if data.start_time is not None: event.start_time = data.start_time
            if data.end_time is not None: event.end_time = data.end_time

            other_events = db.query(models.ScheduledEvent).filter(models.ScheduledEvent.id != event_id).all()
            conflicts = await SchedulesService.detect_conflicts(event.start_time, event.end_time, other_events)
            event.is_conflict = len(conflicts) > 0

            db.commit()
            db.refresh(event)

            return Result.ok({
                "id": event.id,
                "title": event.title,
                "start_time": event.start_time,
                "end_time": event.end_time,
                "is_conflict": event.is_conflict
            })
        except Exception as e:
            return Result.fail(str(e))

    @staticmethod
    async def delete_event(event_id: str, db: Session) -> Result[bool, str]:
        try:
            event = db.query(models.ScheduledEvent).filter(models.ScheduledEvent.id == event_id).first()
            if not event:
                return Result.fail("Event not found")
            
            db.delete(event)
            db.commit()
            
            await broker.publish(BaseEvent(
                event_type="SCHEDULE_EVENT_DELETED",
                payload={"event_id": event_id}
            ))
            return Result.ok(True)
        except Exception as e:
            return Result.fail(str(e))

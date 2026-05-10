from fastapi import APIRouter, Body, Depends
from app.modules.schedules.service import SchedulesService, EventCreate, EventUpdate, ScheduledItem
from app.core.results import Result
from typing import List, Any
from sqlalchemy.orm import Session
from app.database import get_db

router = APIRouter(tags=["schedules"])

@router.get("/")
async def get_schedule(db: Session = Depends(get_db)) -> Result[List[dict], str]:
    return await SchedulesService.get_all_items(db)

@router.post("/")
async def create_time_block(data: dict = Body(...), db: Session = Depends(get_db)) -> Result[Any, str]:
    try:
        event_data = EventCreate(**data)
        return await SchedulesService.create_event(event_data, db)
    except ValueError as ve:
        error_msg = str(ve)
        if "TIMEZONE_MISMATCH" in error_msg:
            return Result.fail("TIMEZONE_MISMATCH")
        return Result.fail(f"Validation Error: {error_msg}")
    except Exception as e:
        return Result.fail(f"Request Error: {str(e)}")

@router.put("/{event_id}")
async def update_time_block(event_id: str, data: dict = Body(...), db: Session = Depends(get_db)) -> Result[Any, str]:
    try:
        event_data = EventUpdate(**data)
        return await SchedulesService.update_event(event_id, event_data, db)
    except ValueError as ve:
        error_msg = str(ve)
        if "TIMEZONE_MISMATCH" in error_msg:
            return Result.fail("TIMEZONE_MISMATCH")
        return Result.fail(f"Validation Error: {error_msg}")
    except Exception as e:
        return Result.fail(f"Request Error: {str(e)}")

@router.delete("/{event_id}")
async def delete_time_block(event_id: str, db: Session = Depends(get_db)) -> Result[bool, str]:
    return await SchedulesService.delete_event(event_id, db)

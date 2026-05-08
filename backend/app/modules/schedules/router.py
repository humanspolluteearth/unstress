from fastapi import APIRouter, Body
from app.modules.schedules.service import SchedulesService, EventCreate, EventUpdate, ScheduledItem
from app.core.results import Result
from typing import List, Any

router = APIRouter(prefix="/schedules", tags=["schedules"])

@router.get("/")
async def get_schedule() -> Result[List[dict], str]:
    return await SchedulesService.get_all_items()

@router.post("/")
async def create_time_block(data: dict = Body(...)) -> Result[Any, str]:
    try:
        event_data = EventCreate(**data)
        return await SchedulesService.create_event(event_data)
    except ValueError as ve:
        # Check if it's our custom TIMEZONE_MISMATCH error from the validator
        error_msg = str(ve)
        if "TIMEZONE_MISMATCH" in error_msg:
            return Result.fail("TIMEZONE_MISMATCH")
        return Result.fail(f"Validation Error: {error_msg}")
    except Exception as e:
        return Result.fail(f"Request Error: {str(e)}")

@router.put("/{event_id}")
async def update_time_block(event_id: str, data: dict = Body(...)) -> Result[Any, str]:
    try:
        event_data = EventUpdate(**data)
        return await SchedulesService.update_event(event_id, event_data)
    except ValueError as ve:
        error_msg = str(ve)
        if "TIMEZONE_MISMATCH" in error_msg:
            return Result.fail("TIMEZONE_MISMATCH")
        return Result.fail(f"Validation Error: {error_msg}")
    except Exception as e:
        return Result.fail(f"Request Error: {str(e)}")

@router.delete("/{event_id}")
async def delete_time_block(event_id: str) -> Result[bool, str]:
    return await SchedulesService.delete_event(event_id)

from fastapi import APIRouter, Body
from app.modules.schedules.service import SchedulesService, EventCreate, ScheduledItem
from app.core.results import Result
from typing import List

router = APIRouter(prefix="/schedules", tags=["schedules"])

@router.get("/")
async def get_schedule() -> Result[List[dict], str]:
    return await SchedulesService.get_all_items()

@router.post("/")
async def create_time_block(data: EventCreate) -> Result[dict, str]:
    return await SchedulesService.create_event(data)

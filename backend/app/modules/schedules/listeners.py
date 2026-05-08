from app.core.broker import BaseEvent, broker
from app.core.results import Result
from app.modules.schedules.service import SchedulesService
from datetime import datetime

async def handle_task_completed(event: BaseEvent) -> Result[None, str]:
    """
    Listener for TASK_COMPLETED events.
    Checks for the next open slot and publishes a suggestion.
    """
    try:
        print(f"[Schedules Module] Task {event.payload.get('task_id')} completed. Searching for next slot...")
        
        # 1. Logic to find next open slot
        next_slot = await SchedulesService.find_next_open_slot()
        
        if next_slot:
            # 2. Publish a suggestion
            # We don't import Tasks service; we just broadcast a generic suggestion
            # that the user/AI can act upon.
            suggestion_event = BaseEvent(
                event_type="TASK_SUGGESTION_GENERATED",
                payload={
                    "message": f"Task completed! Next open slot at {next_slot['start_time'].strftime('%H:%M')}. Consider starting your next high-priority task.",
                    "slot": {
                        "start_time": next_slot["start_time"].isoformat(),
                        "end_time": next_slot["end_time"].isoformat(),
                        "label": next_slot["label"]
                    }
                }
            )
            await broker.publish(suggestion_event)
            print(f"[Schedules Module] Suggested next task for slot at {next_slot['start_time']}")
            
        return Result.ok(None)
    except Exception as e:
        return Result.fail(f"Error in Schedules task-listener: {str(e)}")

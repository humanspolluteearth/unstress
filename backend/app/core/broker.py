from typing import Any, Callable, Dict, List, Type, Awaitable
from pydantic import BaseModel, Field
from datetime import datetime
from app.core.results import Result

class BaseEvent(BaseModel):
    """Base class for all internal events."""
    event_type: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    payload: Any

class EventBroker:
    def __init__(self):
        # Maps event_type strings to a list of async handler functions
        self._listeners: Dict[str, List[Callable[[BaseEvent], Awaitable[None]]]] = {}

    def subscribe(self, event_type: str, handler: Callable[[BaseEvent], Awaitable[None]]) -> Result[None, str]:
        """Registers a listener for a specific event type."""
        try:
            if event_type not in self._listeners:
                self._listeners[event_type] = []
            self._listeners[event_type].append(handler)
            return Result.ok(None)
        except Exception as e:
            return Result.fail(f"Failed to subscribe to {event_type}: {str(e)}")

    async def publish(self, event: BaseEvent) -> Result[None, str]:
        """Asynchronously publishes an event to all registered listeners."""
        try:
            if event.event_type in self._listeners:
                # Execute all handlers concurrently
                await asyncio.gather(
                    *[handler(event) for handler in self._listeners[event.event_type]]
                )
            return Result.ok(None)
        except Exception as e:
            return Result.fail(f"Event publication failed for {event.event_type}: {str(e)}")

# Global singleton instance for the Modular Monolith
# Modules should NOT import this directly to subscribe (to avoid circular deps).
# Instead, registration happens in the central startup sequence.
broker = EventBroker()

import asyncio # Needed for gather in publish

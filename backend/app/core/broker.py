from typing import Any, Callable, Dict, List, Type, Awaitable
from pydantic import BaseModel, Field
from datetime import datetime
import asyncio
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
        # In-memory history for the Review Service
        self._history: List[BaseEvent] = []
        self._max_history = 1000

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
            # Store in history
            self._history.append(event)
            if len(self._history) > self._max_history:
                self._history.pop(0)

            if event.event_type in self._listeners:
                # Execute all handlers concurrently
                await asyncio.gather(
                    *[handler(event) for handler in self._listeners[event.event_type]]
                )
            return Result.ok(None)
        except Exception as e:
            return Result.fail(f"Event publication failed for {event.event_type}: {str(e)}")

    def get_history(self) -> List[BaseEvent]:
        """Returns the current event history."""
        return self._history

# Global singleton instance for the Modular Monolith
broker = EventBroker()

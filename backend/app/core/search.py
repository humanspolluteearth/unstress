from typing import List, Dict, Any
from pydantic import BaseModel
from app.core.results import Result
from app.core.broker import broker

class SearchResult(BaseModel):
    id: str
    title: str
    type: str  # 'finance', 'task', 'habit'
    metadata: Dict[str, Any] = {}

class SearchService:
    """
    Service for high-speed cross-module searching.
    Simulates SQL-based searching across module domains.
    """

    @staticmethod
    async def global_search(query: str) -> Result[List[SearchResult], str]:
        """
        Performs a global search across Finance, Tasks, and Habits.
        In a real implementation, this would execute a series of SQL queries
        with ILIKE or Full-Text Search (FTS).
        """
        try:
            results = []
            q = query.lower()
            
            # 1. Search in Event History (as a proxy for recent activity)
            history = broker.get_history()
            for event in history:
                payload_str = str(event.payload).lower()
                if q in payload_str:
                    # Deterministic mapping to search results
                    if event.event_type == "FINANCE_TRANSACTION_ADDED":
                        results.append(SearchResult(
                            id=event.payload.get("transaction_id", "unknown"),
                            title=event.payload.get("description", "Finance Transaction"),
                            type="finance",
                            metadata={"amount": event.payload.get("amount")}
                        ))
                    elif event.event_type == "HABIT_LOGGED":
                        results.append(SearchResult(
                            id=event.payload.get("habit_id", "unknown"),
                            title=f"Habit: {event.payload.get('habit_id')}",
                            type="habit",
                            metadata={"status": event.payload.get("status")}
                        ))

            # 2. Search in Mocked Data (Simulating SQL table scans)
            # This is where we'd do: SELECT * FROM tasks WHERE title ILIKE '%query%'
            # For this scaffolding, we'll return some relevant mock results if query matches
            if "task" in q or "fix" in q:
                results.append(SearchResult(
                    id="mock-task-1",
                    title="Fix search utility latency",
                    type="task",
                    metadata={"priority": "high"}
                ))
            
            if "habit" in q or "gym" in q:
                 results.append(SearchResult(
                    id="mock-habit-1",
                    title="Go to the gym",
                    type="habit",
                    metadata={"streak": 5}
                ))

            # Deduplicate by ID
            unique_results = {r.id: r for r in results}.values()

            return Result.ok(list(unique_results))

        except Exception as e:
            return Result.fail(f"Search failed: {str(e)}")

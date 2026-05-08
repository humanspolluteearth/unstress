from datetime import datetime, timedelta
from typing import List, Dict, Any
from app.core.broker import broker, BaseEvent
from app.core.results import Result

class ReviewService:
    @staticmethod
    def get_weekly_summary() -> Result[Dict[str, Any], str]:
        """
        Generates a summary of activity from the last 7 days across all modules.
        """
        try:
            now = datetime.utcnow()
            seven_days_ago = now - timedelta(days=7)
            
            history = broker.get_history()
            weekly_events = [e for e in history if e.timestamp >= seven_days_ago]
            
            summary = {
                "finance": {"total_transactions": 0, "total_volume": 0},
                "tasks": {"completed": 0, "funded": 0},
                "habits": {"success": 0, "failed": 0},
                "goals": {"updates": 0}
            }
            
            for event in weekly_events:
                if event.event_type == "FINANCE_TRANSACTION_ADDED":
                    summary["finance"]["total_transactions"] += 1
                    # Sum volume (absolute values of postings to show activity)
                    postings = event.payload.get("postings", [])
                    volume = sum(abs(p.get("amount", 0)) for p in postings) // 2 # Double entry check
                    summary["finance"]["total_volume"] += volume
                
                elif event.event_type == "TASK_COMPLETED":
                    summary["tasks"]["completed"] += 1
                
                elif event.event_type == "TASK_FUNDED":
                    summary["tasks"]["funded"] += 1
                
                elif event.event_type == "HABIT_LOGGED":
                    if event.payload.get("status") == "success":
                        summary["habits"]["success"] += 1
                    else:
                        summary["habits"]["failed"] += 1
                
                elif event.event_type == "GOAL_UPDATE":
                    summary["goals"]["updates"] += 1

            return Result.ok(summary)
            
        except Exception as e:
            return Result.fail(f"Failed to generate review: {str(e)}")

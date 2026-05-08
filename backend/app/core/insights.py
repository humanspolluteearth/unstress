from datetime import datetime, timedelta, timezone
from typing import List, Dict, Any, Optional
from pydantic import BaseModel
from app.core.broker import broker, BaseEvent
from app.core.results import Result

class TrendMetric(BaseModel):
    label: str
    value: float
    unit: str
    change_percentage: Optional[float] = None
    insight: str

class SystemHealthReport(BaseModel):
    timestamp: datetime
    metrics: List[TrendMetric]
    summary: str

class StatisticsService:
    """
    Service for calculating deterministic trends and system health metrics.
    Analyzes event history to provide insights.
    """

    @staticmethod
    async def generate_report() -> Result[SystemHealthReport, str]:
        """
        Calculates trends and generates a SystemHealthReport.
        Publishes a REPORT_GENERATED event.
        """
        try:
            now = datetime.now(timezone.utc)
            history = broker.get_history()
            
            # 1. Calculate Spending Trends
            spending_metrics = StatisticsService._calculate_spending_trend(history, now)
            
            # 2. Calculate Habit Streaks
            habit_metrics = StatisticsService._calculate_habit_streak(history, now)
            
            # Combine metrics
            all_metrics = []
            if spending_metrics: all_metrics.append(spending_metrics)
            if habit_metrics: all_metrics.append(habit_metrics)
            
            report = SystemHealthReport(
                timestamp=now,
                metrics=all_metrics,
                summary=f"System Health Report generated at {now.isoformat()}. " + 
                        " ".join([m.insight for m in all_metrics])
            )
            
            # Publish event
            event = BaseEvent(
                event_type="REPORT_GENERATED",
                payload=report.dict()
            )
            await broker.publish(event)
            
            return Result.ok(report)
            
        except Exception as e:
            return Result.fail(f"Failed to generate statistics report: {str(e)}")

    @staticmethod
    def _calculate_spending_trend(history: List[BaseEvent], now: datetime) -> Optional[TrendMetric]:
        """Calculates spending change vs last week."""
        this_week_start = now - timedelta(days=7)
        prev_week_start = now - timedelta(days=14)
        
        this_week_vol = 0
        prev_week_vol = 0
        
        for event in history:
            if event.event_type == "FINANCE_TRANSACTION_ADDED":
                # Volume = sum of absolute amounts / 2 (double entry)
                postings = event.payload.get("postings", [])
                vol = sum(abs(p.get("amount", 0)) for p in postings) // 2
                
                if event.timestamp >= this_week_start:
                    this_week_vol += vol
                elif event.timestamp >= prev_week_start:
                    prev_week_vol += vol
                    
        if prev_week_vol == 0:
            if this_week_vol == 0: return None
            change = 100.0 # From zero to something is 100% up
        else:
            change = ((this_week_vol - prev_week_vol) / prev_week_vol) * 100
            
        direction = "up" if change >= 0 else "down"
        
        return TrendMetric(
            label="Weekly Spending",
            value=float(this_week_vol / 100),
            unit="USD",
            change_percentage=round(change, 2),
            insight=f"Spending is {direction} {abs(round(change, 1))}% vs last week."
        )

    @staticmethod
    def _calculate_habit_streak(history: List[BaseEvent], now: datetime) -> Optional[TrendMetric]:
        """Calculates current streak for habits (simplistic: any habit success counts for the day)."""
        # Group successes by day
        success_days = set()
        for event in history:
            if event.event_type == "HABIT_LOGGED" and event.payload.get("status") == "success":
                success_days.add(event.timestamp.date())
        
        if not success_days:
            return None
            
        # Calculate current streak
        streak = 0
        check_date = now.date()
        
        # If not logged today, check if logged yesterday to continue streak
        if check_date not in success_days:
            check_date -= timedelta(days=1)
            
        while check_date in success_days:
            streak += 1
            check_date -= timedelta(days=1)
            
        return TrendMetric(
            label="Habit Streak",
            value=float(streak),
            unit="days",
            insight=f"Habit streak is at {streak} days."
        )

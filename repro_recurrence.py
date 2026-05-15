from datetime import datetime, timezone, timedelta
from typing import List, Optional
from dataclasses import dataclass

@dataclass
class MockEvent:
    id: str
    title: str
    start_time: datetime
    end_time: datetime
    repeat_pattern: Optional[str]
    repeat_days: Optional[List[int]]
    is_conflict: bool = False
    goal_id: str = None

def ensure_utc(dt: datetime) -> datetime:
    if dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(timezone.utc)

def expand_recurring_events(events: List[MockEvent], days_ahead: int = 60) -> List[dict]:
    expanded = []
    now = datetime.now(timezone.utc)
    start_window = now - timedelta(days=30)
    end_window = now + timedelta(days=days_ahead)
    
    for e in events:
        base_start = ensure_utc(e.start_time)
        base_end = ensure_utc(e.end_time)
        
        if base_start < end_window and base_end > start_window:
            expanded.append({
                "id": e.id,
                "title": e.title,
                "start_time": base_start,
                "end_time": base_end,
                "repeat_pattern": e.repeat_pattern,
                "repeat_days": e.repeat_days,
            })
        
        if not e.repeat_pattern:
            continue
            
        current_start = base_start
        current_end = base_end
        
        # Jump logic
        if current_start < start_window:
            if e.repeat_pattern == 'Daily':
                diff = (start_window - current_start).days
                current_start += timedelta(days=diff)
                current_end += timedelta(days=diff)
            elif e.repeat_pattern == 'Weekly':
                diff_weeks = (start_window - current_start).days // 7
                current_start += timedelta(weeks=diff_weeks)
                current_end += timedelta(weeks=diff_weeks)

        while current_start < end_window:
            if e.repeat_pattern == 'Daily':
                current_start += timedelta(days=1)
                current_end += timedelta(days=1)
            elif e.repeat_pattern == 'Weekly':
                if e.repeat_days:
                    current_start += timedelta(days=1)
                    current_end += timedelta(days=1)
                    js_weekday = (current_start.weekday() + 1) % 7
                    # THE FIX: Ensure we compare against integers even if DB returned strings (unlikely but safe)
                    # And ensure e.repeat_days is treated as a list of ints.
                    if js_weekday not in [int(d) for d in e.repeat_days]:
                        continue
                else:
                    current_start += timedelta(weeks=1)
                    current_end += timedelta(weeks=1)
            else:
                break
                
            if current_start > end_window:
                break
            
            if current_start == base_start:
                continue

            expanded.append({
                "id": f"{e.id}_{current_start.timestamp()}",
                "title": e.title,
                "start_time": current_start,
                "end_time": current_end,
                "repeat_pattern": e.repeat_pattern,
                "repeat_days": e.repeat_days,
            })
            
    return expanded

# Test Case: Monday May 11 base event, recurring Mon (1) and Wed (3)
# Today is say Friday May 15
base = datetime(2026, 5, 11, 9, 0, tzinfo=timezone.utc) # Monday
event = MockEvent("1", "Test Event", base, base + timedelta(hours=1), "Weekly", [1, 3])

results = expand_recurring_events([event], days_ahead=14)
print(f"Total instances: {len(results)}")
for r in results:
    wd = (r['start_time'].weekday() + 1) % 7
    print(f"{r['start_time']} (WD: {wd})")

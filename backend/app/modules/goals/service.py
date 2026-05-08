from typing import List, Optional, Dict, Any
from pydantic import BaseModel
from app.core.results import Result
from app.core.broker import broker, BaseEvent

class Goal(BaseModel):
    id: str
    title: str
    target: float
    current: float
    unit: str  # 'cents', 'tasks', 'percentage'
    goal_type: str  # 'finance', 'task', 'manual'
    tier: str  # 'Yearly', 'Monthly', 'Weekly'
    is_focus: bool = False
    linked_id: Optional[str] = None

class GoalCreate(BaseModel):
    title: str
    target: float
    unit: str
    goal_type: str
    tier: str
    linked_id: Optional[str] = None

class GoalAdjust(BaseModel):
    current: float

class GoalsService:
    # In-memory store for mock
    _goals: List[Dict[str, Any]] = [
        {
            "id": "g-1",
            "title": "Emergency Fund",
            "target": 500000, # $5000 in cents
            "current": 125000,
            "unit": "cents",
            "goal_type": "finance",
            "tier": "Yearly",
            "is_focus": True,
            "linked_id": "acc-assets"
        },
        {
            "id": "g-2",
            "title": "Release v1.0",
            "target": 10,
            "current": 4,
            "unit": "tasks",
            "goal_type": "task",
            "tier": "Monthly",
            "is_focus": False,
            "linked_id": "proj-unstress"
        }
    ]

    @staticmethod
    async def get_goals() -> Result[List[dict], str]:
        return Result.ok(GoalsService._goals)

    @staticmethod
    async def create_goal(data: GoalCreate) -> Result[dict, str]:
        try:
            # Rule of Three Enforcement
            tier_goals = [g for g in GoalsService._goals if g["tier"] == data.tier]
            if len(tier_goals) >= 3:
                return Result.fail(f"The 'Rule of Three' applies: You already have 3 active {data.tier} goals.")

            new_goal = {
                "id": f"g-{len(GoalsService._goals) + 1}",
                "title": data.title,
                "target": data.target,
                "current": 0,
                "unit": data.unit,
                "goal_type": data.goal_type,
                "tier": data.tier,
                "is_focus": False,
                "linked_id": data.linked_id
            }
            GoalsService._goals.append(new_goal)
            return Result.ok(new_goal)
        except Exception as e:
            return Result.fail(str(e))

    @staticmethod
    async def set_focus(goal_id: str) -> Result[dict, str]:
        try:
            target_goal = None
            for goal in GoalsService._goals:
                if goal["id"] == goal_id:
                    goal["is_focus"] = True
                    target_goal = goal
                else:
                    goal["is_focus"] = False
            
            if target_goal:
                await broker.publish(BaseEvent(
                    event_type="GOAL_FOCUS_CHANGED",
                    payload={"goal_id": goal_id}
                ))
                return Result.ok(target_goal)
            return Result.fail("Goal not found")
        except Exception as e:
            return Result.fail(str(e))

    @staticmethod
    async def adjust_progress(goal_id: str, new_current: float) -> Result[dict, str]:
        try:
            for goal in GoalsService._goals:
                if goal["id"] == goal_id:
                    goal["current"] = new_current
                    # Publish event for real-time updates
                    await broker.publish(BaseEvent(
                        event_type="GOAL_PROGRESS_ADJUSTED",
                        payload={"goal_id": goal_id, "current": new_current}
                    ))
                    return Result.ok(goal)
            return Result.fail("Goal not found")
        except Exception as e:
            return Result.fail(str(e))

    @staticmethod
    async def increment_progress(goal_id: str, amount: float = 1.0) -> Result[dict, str]:
        try:
            for goal in GoalsService._goals:
                if goal["id"] == goal_id:
                    goal["current"] = min(goal["current"] + amount, goal["target"])
                    await broker.publish(BaseEvent(
                        event_type="GOAL_PROGRESS_ADJUSTED",
                        payload={"goal_id": goal_id, "current": goal["current"]}
                    ))
                    return Result.ok(goal)
            return Result.fail("Goal not found")
        except Exception as e:
            return Result.fail(str(e))

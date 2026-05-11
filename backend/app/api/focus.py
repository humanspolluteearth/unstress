from fastapi import APIRouter, HTTPException, Depends
from typing import List, Optional
from datetime import datetime, timezone
import uuid
import logging
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models import focus as models
from app.schemas import focus as schemas

logger = logging.getLogger(__name__)

router = APIRouter()

# --- Endpoints ---

@router.post("/log", response_model=schemas.FocusSession)
@router.post("/log/", response_model=schemas.FocusSession)
async def log_focus_session(data: schemas.FocusSessionCreate, db: Session = Depends(get_db)):
    """Saves a completed focus session in the database."""
    try:
        new_session = models.FocusSession(
            id=str(uuid.uuid4()),
            duration_minutes=data.duration_minutes,
            mode=data.mode,
            date=data.date
        )
        db.add(new_session)
        db.commit()
        db.refresh(new_session)
        return new_session
    except Exception as e:
        db.rollback()
        logger.error(f"Error logging focus session: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/stats", response_model=schemas.FocusStats)
@router.get("/stats/", response_model=schemas.FocusStats)
async def get_focus_stats(db: Session = Depends(get_db)):
    """Returns aggregated focus statistics from the database."""
    try:
        sessions = db.query(models.FocusSession).all()
        total_mins = sum(s.duration_minutes for s in sessions)
        return schemas.FocusStats(
            total_minutes=total_mins,
            total_hours=round(total_mins / 60, 2),
            session_count=len(sessions)
        )
    except Exception as e:
        logger.error(f"Error fetching focus stats: {e}")
        raise HTTPException(status_code=500, detail=str(e))

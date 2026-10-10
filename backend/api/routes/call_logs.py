from fastapi import APIRouter

from backend.db.database import SessionLocal
from backend.db.models import CallLog

router = APIRouter()


@router.get("/call-logs")
def get_call_logs():

    db = SessionLocal()

    logs = db.query(CallLog).all()

    result = []

    for log in logs:
        result.append({
            "id": log.id,
            "lead_id": log.lead_id,
            "worker": log.worker,
            "status": log.status,
            "ai_response": log.ai_response
        })

    db.close()

    return result
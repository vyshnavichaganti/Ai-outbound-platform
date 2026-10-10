from backend.db.database import SessionLocal
from backend.db.models import CallLog


def save_call_log(lead_id, worker, status, ai_response):

    db = SessionLocal()

    log = CallLog(
        lead_id=lead_id,
        worker=worker,
        status=status,
        ai_response=ai_response
    )

    db.add(log)
    db.commit()
    db.refresh(log)

    db.close()

    return log
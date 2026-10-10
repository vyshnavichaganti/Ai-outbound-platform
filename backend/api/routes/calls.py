import logging
from datetime import datetime
from typing import Optional, List
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import or_, desc

from backend.services.twilio_service import TwilioService
from backend.services.counselor_service import counselor_service
from backend.db.database import SessionLocal
from backend.db.models import Lead, CallLog, DNCContact

router = APIRouter(prefix="", tags=["calls"])
logger = logging.getLogger(__name__)


class InitiateCallRequest(BaseModel):
    lead_id: Optional[int] = None
    phone_number: Optional[str] = None
    student_name: Optional[str] = None
    campaign_id: Optional[int] = None


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def format_call_dict(log: CallLog) -> dict:
    return {
        "id": log.id,
        "session_id": log.session_id or f"sess-{log.id}",
        "call_sid": log.session_id or f"sess-{log.id}",
        "lead_id": log.lead_id,
        "campaign_id": log.campaign_id,
        "student_name": log.student_name or "Student Candidate",
        "phone": log.phone or "+919876543210",
        "course_recommended": log.course_recommended or "Data Science & AI",
        "worker": log.worker or "Priya AI Counselor",
        "status": log.status or "completed",
        "summary": log.summary or "Call log entry recorded.",
        "transcript": log.transcript or "",
        "ai_response": log.ai_response or "",
        "intent": log.intent or "Medium",
        "sentiment": log.sentiment or "Neutral",
        "key_topics": log.key_topics or "Career Guidance",
        "objections": log.objections or "None",
        "next_action": log.next_action or "Follow-up",
        "duration": log.duration or 0,
        "start_time": log.start_time.strftime("%Y-%m-%d %H:%M:%S") if log.start_time else "",
        "end_time": log.end_time.strftime("%Y-%m-%d %H:%M:%S") if log.end_time else "",
        "created_at": log.created_at.strftime("%Y-%m-%d %H:%M:%S") if log.created_at else ""
    }


@router.post("/calls/initiate")
@router.post("/call/{lead_id}")
def initiate_call(
    req: Optional[InitiateCallRequest] = None,
    lead_id: Optional[int] = None,
    db: Session = Depends(get_db)
):
    target_lead_id = lead_id or (req.lead_id if req else None)
    target_phone = req.phone_number if req else None
    student_name = req.student_name if req else None
    campaign_id = req.campaign_id if req else None

    lead = None
    if target_lead_id:
        lead = db.query(Lead).filter(Lead.id == target_lead_id).first()

    if lead:
        target_phone = target_phone or getattr(lead, "phone", None) or "+919876543210"
        student_name = student_name or lead.student_name
        campaign_id = campaign_id or lead.campaign_id

        # Enforce DNC Protection
        if getattr(lead, "is_dnc", False) or lead.lead_status == "DNC":
            raise HTTPException(
                status_code=400,
                detail=f"DNC PROTECTED: Student candidate {student_name} has opted out of calls."
            )
    elif not target_phone:
        target_phone = "+919876543210"
        student_name = student_name or "Student Candidate"

    # Enforce DNC Table Lookup
    dnc_check = db.query(DNCContact).filter(DNCContact.phone == target_phone).first()
    if dnc_check:
        raise HTTPException(
            status_code=400,
            detail=f"DNC PROTECTED: Phone number {target_phone} is listed on the Do Not Call register."
        )

    twilio = TwilioService()
    call_sid = None
    call_status = "initiating"

    try:
        if twilio.is_configured():
            try:
                call_res = twilio.initiate_outbound_call(target_phone)
                call_sid = call_res.get("call_sid")
                call_status = call_res.get("status", "initiated")
                logger.info(f"Twilio Call Initiated: SID={call_sid} to {target_phone}")
            except Exception as twilio_err:
                logger.warning(f"Twilio API call initiation failed: {twilio_err}")
                raise HTTPException(
                    status_code=400,
                    detail=f"Twilio Outbound Error: {str(twilio_err)}"
                )
        else:
            logger.warning("Twilio credentials not configured. Generating active call session entry.")
            call_sid = f"SIM-{target_lead_id or '101'}"
            call_status = "ringing"

        # Save initial CallLog
        call_log = CallLog(
            session_id=call_sid,
            lead_id=lead.id if lead else target_lead_id,
            campaign_id=campaign_id,
            phone=target_phone,
            student_name=student_name,
            course_recommended=lead.interest if lead else "Data Science & AI",
            worker="Priya AI Counselor",
            status=call_status,
            summary="Outbound call session initiated.",
            start_time=datetime.utcnow(),
            created_at=datetime.utcnow()
        )
        db.add(call_log)
        db.commit()
        db.refresh(call_log)

        return {
            "status": call_status,
            "call_sid": call_sid,
            "call_id": call_log.id,
            "lead_id": lead.id if lead else target_lead_id,
            "campaign_id": campaign_id,
            "student_name": student_name,
            "phone": target_phone,
            "twilio_configured": twilio.is_configured(),
            "message": "Twilio Outbound call initiated successfully" if twilio.is_configured() else "Call session created."
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Call initiation failed: {e}")
        raise HTTPException(status_code=500, detail=f"Call initiation failed: {str(e)}")



@router.get("/call-logs")
@router.get("/calls")
def get_call_history(
    status: Optional[str] = None,
    lead_id: Optional[int] = None,
    campaign_id: Optional[int] = None,
    db: Session = Depends(get_db)
):
    query = db.query(CallLog)

    if status and status.lower() != "all":
        query = query.filter(CallLog.status.ilike(f"%{status}%"))
    if lead_id is not None:
        query = query.filter(CallLog.lead_id == lead_id)
    if campaign_id is not None:
        query = query.filter(CallLog.campaign_id == campaign_id)

    logs = query.order_by(desc(CallLog.id)).all()
    return [format_call_dict(log) for log in logs]


@router.get("/calls/active")
def get_active_calls(db: Session = Depends(get_db)):
    active_statuses = ["initiating", "queued", "ringing", "in-progress", "in_progress"]
    logs = db.query(CallLog).filter(CallLog.status.in_(active_statuses)).all()
    return [format_call_dict(log) for log in logs]


@router.get("/calls/{call_id}")
def get_call_by_id(call_id: str, db: Session = Depends(get_db)):
    # Match by numeric id or string session_id/call_sid
    log = None
    if call_id.isdigit():
        log = db.query(CallLog).filter(CallLog.id == int(call_id)).first()
    if not log:
        log = db.query(CallLog).filter(CallLog.session_id == call_id).first()

    if not log:
        raise HTTPException(status_code=404, detail="Call record not found")

    return format_call_dict(log)


@router.get("/calls/status/{call_sid}")
def get_call_status(call_sid: str, db: Session = Depends(get_db)):
    log = db.query(CallLog).filter(CallLog.session_id == call_sid).first()
    if not log:
        return {"call_sid": call_sid, "status": "in-progress"}
    return {
        "call_sid": call_sid,
        "status": log.status,
        "student_name": log.student_name,
        "summary": log.summary,
        "transcript": log.transcript,
        "ai_response": log.ai_response,
        "duration": log.duration
    }


@router.post("/calls/{call_id}/process-intelligence")
def process_conversation_intelligence(call_id: int, db: Session = Depends(get_db)):
    log = db.query(CallLog).filter(CallLog.id == call_id).first()
    if not log:
        raise HTTPException(status_code=404, detail="Call log not found")

    if not log.transcript:
        return {"message": "No transcript available to process", "log": format_call_dict(log)}

    analysis = counselor_service.analyze_transcript(log.transcript, log.student_name)
    log.summary = analysis.get("summary", log.summary)
    log.intent = analysis.get("intent", "Medium")
    log.sentiment = analysis.get("sentiment", "Neutral")
    log.key_topics = analysis.get("key_topics", "")
    log.objections = analysis.get("objections", "")
    log.next_action = analysis.get("next_action", "")

    # Also update corresponding Lead's call_summary
    if log.lead_id:
        lead = db.query(Lead).filter(Lead.id == log.lead_id).first()
        if lead:
            lead.call_summary = log.summary
            if log.intent == "High":
                lead.lead_status = "Qualified"
            elif log.intent == "Medium" and lead.lead_status == "New":
                lead.lead_status = "Contacted"

    db.commit()
    db.refresh(log)
    return {"message": "Conversation intelligence processed successfully", "intelligence": analysis, "log": format_call_dict(log)}
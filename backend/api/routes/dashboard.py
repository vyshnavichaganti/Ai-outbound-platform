import os
import io
import csv
import logging
from datetime import datetime
from typing import Optional
from fastapi import APIRouter, HTTPException, Depends, Response
from sqlalchemy.orm import Session
from sqlalchemy import func, desc, or_

from backend.db.database import SessionLocal, engine
from backend.db.models import Lead, CallLog, CampaignModel, FollowUp, DNCContact, AIAgent, KnowledgeDocument
from backend.services.twilio_service import TwilioService
from backend.voice.elevenlabs_service import ElevenLabsService

router = APIRouter(prefix="", tags=["dashboard"])
logger = logging.getLogger(__name__)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.get("/dashboard")
def dashboard(db: Session = Depends(get_db)):
    return {
        "campaigns": db.query(CampaignModel).count(),
        "leads": db.query(Lead).count(),
        "calls": db.query(CallLog).count(),
        "follow_ups": db.query(FollowUp).count()
    }


@router.get("/dashboard/stats")
def dashboard_stats(db: Session = Depends(get_db)):
    total_leads = db.query(Lead).count()
    call_logs = db.query(CallLog).all()
    total_calls = len(call_logs)
    connected_calls = len([c for c in call_logs if c.status in ["completed", "connected", "in_progress", "in-progress"]])
    in_progress_calls = len([c for c in call_logs if c.status in ["in_progress", "in-progress", "ringing"]])
    completed_calls = len([c for c in call_logs if c.status == "completed"])
    failed_calls = len([c for c in call_logs if c.status in ["failed", "no-answer", "busy", "canceled"]])

    qualified_leads = db.query(Lead).filter(or_(Lead.lead_status == "Qualified", Lead.lead_status == "Converted")).count()
    interested_leads = db.query(Lead).filter(Lead.lead_status.ilike("%interest%")).count()
    workshop_registrations = db.query(Lead).filter(Lead.workshop_registered == True).count()

    total_duration = sum([c.duration or 0 for c in call_logs])
    avg_duration_sec = round(total_duration / total_calls) if total_calls > 0 else 0

    return {
        "total_leads": total_leads,
        "today_calls": total_calls,
        "connected_calls": connected_calls,
        "in_progress_calls": in_progress_calls,
        "completed_calls": completed_calls,
        "failed_calls": failed_calls,
        "qualified_leads": qualified_leads,
        "interested_leads": interested_leads,
        "workshop_registrations": workshop_registrations,
        "ai_handled_calls": total_calls,
        "avg_call_duration_seconds": avg_duration_sec,
        "avg_call_duration": f"{avg_duration_sec // 60}m {avg_duration_sec % 60}s" if total_calls > 0 else "0m 0s"
    }


# ---------------------------------------------------------------------------
# Phase 11 — Analytics (Real DB Data)
# ---------------------------------------------------------------------------

@router.get("/analytics")
def get_analytics_data(db: Session = Depends(get_db)):
    total_leads = db.query(Lead).count()
    call_logs = db.query(CallLog).all()
    total_calls = len(call_logs)
    completed_calls = len([c for c in call_logs if c.status == "completed"])
    interested_leads = db.query(Lead).filter(or_(Lead.lead_status == "Interested", Lead.lead_status == "Qualified", Lead.lead_status == "Converted")).count()
    followups_count = db.query(FollowUp).count()

    conversion_rate = round((interested_leads / total_leads * 100), 1) if total_leads > 0 else 0.0
    total_duration = sum([c.duration or 0 for c in call_logs])
    avg_duration_sec = round(total_duration / total_calls) if total_calls > 0 else 0
    avg_duration_str = f"{avg_duration_sec // 60}m {avg_duration_sec % 60}s"

    # Outcome breakdown
    outcomes = {
        "completed": completed_calls,
        "in_progress": len([c for c in call_logs if c.status in ["in-progress", "in_progress", "ringing", "initiating"]]),
        "busy": len([c for c in call_logs if c.status == "busy"]),
        "no_answer": len([c for c in call_logs if c.status == "no-answer"]),
        "failed": len([c for c in call_logs if c.status == "failed"]),
        "canceled": len([c for c in call_logs if c.status == "canceled"])
    }

    # Lead status distribution
    lead_statuses = {
        "New": db.query(Lead).filter(Lead.lead_status == "New").count(),
        "Contacted": db.query(Lead).filter(Lead.lead_status == "Contacted").count(),
        "Interested": db.query(Lead).filter(Lead.lead_status == "Interested").count(),
        "Qualified": db.query(Lead).filter(Lead.lead_status == "Qualified").count(),
        "Converted": db.query(Lead).filter(Lead.lead_status == "Converted").count(),
        "DNC": db.query(Lead).filter(or_(Lead.lead_status == "DNC", Lead.is_dnc == True)).count()
    }

    # Calls over time (grouped by date)
    date_counts = {}
    for c in call_logs:
        date_str = c.created_at.strftime("%Y-%m-%d") if c.created_at else "Today"
        date_counts[date_str] = date_counts.get(date_str, 0) + 1

    calls_over_time = [{"date": k, "calls": v} for k, v in sorted(date_counts.items())]

    # Campaign performance
    campaigns = db.query(CampaignModel).all()
    campaign_perf = []
    for camp in campaigns:
        camp_calls = db.query(CallLog).filter(CallLog.campaign_id == camp.id).count()
        camp_qualified = db.query(CallLog).filter(CallLog.campaign_id == camp.id, CallLog.intent == "High").count()
        campaign_perf.append({
            "name": camp.name,
            "total_contacts": camp.total_contacts,
            "calls_made": camp_calls,
            "qualified": camp_qualified
        })

    return {
        "metrics": {
            "total_leads": total_leads,
            "total_calls": total_calls,
            "completed_calls": completed_calls,
            "interested_leads": interested_leads,
            "followups_scheduled": followups_count,
            "conversion_rate": conversion_rate,
            "avg_duration_seconds": avg_duration_sec,
            "avg_duration": avg_duration_str
        },
        "outcomes": outcomes,
        "lead_statuses": lead_statuses,
        "calls_over_time": calls_over_time,
        "campaign_performance": campaign_perf
    }


# ---------------------------------------------------------------------------
# Phase 12 — Reports & CSV Export
# ---------------------------------------------------------------------------

@router.get("/reports/leads")
def get_lead_report(db: Session = Depends(get_db)):
    leads = db.query(Lead).order_by(desc(Lead.id)).all()
    return [{
        "id": l.id,
        "student_name": l.student_name,
        "phone": l.phone,
        "email": l.email,
        "degree": l.degree,
        "interest": l.interest,
        "lead_status": l.lead_status,
        "is_dnc": bool(l.is_dnc),
        "created_at": l.created_at.strftime("%Y-%m-%d %H:%M") if l.created_at else ""
    } for l in leads]


@router.get("/reports/calls")
def get_call_report(db: Session = Depends(get_db)):
    calls = db.query(CallLog).order_by(desc(CallLog.id)).all()
    return [{
        "id": c.id,
        "call_sid": c.session_id,
        "student_name": c.student_name,
        "phone": c.phone,
        "status": c.status,
        "duration": c.duration or 0,
        "intent": c.intent or "Medium",
        "summary": c.summary or "",
        "created_at": c.created_at.strftime("%Y-%m-%d %H:%M") if c.created_at else ""
    } for c in calls]


@router.get("/reports/campaigns")
def get_campaign_report(db: Session = Depends(get_db)):
    camps = db.query(CampaignModel).order_by(desc(CampaignModel.id)).all()
    return [{
        "id": c.id,
        "name": c.name,
        "course_interest": c.course_interest,
        "status": c.status,
        "total_contacts": c.total_contacts,
        "created_at": c.created_at.strftime("%Y-%m-%d %H:%M") if c.created_at else ""
    } for c in camps]


@router.get("/reports/follow-ups")
def get_followup_report(db: Session = Depends(get_db)):
    followups = db.query(FollowUp).order_by(desc(FollowUp.id)).all()
    return [{
        "id": f.id,
        "student_name": f.student_name,
        "reason": f.reason,
        "due_date": f.due_date,
        "due_time": f.due_time,
        "status": f.status,
        "created_at": f.created_at.strftime("%Y-%m-%d %H:%M") if f.created_at else ""
    } for f in followups]


@router.get("/reports/{report_type}/export")
def export_report_csv(report_type: str, db: Session = Depends(get_db)):
    output = io.StringIO()
    writer = csv.writer(output)

    if report_type == "leads":
        writer.writerow(["ID", "Student Name", "Phone", "Email", "Degree", "Branch", "Interest", "Status", "DNC Opt-Out"])
        leads = db.query(Lead).all()
        for l in leads:
            writer.writerow([l.id, l.student_name, l.phone, l.email, l.degree, l.branch, l.interest, l.lead_status, "YES" if l.is_dnc else "NO"])
    elif report_type == "calls":
        writer.writerow(["ID", "Call SID", "Student Name", "Phone", "Status", "Duration (s)", "Intent", "Summary"])
        calls = db.query(CallLog).all()
        for c in calls:
            writer.writerow([c.id, c.session_id, c.student_name, c.phone, c.status, c.duration or 0, c.intent or "", c.summary or ""])
    elif report_type == "campaigns":
        writer.writerow(["ID", "Campaign Name", "Course Target", "Status", "Total Contacts", "Created At"])
        camps = db.query(CampaignModel).all()
        for c in camps:
            writer.writerow([c.id, c.name, c.course_interest, c.status, c.total_contacts, c.created_at])
    elif report_type == "follow-ups":
        writer.writerow(["ID", "Student Name", "Reason", "Due Date", "Due Time", "Status"])
        fus = db.query(FollowUp).all()
        for f in fus:
            writer.writerow([f.id, f.student_name, f.reason, f.due_date, f.due_time, f.status])
    else:
        raise HTTPException(status_code=400, detail="Invalid report type.")

    response = Response(content=output.getvalue(), media_type="text/csv")
    response.headers["Content-Disposition"] = f"attachment; filename={report_type}_report.csv"
    return response


# ---------------------------------------------------------------------------
# Phase 13 — Settings & Security Info (Secrets Never Exposed!)
# ---------------------------------------------------------------------------

@router.get("/system/status")
@router.get("/settings/info")
def get_settings_info(db: Session = Depends(get_db)):
    twilio = TwilioService()
    elevenlabs = ElevenLabsService()

    gemini_configured = bool(os.getenv("GEMINI_API_KEY"))
    elevenlabs_configured = elevenlabs.is_configured()

    db_driver = engine.name
    total_leads = db.query(Lead).count()
    total_calls = db.query(CallLog).count()
    total_dnc = db.query(DNCContact).count()

    raw_phone = os.getenv("TWILIO_PHONE_NUMBER", "")
    masked_phone = raw_phone[:4] + "*****" + raw_phone[-3:] if len(raw_phone) > 6 else ("Configured" if raw_phone else "Not Configured")

    return {
        "backend_status": "Online",
        "backend_version": "v1.0.0-production",
        "database_type": db_driver.upper(),
        "database_status": "Connected",
        "database_records": {
            "leads": total_leads,
            "calls": total_calls,
            "dnc_contacts": total_dnc
        },
        "twilio": {
            "status": "Connected" if twilio.is_configured() else "Not Configured",
            "phone_number": masked_phone
        },
        "gemini_ai": {
            "status": "Connected" if gemini_configured else "Not Configured",
            "model": "Gemini 2.5 Flash"
        },
        "elevenlabs": {
            "status": "Connected" if elevenlabs_configured else "Not Configured",
            "voice": "Priya (English-IN)"
        }
    }
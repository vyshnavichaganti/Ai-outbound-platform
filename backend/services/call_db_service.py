from datetime import datetime
from typing import Optional

from backend.db.database import SessionLocal
from backend.db.models import Lead, CallLog


def get_lead(session_id: str):
    db = SessionLocal()
    try:
        return db.query(Lead).filter(Lead.session_id == session_id).first()
    finally:
        db.close()


def update_lead(
    session_id: str,
    student_name: Optional[str] = None,
    degree: Optional[str] = None,
    year: Optional[str] = None,
    branch: Optional[str] = None,
    career_goal: Optional[str] = None,
    interest: Optional[str] = None,
    budget: Optional[str] = None,
    mode: Optional[str] = None,
    language: Optional[str] = None,
    lead_status: Optional[str] = None,
    callback_date: Optional[str] = None,
    callback_time: Optional[str] = None,
    workshop_registered: Optional[bool] = None,
    call_summary: Optional[str] = None,
):
    db = SessionLocal()
    try:
        lead = db.query(Lead).filter(Lead.session_id == session_id).first()
        if lead is None:
            lead = Lead(session_id=session_id or "default-session")
            db.add(lead)

        if student_name is not None and student_name != "":
            lead.student_name = student_name
        if degree is not None and degree != "":
            lead.degree = degree
        if year is not None and year != "":
            lead.year = year
        if branch is not None and branch != "":
            lead.branch = branch
        if career_goal is not None and career_goal != "":
            lead.career_goal = career_goal
        if interest is not None and interest != "":
            lead.interest = interest
        if budget is not None and budget != "":
            lead.budget = budget
        if mode is not None and mode != "":
            lead.mode = mode
        if language is not None and language != "":
            lead.language = language
        if lead_status is not None and lead_status != "":
            lead.lead_status = lead_status
        if callback_date is not None and callback_date != "":
            lead.callback_date = callback_date
        if callback_time is not None and callback_time != "":
            lead.callback_time = callback_time
        if workshop_registered is not None:
            lead.workshop_registered = workshop_registered
        if call_summary is not None and call_summary != "":
            lead.call_summary = call_summary

        lead.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(lead)
        return lead
    finally:
        db.close()


def save_lead(
    student_name="",
    degree="",
    year="",
    branch="",
    interest="",
    budget="",
    mode="",
    lead_status="Interested",
    callback_time="",
    session_id="default-session",
    language="english",
):
    return update_lead(
        session_id=session_id,
        student_name=student_name,
        degree=degree,
        year=year,
        branch=branch,
        interest=interest,
        budget=budget,
        mode=mode,
        lead_status=lead_status,
        callback_time=callback_time,
        language=language,
    )


def save_call_summary(
    student_name="",
    course_recommended="",
    workshop_registered="No",
    summary="",
    transcript="",
    session_id="default-session",
    language="english",
    lead_status="No Response",
    callback_time="",
    worker="",
    status="completed",
    ai_response="",
):
    db = SessionLocal()
    try:
        lead = db.query(Lead).filter(Lead.session_id == session_id).first()
        if lead is None:
            lead = Lead(session_id=session_id or "default-session")
            db.add(lead)

        if student_name != "":
            lead.student_name = student_name
        if language != "":
            lead.language = language
        if lead_status != "":
            lead.lead_status = lead_status
        if callback_time != "":
            lead.callback_time = callback_time
        if workshop_registered not in (None, ""):
            lead.workshop_registered = str(workshop_registered).lower() in {"yes", "true", "1", "y"}
        if summary != "":
            lead.call_summary = summary

        log = CallLog(
            session_id=session_id or "default-session",
            lead_id=lead.id,
            student_name=student_name or lead.student_name,
            course_recommended=course_recommended,
            workshop_registered=str(workshop_registered or "No"),
            summary=summary,
            transcript=transcript,
            language=language,
            lead_status=lead_status,
            callback_time=callback_time,
            worker=worker,
            status=status,
            ai_response=ai_response,
        )
        db.add(log)
        db.commit()
        db.refresh(log)
        return log
    finally:
        db.close()
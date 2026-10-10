import io
import csv
import re
import uuid
import logging
from datetime import datetime
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, HTTPException, Depends, UploadFile, File, Response, Query
from pydantic import BaseModel, validator
from sqlalchemy.orm import Session
from sqlalchemy import or_, desc, asc

from backend.db.database import SessionLocal
from backend.db.models import Lead, CallLog, DNCContact, FollowUp, CampaignModel

router = APIRouter(prefix="", tags=["leads"])
logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Phone & Header Normalization Helpers
# ---------------------------------------------------------------------------

HEADER_ALIASES = {
    "student_name": ["student_name", "student name", "name", "full_name", "fullname", "student", "candidate_name", "candidate"],
    "phone": ["phone", "phone_number", "phone number", "mobile", "mobile_number", "mobile number", "contact", "contact_number", "contact number", "cell", "phone_no", "phoneno"],
    "email": ["email", "email_address", "email address", "mail"],
    "degree": ["degree", "qualification", "course", "education"],
    "year": ["year", "study_year", "study year", "academic_year", "academic year"],
    "branch": ["branch", "department", "specialization", "stream"],
    "career_goal": ["career_goal", "career goal", "goal", "career"],
    "interest": ["interest", "interests", "area_of_interest", "area of interest", "target_course", "course_interest"],
    "language": ["language", "preferred_language", "preferred language"]
}

def normalize_header_key(raw_header: str) -> str:
    if not raw_header:
        return ""
    cleaned = raw_header.strip().lower().replace("-", "_").replace(" ", "_")
    for standard_key, aliases in HEADER_ALIASES.items():
        if cleaned in [a.replace(" ", "_") for a in aliases]:
            return standard_key
    return cleaned


def normalize_phone_number(raw_phone: Any) -> Optional[str]:
    """
    Normalizes Indian & international phone numbers.
    8919663581 -> +918919663581
    919876543210 -> +919876543210
    +919876543210 -> +919876543210
    09876543210 -> +919876543210
    """
    if raw_phone is None:
        return None
    s = str(raw_phone).strip()
    if not s:
        return None

    # Remove hyphens, spaces, brackets, dots
    cleaned = re.sub(r"[\s\-\(\)\.]", "", s)

    if cleaned.startswith("+91"):
        digits = cleaned[3:]
        if len(digits) == 10 and digits.isdigit():
            return f"+91{digits}"
    elif cleaned.startswith("91") and len(cleaned) == 12 and cleaned.isdigit():
        digits = cleaned[2:]
        return f"+91{digits}"
    elif cleaned.startswith("0") and len(cleaned) == 11 and cleaned.isdigit():
        digits = cleaned[1:]
        return f"+91{digits}"
    elif len(cleaned) == 10 and cleaned.isdigit():
        return f"+91{cleaned}"
    elif cleaned.startswith("+") and 8 <= len(cleaned[1:]) <= 15 and cleaned[1:].isdigit():
        return cleaned

    return None


# ---------------------------------------------------------------------------
# Pydantic Schemas & Validation
# ---------------------------------------------------------------------------

class LeadCreateSchema(BaseModel):
    student_name: str
    phone: Optional[str] = ""
    email: Optional[str] = ""
    degree: Optional[str] = "B.Tech"
    year: Optional[str] = "3rd Year"
    branch: Optional[str] = "CSE"
    career_goal: Optional[str] = "Software Engineer"
    interest: Optional[str] = "Data Science & AI"
    budget: Optional[str] = "₹30,000"
    mode: Optional[str] = "Online Live"
    language: Optional[str] = "english"
    lead_status: Optional[str] = "New"
    campaign_id: Optional[int] = None
    notes: Optional[str] = ""


class LeadUpdateSchema(BaseModel):
    student_name: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    degree: Optional[str] = None
    year: Optional[str] = None
    branch: Optional[str] = None
    career_goal: Optional[str] = None
    interest: Optional[str] = None
    budget: Optional[str] = None
    mode: Optional[str] = None
    language: Optional[str] = None
    lead_status: Optional[str] = None
    is_dnc: Optional[bool] = None
    campaign_id: Optional[int] = None
    callback_date: Optional[str] = None
    callback_time: Optional[str] = None
    workshop_registered: Optional[bool] = None
    call_summary: Optional[str] = None
    notes: Optional[str] = None


class BulkImportRequest(BaseModel):
    leads: List[LeadCreateSchema]


class FollowUpSchema(BaseModel):
    lead_id: int
    student_name: str
    reason: str
    notes: Optional[str] = ""
    due_date: str
    due_time: Optional[str] = "10:00 AM"


# ---------------------------------------------------------------------------
# DB Dependency & Helper Functions
# ---------------------------------------------------------------------------

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def calculate_lead_score(lead: Lead) -> int:
    score = 40
    if lead.student_name and lead.student_name != "Anonymous Student":
        score += 10
    if lead.phone:
        score += 10
    if lead.email:
        score += 10
    if lead.degree and lead.degree != "Unspecified":
        score += 10
    if lead.interest and lead.interest != "General Inquiry":
        score += 10
    if lead.career_goal:
        score += 5

    status = (lead.lead_status or "").lower()
    if status == "interested":
        score += 10
    elif status == "qualified":
        score += 15
    elif status in ["workshop registered", "converted"]:
        score += 20
    elif status == "dnc":
        score = 0

    return min(100, max(0, score))


def format_lead_dict(l: Lead) -> dict:
    score = calculate_lead_score(l)
    return {
        "id": l.id,
        "session_id": l.session_id or f"lead-{l.id}",
        "student_name": l.student_name or "Anonymous Student",
        "phone": l.phone or "",
        "email": l.email or "",
        "degree": l.degree or "B.Tech",
        "year": l.year or "3rd Year",
        "branch": l.branch or "CSE",
        "career_goal": l.career_goal or "Software Engineer",
        "interest": l.interest or "Data Science & AI",
        "budget": l.budget or "₹30,000",
        "mode": l.mode or "Online Live",
        "language": l.language or "english",
        "lead_status": l.lead_status or "New",
        "is_dnc": bool(l.is_dnc),
        "campaign_id": l.campaign_id,
        "lead_score": score,
        "score_label": "High" if score >= 80 else "Medium" if score >= 60 else "Low",
        "callback_date": l.callback_date or "",
        "callback_time": l.callback_time or "",
        "workshop_registered": bool(l.workshop_registered),
        "call_summary": l.call_summary or "",
        "notes": l.notes or "",
        "created_at": l.created_at.strftime("%Y-%m-%d %H:%M") if l.created_at else "",
        "updated_at": l.updated_at.strftime("%Y-%m-%d %H:%M") if l.updated_at else ""
    }


# ---------------------------------------------------------------------------
# Core Import Engine (Phases 3 - 7)
# ---------------------------------------------------------------------------

def process_lead_import_items(raw_items: List[Dict[str, Any]], db: Session) -> Dict[str, Any]:
    logger.info(f"[CSV IMPORT] Starting processing for {len(raw_items)} raw items")
    print(f"[CSV IMPORT] Processing {len(raw_items)} raw items")

    imported_count = 0
    duplicates_count = 0
    invalid_count = 0
    errors = []
    seen_in_batch = set()

    for idx, raw_row in enumerate(raw_items, start=1):
        # Normalize dict keys using header aliases
        normalized_row = {}
        for k, v in raw_row.items():
            norm_k = normalize_header_key(k)
            normalized_row[norm_k] = v

        name = str(normalized_row.get("student_name") or "").strip()
        raw_phone = normalized_row.get("phone")
        email = str(normalized_row.get("email") or "").strip()

        logger.info(f"[CSV IMPORT] Mapped row #{idx}: name='{name}', raw_phone='{raw_phone}'")
        print(f"[CSV IMPORT] Mapped row #{idx}: name='{name}', raw_phone='{raw_phone}'")

        if not name:
            invalid_count += 1
            err_msg = f"Row #{idx}: missing required field 'student_name'"
            errors.append(err_msg)
            logger.warning(f"[CSV IMPORT] Invalid row #{idx}: {err_msg}")
            continue

        normalized_phone = normalize_phone_number(raw_phone)
        if not normalized_phone:
            invalid_count += 1
            err_msg = f"Row #{idx} ({name}): missing or invalid phone number '{raw_phone}'"
            errors.append(err_msg)
            logger.warning(f"[CSV IMPORT] Invalid row #{idx}: {err_msg}")
            continue

        # Check duplicate within this batch
        if normalized_phone in seen_in_batch:
            duplicates_count += 1
            logger.info(f"[CSV IMPORT] Duplicate row #{idx} ({name}): phone '{normalized_phone}' already in batch")
            continue
        seen_in_batch.add(normalized_phone)

        # Check duplicate in real database
        existing_lead = db.query(Lead).filter(Lead.phone == normalized_phone).first()
        if existing_lead:
            duplicates_count += 1
            logger.info(f"[CSV IMPORT] Duplicate row #{idx} ({name}): phone '{normalized_phone}' exists in DB (ID: {existing_lead.id})")
            continue

        # Check DNC table
        is_dnc = False
        lead_status = normalized_row.get("lead_status") or "New"
        dnc_check = db.query(DNCContact).filter(DNCContact.phone == normalized_phone).first()
        if dnc_check:
            is_dnc = True
            lead_status = "DNC"

        try:
            new_lead = Lead(
                session_id=f"import-{uuid.uuid4().hex[:8]}",
                student_name=name,
                phone=normalized_phone,
                email=email,
                degree=str(normalized_row.get("degree") or "B.Tech").strip(),
                year=str(normalized_row.get("year") or "3rd Year").strip(),
                branch=str(normalized_row.get("branch") or "CSE").strip(),
                career_goal=str(normalized_row.get("career_goal") or "Software Engineer").strip(),
                interest=str(normalized_row.get("interest") or "Data Science & AI").strip(),
                budget=str(normalized_row.get("budget") or "₹30,000").strip(),
                mode=str(normalized_row.get("mode") or "Online Live").strip(),
                language=str(normalized_row.get("language") or "english").strip(),
                lead_status=lead_status,
                is_dnc=is_dnc,
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow()
            )
            db.add(new_lead)
            imported_count += 1
            logger.info(f"[CSV IMPORT] Lead created for {name} ({normalized_phone})")
        except Exception as e:
            invalid_count += 1
            err_msg = f"Row #{idx} ({name}): DB Insertion Error - {str(e)}"
            errors.append(err_msg)
            logger.error(f"[CSV IMPORT] {err_msg}")

    try:
        db.commit()
        logger.info(f"[CSV IMPORT] DB commit successful. Imported: {imported_count}")
        print(f"[CSV IMPORT] DB commit successful. Imported: {imported_count}")
    except Exception as commit_err:
        db.rollback()
        logger.error(f"[CSV IMPORT] DB commit failed: {commit_err}")
        return {
            "success": False,
            "imported": 0,
            "duplicates": duplicates_count,
            "invalid": len(raw_items),
            "total_rows": len(raw_items),
            "errors": [f"Database commit error: {str(commit_err)}"],
            "message": f"Database commit failed: {str(commit_err)}"
        }

    success = imported_count > 0 or (len(raw_items) > 0 and invalid_count == 0)
    msg = f"Successfully imported {imported_count} leads ({duplicates_count} duplicates skipped, {invalid_count} invalid)."
    if imported_count == 0 and len(raw_items) > 0:
        msg = f"Import completed: 0 leads imported ({duplicates_count} duplicates skipped, {invalid_count} invalid)."

    return {
        "success": success,
        "imported": imported_count,
        "duplicates": duplicates_count,
        "invalid": invalid_count,
        "total_rows": len(raw_items),
        "errors": errors,
        "message": msg
    }


# ---------------------------------------------------------------------------
# Leads Routes
# ---------------------------------------------------------------------------

@router.get("/leads")
def get_leads(
    search: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    campaign_id: Optional[int] = Query(None),
    interest: Optional[str] = Query(None),
    sort_by: Optional[str] = Query("created_at"),
    order: Optional[str] = Query("desc"),
    db: Session = Depends(get_db)
):
    query = db.query(Lead)

    if status and status.lower() != "all":
        if status.upper() == "DNC":
            query = query.filter(or_(Lead.lead_status.ilike("DNC"), Lead.is_dnc == True))
        else:
            query = query.filter(Lead.lead_status.ilike(f"%{status}%"))

    if campaign_id is not None:
        query = query.filter(Lead.campaign_id == campaign_id)

    if interest and interest.lower() != "all":
        query = query.filter(Lead.interest.ilike(f"%{interest}%"))

    if search:
        s = f"%{search.strip()}%"
        query = query.filter(
            or_(
                Lead.student_name.ilike(s),
                Lead.phone.ilike(s),
                Lead.email.ilike(s),
                Lead.degree.ilike(s),
                Lead.branch.ilike(s),
                Lead.interest.ilike(s)
            )
        )

    sort_column = getattr(Lead, sort_by, Lead.created_at)
    if order and order.lower() == "asc":
        query = query.order_by(asc(sort_column))
    else:
        query = query.order_by(desc(sort_column))

    leads = query.all()
    return [format_lead_dict(l) for l in leads]


@router.get("/leads/export-csv")
def export_leads_csv(db: Session = Depends(get_db)):
    leads = db.query(Lead).order_by(desc(Lead.id)).all()
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "ID", "Student Name", "Phone", "Email", "Degree", "Year", "Branch",
        "Career Goal", "Course Interest", "Budget", "Mode", "Language",
        "Lead Status", "DNC Opt-Out", "Lead Score", "Created At"
    ])
    for l in leads:
        writer.writerow([
            l.id,
            l.student_name,
            l.phone,
            l.email,
            l.degree,
            l.year,
            l.branch,
            l.career_goal,
            l.interest,
            l.budget,
            l.mode,
            l.language,
            l.lead_status,
            "YES" if l.is_dnc else "NO",
            calculate_lead_score(l),
            l.created_at.strftime("%Y-%m-%d %H:%M") if l.created_at else ""
        ])

    response = Response(content=output.getvalue(), media_type="text/csv")
    response.headers["Content-Disposition"] = "attachment; filename=leads_export.csv"
    return response


@router.get("/leads/{lead_id}")
def get_lead_by_id(lead_id: int, db: Session = Depends(get_db)):
    lead = db.query(Lead).filter(Lead.id == lead_id).first()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")

    call_logs = db.query(CallLog).filter(CallLog.lead_id == lead_id).order_by(desc(CallLog.id)).all()
    follow_ups = db.query(FollowUp).filter(FollowUp.lead_id == lead_id).order_by(desc(FollowUp.id)).all()

    logs_data = []
    for cl in call_logs:
        logs_data.append({
            "id": cl.id,
            "session_id": cl.session_id,
            "worker": cl.worker or "Priya AI",
            "status": cl.status or "completed",
            "course_recommended": cl.course_recommended or lead.interest or "Data Science & AI",
            "summary": cl.summary or "Call record created.",
            "transcript": cl.transcript or "",
            "intent": cl.intent or "",
            "sentiment": cl.sentiment or "",
            "key_topics": cl.key_topics or "",
            "objections": cl.objections or "",
            "next_action": cl.next_action or "",
            "duration": cl.duration or 0,
            "created_at": cl.created_at.strftime("%Y-%m-%d %H:%M") if cl.created_at else ""
        })

    followups_data = []
    for fu in follow_ups:
        followups_data.append({
            "id": fu.id,
            "reason": fu.reason,
            "notes": fu.notes or "",
            "due_date": fu.due_date,
            "due_time": fu.due_time,
            "assigned_agent": fu.assigned_agent,
            "status": fu.status,
            "created_at": fu.created_at.strftime("%Y-%m-%d %H:%M") if fu.created_at else ""
        })

    campaign_info = None
    if lead.campaign_id:
        camp = db.query(CampaignModel).filter(CampaignModel.id == lead.campaign_id).first()
        if camp:
            campaign_info = {"id": camp.id, "name": camp.name, "status": camp.status}

    res = format_lead_dict(lead)
    res["call_logs"] = logs_data
    res["follow_ups"] = followups_data
    res["campaign"] = campaign_info
    return res


@router.post("/leads")
def create_lead(req: LeadCreateSchema, db: Session = Depends(get_db)):
    norm_phone = normalize_phone_number(req.phone) or req.phone or ""

    if norm_phone:
        dnc_check = db.query(DNCContact).filter(DNCContact.phone == norm_phone).first()
        if dnc_check:
            req.lead_status = "DNC"

    new_lead = Lead(
        session_id=f"lead-{uuid.uuid4().hex[:8]}",
        student_name=req.student_name.strip(),
        phone=norm_phone,
        email=req.email or "",
        degree=req.degree or "B.Tech",
        year=req.year or "3rd Year",
        branch=req.branch or "CSE",
        career_goal=req.career_goal or "Software Engineer",
        interest=req.interest or "Data Science & AI",
        budget=req.budget or "₹30,000",
        mode=req.mode or "Online Live",
        language=req.language or "english",
        lead_status=req.lead_status or "New",
        is_dnc=True if req.lead_status == "DNC" else False,
        campaign_id=req.campaign_id,
        notes=req.notes or "",
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )
    db.add(new_lead)
    db.commit()
    db.refresh(new_lead)
    return {"message": "Lead created successfully", "lead": format_lead_dict(new_lead)}


@router.put("/leads/{lead_id}")
def update_lead(lead_id: int, req: LeadUpdateSchema, db: Session = Depends(get_db)):
    lead = db.query(Lead).filter(Lead.id == lead_id).first()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")

    update_data = req.dict(exclude_unset=True)

    for field in ["id", "created_at", "session_id"]:
        update_data.pop(field, None)

    if "phone" in update_data and update_data["phone"]:
        update_data["phone"] = normalize_phone_number(update_data["phone"]) or update_data["phone"]

    for key, val in update_data.items():
        if val is not None:
            setattr(lead, key, val)

    lead.updated_at = datetime.utcnow()

    if lead.is_dnc or lead.lead_status == "DNC":
        lead.is_dnc = True
        lead.lead_status = "DNC"
        if lead.phone:
            existing_dnc = db.query(DNCContact).filter(DNCContact.phone == lead.phone).first()
            if not existing_dnc:
                db.add(DNCContact(phone=lead.phone, reason="Opted out via CRM update"))

    db.commit()
    db.refresh(lead)
    return {"message": "Lead updated successfully", "lead": format_lead_dict(lead)}


@router.delete("/leads/{lead_id}")
def delete_lead(lead_id: int, db: Session = Depends(get_db)):
    lead = db.query(Lead).filter(Lead.id == lead_id).first()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")

    student_name = lead.student_name
    db.delete(lead)
    db.commit()
    return {"message": f"Lead '{student_name}' deleted successfully", "id": lead_id}


@router.post("/leads/{lead_id}/dnc")
def mark_lead_dnc(lead_id: int, db: Session = Depends(get_db)):
    lead = db.query(Lead).filter(Lead.id == lead_id).first()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")

    lead.lead_status = "DNC"
    lead.is_dnc = True
    lead.updated_at = datetime.utcnow()

    if lead.phone:
        existing_dnc = db.query(DNCContact).filter(DNCContact.phone == lead.phone).first()
        if not existing_dnc:
            db.add(DNCContact(phone=lead.phone, reason="Opted out via CRM"))

    db.commit()
    return {"message": f"Lead {lead.student_name} marked as DNC (Do Not Call)."}


@router.post("/leads/{lead_id}/undnc")
def unmark_lead_dnc(lead_id: int, db: Session = Depends(get_db)):
    lead = db.query(Lead).filter(Lead.id == lead_id).first()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")

    lead.lead_status = "New"
    lead.is_dnc = False
    lead.updated_at = datetime.utcnow()

    if lead.phone:
        dnc_entry = db.query(DNCContact).filter(DNCContact.phone == lead.phone).first()
        if dnc_entry:
            db.delete(dnc_entry)

    db.commit()
    return {"message": f"Lead {lead.student_name} un-marked from DNC status."}


# ---------------------------------------------------------------------------
# Import Endpoints (Disambiguated JSON vs Multipart File)
# ---------------------------------------------------------------------------

@router.post("/leads/import-bulk")
def import_bulk_leads(req: BulkImportRequest, db: Session = Depends(get_db)):
    logger.info(f"[CSV IMPORT] Bulk JSON import called with {len(req.leads)} items")
    print(f"[CSV IMPORT] Bulk JSON import called with {len(req.leads)} items")
    items = [item.dict() for item in req.leads]
    return process_lead_import_items(items, db)


@router.post("/leads/import-csv")
async def import_csv_file(file: UploadFile = File(...), db: Session = Depends(get_db)):
    logger.info(f"[CSV IMPORT] File import called: filename={file.filename}, content_type={file.content_type}")
    print(f"[CSV IMPORT] File import called: filename={file.filename}, content_type={file.content_type}")

    content = await file.read()
    text_content = content.decode("utf-8-sig", errors="ignore")
    lines = [line for line in text_content.splitlines() if line.strip()]

    if not lines:
        return {
            "success": False,
            "imported": 0,
            "duplicates": 0,
            "invalid": 0,
            "total_rows": 0,
            "errors": ["Uploaded CSV file is empty."],
            "message": "Uploaded CSV file is empty."
        }

    csv_reader = csv.DictReader(lines)
    raw_items = list(csv_reader)
    logger.info(f"[CSV IMPORT] Parsed {len(raw_items)} CSV rows from file '{file.filename}'")

    return process_lead_import_items(raw_items, db)


# ---------------------------------------------------------------------------
# Follow-Up Routes
# ---------------------------------------------------------------------------

@router.get("/follow-ups")
def get_follow_ups(
    status: Optional[str] = Query(None),
    lead_id: Optional[int] = Query(None),
    db: Session = Depends(get_db)
):
    query = db.query(FollowUp)
    if status and status.lower() != "all":
        query = query.filter(FollowUp.status.ilike(f"%{status}%"))
    if lead_id is not None:
        query = query.filter(FollowUp.lead_id == lead_id)

    followups = query.order_by(desc(FollowUp.id)).all()
    today_str = datetime.utcnow().strftime("%Y-%m-%d")

    result = []
    for f in followups:
        current_status = f.status
        if current_status == "Upcoming" and f.due_date and f.due_date < today_str:
            current_status = "Overdue"

        lead = db.query(Lead).filter(Lead.id == f.lead_id).first()

        result.append({
            "id": f.id,
            "lead_id": f.lead_id,
            "student_name": f.student_name or (lead.student_name if lead else "Student"),
            "phone": lead.phone if lead else "",
            "reason": f.reason or "Career guidance follow-up",
            "notes": f.notes or "",
            "due_date": f.due_date or today_str,
            "due_time": f.due_time or "10:00 AM",
            "assigned_agent": f.assigned_agent or "Priya AI",
            "status": current_status,
            "created_at": f.created_at.strftime("%Y-%m-%d %H:%M") if f.created_at else ""
        })
    return result


@router.post("/follow-ups")
def create_follow_up(req: FollowUpSchema, db: Session = Depends(get_db)):
    lead = db.query(Lead).filter(Lead.id == req.lead_id).first()
    student_name = req.student_name or (lead.student_name if lead else "Student")

    fu = FollowUp(
        lead_id=req.lead_id,
        student_name=student_name,
        reason=req.reason,
        notes=req.notes or "",
        due_date=req.due_date,
        due_time=req.due_time or "10:00 AM",
        assigned_agent="Priya AI",
        status="Upcoming",
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )
    db.add(fu)
    db.commit()
    db.refresh(fu)
    return {"message": f"Follow-up scheduled for {student_name} on {fu.due_date}", "id": fu.id}


@router.put("/follow-ups/{followup_id}")
def update_follow_up(followup_id: int, reason: Optional[str] = None, due_date: Optional[str] = None, due_time: Optional[str] = None, notes: Optional[str] = None, status: Optional[str] = None, db: Session = Depends(get_db)):
    fu = db.query(FollowUp).filter(FollowUp.id == followup_id).first()
    if not fu:
        raise HTTPException(status_code=404, detail="Follow-up not found")

    if reason: fu.reason = reason
    if due_date: fu.due_date = due_date
    if due_time: fu.due_time = due_time
    if notes is not None: fu.notes = notes
    if status: fu.status = status

    fu.updated_at = datetime.utcnow()
    db.commit()
    return {"message": "Follow-up updated successfully"}


@router.post("/follow-ups/{followup_id}/complete")
def complete_follow_up(followup_id: int, db: Session = Depends(get_db)):
    fu = db.query(FollowUp).filter(FollowUp.id == followup_id).first()
    if not fu:
        raise HTTPException(status_code=404, detail="Follow-up not found")

    fu.status = "Completed"
    fu.updated_at = datetime.utcnow()
    db.commit()
    return {"message": f"Follow-up with {fu.student_name} marked as Completed."}


@router.post("/follow-ups/{followup_id}/cancel")
def cancel_follow_up(followup_id: int, db: Session = Depends(get_db)):
    fu = db.query(FollowUp).filter(FollowUp.id == followup_id).first()
    if not fu:
        raise HTTPException(status_code=404, detail="Follow-up not found")

    fu.status = "Canceled"
    fu.updated_at = datetime.utcnow()
    db.commit()
    return {"message": f"Follow-up with {fu.student_name} canceled."}


@router.delete("/follow-ups/{followup_id}")
def delete_follow_up(followup_id: int, db: Session = Depends(get_db)):
    fu = db.query(FollowUp).filter(FollowUp.id == followup_id).first()
    if not fu:
        raise HTTPException(status_code=404, detail="Follow-up not found")

    db.delete(fu)
    db.commit()
    return {"message": "Follow-up deleted successfully"}

import logging
from datetime import datetime
from typing import Optional, List
from fastapi import APIRouter, HTTPException, Depends, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import or_, desc, func

from backend.db.database import SessionLocal
from backend.db.models import CampaignModel, Lead, CallLog, CallQueueItem, DNCContact
from backend.services.twilio_service import TwilioService

router = APIRouter(prefix="", tags=["campaigns"])
logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Pydantic Schemas
# ---------------------------------------------------------------------------

class CampaignCreateSchema(BaseModel):
    name: str
    description: Optional[str] = ""
    target_audience: Optional[str] = "B.Tech Students"
    course_interest: Optional[str] = "Data Science & AI"
    agent_id: Optional[str] = "priya"
    language: Optional[str] = "english"
    status: Optional[str] = "Draft"
    selected_lead_ids: Optional[List[int]] = None


class CampaignUpdateSchema(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    target_audience: Optional[str] = None
    course_interest: Optional[str] = None
    agent_id: Optional[str] = None
    language: Optional[str] = None
    status: Optional[str] = None


class QueueAddSchema(BaseModel):
    lead_id: int
    campaign_id: Optional[int] = None


# ---------------------------------------------------------------------------
# DB Dependency & Helper Functions
# ---------------------------------------------------------------------------

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def compute_campaign_metrics(camp: CampaignModel, db: Session) -> dict:
    # Query assigned leads
    leads_query = db.query(Lead).filter(Lead.campaign_id == camp.id)
    total_leads = leads_query.count()

    # If 0 leads explicitly tagged with campaign_id, check course match
    if total_leads == 0 and camp.course_interest:
        total_leads = db.query(Lead).filter(Lead.interest.ilike(f"%{camp.course_interest}%")).count()

    # Query call logs for campaign
    calls = db.query(CallLog).filter(
        or_(CallLog.campaign_id == camp.id, CallLog.course_recommended.ilike(f"%{camp.course_interest}%"))
    ).all()

    calls_made = len(calls)
    completed = len([c for c in calls if c.status == "completed"])
    connected = len([c for c in calls if c.status in ["completed", "in-progress", "in_progress"]])
    qualified = len([c for c in calls if c.intent == "High" or c.lead_status == "Qualified"])
    not_interested = len([c for c in calls if c.lead_status == "Not Interested" or c.intent == "Low"])
    failed = len([c for c in calls if c.status in ["failed", "no-answer", "busy", "canceled"]])

    return {
        "id": camp.id,
        "name": camp.name,
        "description": camp.description or "",
        "target_audience": camp.target_audience or "General Students",
        "course_interest": camp.course_interest or "Data Science & AI",
        "agent_id": camp.agent_id or "priya",
        "language": camp.language or "english",
        "status": camp.status or "Draft",
        "total_contacts": total_leads,
        "total_leads": total_leads,
        "calls_made": calls_made,
        "completed": completed,
        "connected": connected,
        "qualified": qualified,
        "not_interested": not_interested,
        "failed": failed,
        "remaining": max(0, total_leads - calls_made),
        "created_at": camp.created_at.strftime("%Y-%m-%d %H:%M") if camp.created_at else "",
        "updated_at": camp.updated_at.strftime("%Y-%m-%d %H:%M") if camp.updated_at else ""
    }


# ---------------------------------------------------------------------------
# Campaign CRUD Routes
# ---------------------------------------------------------------------------

@router.get("/campaigns")
def get_campaigns(db: Session = Depends(get_db)):
    camps = db.query(CampaignModel).order_by(desc(CampaignModel.id)).all()
    return [compute_campaign_metrics(c, db) for c in camps]


@router.get("/campaigns/{campaign_id}")
def get_campaign_by_id(campaign_id: int, db: Session = Depends(get_db)):
    camp = db.query(CampaignModel).filter(CampaignModel.id == campaign_id).first()
    if not camp:
        raise HTTPException(status_code=404, detail="Campaign not found")

    metrics = compute_campaign_metrics(camp, db)
    # Fetch list of assigned leads
    leads = db.query(Lead).filter(
        or_(Lead.campaign_id == campaign_id, Lead.interest.ilike(f"%{camp.course_interest}%"))
    ).all()

    lead_list = []
    for l in leads:
        lead_list.append({
            "id": l.id,
            "student_name": l.student_name,
            "phone": l.phone,
            "interest": l.interest,
            "lead_status": l.lead_status,
            "is_dnc": bool(l.is_dnc)
        })

    metrics["leads"] = lead_list
    return metrics


@router.post("/campaigns")
def create_campaign(req: CampaignCreateSchema, db: Session = Depends(get_db)):
    camp = CampaignModel(
        name=req.name.strip(),
        description=req.description or "",
        target_audience=req.target_audience or "B.Tech Students",
        course_interest=req.course_interest or "Data Science & AI",
        agent_id=req.agent_id or "priya",
        language=req.language or "english",
        status=req.status or "Draft",
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )
    db.add(camp)
    db.commit()
    db.refresh(camp)

    # Attach selected leads if provided
    if req.selected_lead_ids:
        db.query(Lead).filter(Lead.id.in_(req.selected_lead_ids)).update(
            {Lead.campaign_id: camp.id}, synchronize_session=False
        )
        db.commit()

    return {"message": "Campaign created successfully", "campaign": compute_campaign_metrics(camp, db)}


@router.put("/campaigns/{campaign_id}")
def update_campaign(campaign_id: int, req: CampaignUpdateSchema, db: Session = Depends(get_db)):
    camp = db.query(CampaignModel).filter(CampaignModel.id == campaign_id).first()
    if not camp:
        raise HTTPException(status_code=404, detail="Campaign not found")

    for key, val in req.dict(exclude_unset=True).items():
        if val is not None:
            setattr(camp, key, val)

    camp.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(camp)
    return {"message": "Campaign updated successfully", "campaign": compute_campaign_metrics(camp, db)}


@router.delete("/campaigns/{campaign_id}")
def delete_campaign(campaign_id: int, db: Session = Depends(get_db)):
    camp = db.query(CampaignModel).filter(CampaignModel.id == campaign_id).first()
    if not camp:
        raise HTTPException(status_code=404, detail="Campaign not found")

    name = camp.name
    db.delete(camp)
    db.commit()
    return {"message": f"Campaign '{name}' deleted successfully", "id": campaign_id}


@router.post("/campaigns/{campaign_id}/start")
@router.post("/campaigns/{campaign_id}/launch")
def launch_campaign(campaign_id: int, db: Session = Depends(get_db)):
    camp = db.query(CampaignModel).filter(CampaignModel.id == campaign_id).first()
    if not camp:
        raise HTTPException(status_code=404, detail="Campaign not found")

    camp.status = "Running"
    camp.updated_at = datetime.utcnow()

    # Populate call_queue with non-DNC leads for this campaign
    leads = db.query(Lead).filter(
        or_(Lead.campaign_id == campaign_id, Lead.interest.ilike(f"%{camp.course_interest}%")),
        Lead.is_dnc == False,
        Lead.lead_status != "DNC"
    ).all()

    added_to_queue = 0
    for idx, l in enumerate(leads):
        # Check if already in queue
        existing_q = db.query(CallQueueItem).filter(
            CallQueueItem.lead_id == l.id,
            CallQueueItem.campaign_id == campaign_id
        ).first()
        if not existing_q:
            q_item = CallQueueItem(
                campaign_id=campaign_id,
                lead_id=l.id,
                student_name=l.student_name,
                phone=l.phone,
                status="pending",
                position=idx + 1,
                created_at=datetime.utcnow()
            )
            db.add(q_item)
            added_to_queue += 1

    db.commit()
    return {
        "message": f"Campaign '{camp.name}' launched! {added_to_queue} leads added to call queue.",
        "status": "Running",
        "queued_leads": added_to_queue
    }


@router.post("/campaigns/{campaign_id}/pause")
def pause_campaign(campaign_id: int, db: Session = Depends(get_db)):
    camp = db.query(CampaignModel).filter(CampaignModel.id == campaign_id).first()
    if not camp:
        raise HTTPException(status_code=404, detail="Campaign not found")

    camp.status = "Paused"
    camp.updated_at = datetime.utcnow()
    db.commit()
    return {"message": f"Campaign '{camp.name}' paused", "status": "Paused"}


@router.post("/campaigns/{campaign_id}/resume")
def resume_campaign(campaign_id: int, db: Session = Depends(get_db)):
    camp = db.query(CampaignModel).filter(CampaignModel.id == campaign_id).first()
    if not camp:
        raise HTTPException(status_code=404, detail="Campaign not found")

    camp.status = "Running"
    camp.updated_at = datetime.utcnow()
    db.commit()
    return {"message": f"Campaign '{camp.name}' resumed", "status": "Running"}


# ---------------------------------------------------------------------------
# Call Queue Routes
# ---------------------------------------------------------------------------

@router.get("/queue")
def get_call_queue(db: Session = Depends(get_db)):
    # Join with Lead to ensure DNC leads are protected and excluded
    queue_items = db.query(CallQueueItem).order_by(CallQueueItem.position.asc()).all()
    result = []
    for item in queue_items:
        lead = db.query(Lead).filter(Lead.id == item.lead_id).first()
        is_dnc = bool(lead.is_dnc) if lead else False
        if lead and (lead.lead_status == "DNC" or is_dnc):
            item.status = "skipped"
            is_dnc = True

        result.append({
            "id": item.id,
            "campaign_id": item.campaign_id,
            "lead_id": item.lead_id,
            "student_name": item.student_name or (lead.student_name if lead else "Student"),
            "phone": item.phone or (lead.phone if lead else ""),
            "course": lead.interest if lead else "Data Science & AI",
            "status": item.status,
            "position": item.position,
            "is_dnc": is_dnc,
            "created_at": item.created_at.strftime("%Y-%m-%d %H:%M") if item.created_at else ""
        })
    return result


@router.post("/queue/add")
def add_to_queue(req: QueueAddSchema, db: Session = Depends(get_db)):
    lead = db.query(Lead).filter(Lead.id == req.lead_id).first()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")

    if getattr(lead, "is_dnc", False) or lead.lead_status == "DNC":
        raise HTTPException(status_code=400, detail="Cannot queue DNC lead (Do Not Call Listed).")

    dnc_check = db.query(DNCContact).filter(DNCContact.phone == lead.phone).first()
    if dnc_check:
        raise HTTPException(status_code=400, detail="Cannot queue DNC phone number.")

    max_pos = db.query(func.max(CallQueueItem.position)).scalar() or 0
    q_item = CallQueueItem(
        campaign_id=req.campaign_id,
        lead_id=lead.id,
        student_name=lead.student_name,
        phone=lead.phone,
        status="pending",
        position=max_pos + 1,
        created_at=datetime.utcnow()
    )
    db.add(q_item)
    db.commit()
    db.refresh(q_item)
    return {"message": f"Added {lead.student_name} to call queue at position {q_item.position}", "id": q_item.id}


@router.delete("/queue/{queue_id}")
def remove_from_queue(queue_id: int, db: Session = Depends(get_db)):
    item = db.query(CallQueueItem).filter(CallQueueItem.id == queue_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Queue item not found")

    student_name = item.student_name
    db.delete(item)
    db.commit()
    return {"message": f"Removed {student_name} from call queue", "id": queue_id}


@router.post("/queue/{queue_id}/retry")
def retry_queue_item(queue_id: int, db: Session = Depends(get_db)):
    item = db.query(CallQueueItem).filter(CallQueueItem.id == queue_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Queue item not found")

    lead = db.query(Lead).filter(Lead.id == item.lead_id).first()
    if lead and (lead.is_dnc or lead.lead_status == "DNC"):
        raise HTTPException(status_code=400, detail="Cannot retry calling DNC lead.")

    item.status = "pending"
    item.retry_count += 1
    db.commit()
    return {"message": f"Reset queue item for {item.student_name} to pending retry."}


@router.post("/queue/next")
def call_next_queued(db: Session = Depends(get_db)):
    # Find first pending non-DNC queue item
    pending_items = db.query(CallQueueItem).filter(CallQueueItem.status == "pending").order_by(CallQueueItem.position.asc()).all()

    for item in pending_items:
        lead = db.query(Lead).filter(Lead.id == item.lead_id).first()
        if lead and (lead.is_dnc or lead.lead_status == "DNC"):
            item.status = "skipped"
            db.commit()
            continue

        dnc_check = db.query(DNCContact).filter(DNCContact.phone == item.phone).first()
        if dnc_check:
            item.status = "skipped"
            db.commit()
            continue

        # Trigger outbound call for valid lead
        twilio = TwilioService()
        call_sid = None
        status = "initiating"
        try:
            if twilio.is_configured():
                res = twilio.initiate_outbound_call(item.phone)
                call_sid = res.get("call_sid")
                status = res.get("status", "initiated")
            else:
                call_sid = f"SIM-Q{item.id}"
                status = "ringing"

            item.status = "in-progress"

            # Create CallLog
            log = CallLog(
                session_id=call_sid,
                lead_id=item.lead_id,
                campaign_id=item.campaign_id,
                phone=item.phone,
                student_name=item.student_name,
                course_recommended=lead.interest if lead else "Data Science & AI",
                worker="Priya AI Counselor",
                status=status,
                summary="Queued call session launched.",
                start_time=datetime.utcnow()
            )
            db.add(log)
            db.commit()

            return {
                "message": f"Triggered call for {item.student_name}",
                "queue_id": item.id,
                "call_sid": call_sid,
                "status": status,
                "lead_id": item.lead_id
            }
        except Exception as e:
            item.status = "failed"
            db.commit()
            raise HTTPException(status_code=500, detail=f"Failed calling queue item: {str(e)}")

    return {"message": "No pending calls in queue", "queue_id": None}
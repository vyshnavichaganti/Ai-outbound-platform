from fastapi import APIRouter, HTTPException
from typing import Optional, List, Dict, Any
from pydantic import BaseModel
from backend.services.counselor_service import counselor_service
from backend.services.call_db_service import save_lead, save_call_summary

router = APIRouter(prefix="/counselor", tags=["counselor"])

class ChatRequest(BaseModel):
    message: str
    history: Optional[List[Dict[str, Any]]] = None

class QualifyRequest(BaseModel):
    student_name: Optional[str] = ""
    degree: Optional[str] = ""
    year: Optional[str] = ""
    branch: Optional[str] = ""
    interest: Optional[str] = ""
    budget: Optional[str] = ""
    mode: Optional[str] = ""

class WorkshopRegisterRequest(BaseModel):
    lead_id: Optional[int] = None
    student_name: str
    phone: str
    workshop_name: str

class SummaryRequest(BaseModel):
    transcript: str
    student_name: Optional[str] = "Student"

@router.get("/health")
def counselor_health():
    return {"status": "ok", "service": "AI Career Counselor", "model": "Gemini 2.5 Flash"}

@router.get("/courses")
def get_courses():
    try:
        courses = counselor_service.get_courses()
        return {"courses": courses}
    except Exception as e:
        # Fallback to direct json loading if not initialized
        import json
        from pathlib import Path
        p = Path(__file__).resolve().parent.parent.parent / "data" / "courses.json"
        if p.exists():
            with open(p, "r", encoding="utf-8") as f:
                data = json.load(f)
                return {"courses": data if isinstance(data, list) else data.get("courses", [])}
        return {"courses": []}

@router.get("/courses/{course_id}")
def get_course_detail(course_id: str):
    courses = get_courses().get("courses", [])
    for c in courses:
        if str(c.get("id", "")).lower() == course_id.lower() or c.get("name", "").lower() == course_id.lower():
            return c
    raise HTTPException(status_code=404, detail="Course not found")

@router.get("/faqs")
def get_faqs():
    try:
        return {"faqs": counselor_service.get_faqs()}
    except Exception:
        import json
        from pathlib import Path
        p = Path(__file__).resolve().parent.parent.parent / "data" / "faq.json"
        if p.exists():
            with open(p, "r", encoding="utf-8") as f:
                return json.load(f)
        return {"faqs": []}

@router.get("/workshops")
def get_workshops():
    try:
        return {"workshops": counselor_service.get_workshops()}
    except Exception:
        import json
        from pathlib import Path
        p = Path(__file__).resolve().parent.parent.parent / "data" / "workshops.json"
        if p.exists():
            with open(p, "r", encoding="utf-8") as f:
                data = json.load(f)
                return {"workshops": data.get("workshops", []) if isinstance(data, dict) else data}
        return {"workshops": []}

@router.get("/opening-message")
def get_opening_message():
    try:
        msg = counselor_service.get_opening_message()
    except Exception:
        msg = "Hello! I'm Priya, your personal AI career counselor. How can I assist with your career path today?"
    return {"message": msg, "counselor": "Priya"}

@router.post("/chat")
def counselor_chat(req: ChatRequest):
    try:
        reply = counselor_service.generate_counselor_response(req.message, req.history or [])
        return {"response": reply, "counselor": "Priya"}
    except Exception as e:
        return {
            "response": f"I'm happy to help you explore your career options! Could you tell me more about your interest in tech or your educational background?",
            "counselor": "Priya",
            "error": str(e)
        }

@router.post("/qualify")
def qualify_lead(req: QualifyRequest):
    # Simple qualification logic based on criteria
    score = 50
    if req.interest: score += 20
    if req.degree: score += 15
    if req.year: score += 10
    if req.budget: score += 5

    intent = "High" if score >= 80 else "Medium" if score >= 60 else "Low"
    recommended_course = req.interest or "Data Science & AI"

    return {
        "lead_score": score,
        "intent": intent,
        "recommended_course": recommended_course,
        "next_action": "Invite for Workshop" if score >= 70 else "Follow-up Call",
        "qualification_summary": f"Student with {req.degree or 'Degree'} interested in {recommended_course}. High intent for career growth."
    }

@router.post("/qualify/{lead_id}/save")
def save_qualification(lead_id: int, req: QualifyRequest):
    lead = save_lead(
        student_name=req.student_name or f"Student #{lead_id}",
        degree=req.degree or "",
        year=req.year or "",
        branch=req.branch or "",
        interest=req.interest or "",
        budget=req.budget or "",
        mode=req.mode or "",
        lead_status="Qualified",
        session_id=f"session-{lead_id}"
    )
    return {"message": "Qualification saved", "lead_id": lead.id}

@router.post("/workshops/register")
def register_workshop(req: WorkshopRegisterRequest):
    save_lead(
        student_name=req.student_name,
        interest=req.workshop_name,
        workshop_registered=True,
        lead_status="Registered",
        session_id=f"ws-{req.phone}"
    )
    return {
        "message": f"Successfully registered {req.student_name} for {req.workshop_name}",
        "status": "Confirmed"
    }

@router.get("/workshops/registrations/{lead_id}")
def get_workshop_registrations(lead_id: int):
    return {
        "lead_id": lead_id,
        "registrations": [
            {
                "workshop_name": "AI & Machine Learning Career Workshop",
                "date": "2026-06-20",
                "time": "7:00 PM",
                "status": "Confirmed"
            }
        ]
    }

@router.post("/summary")
def generate_summary(req: SummaryRequest):
    summary_text = f"Student {req.student_name} discussed career trajectory and requested course options."
    return {
        "summary": summary_text,
        "key_points": [
            "Expressed interest in upgrading skills",
            "Discussed placement support and batch timings",
            "Recommended Data Science & AI program"
        ],
        "recommended_course": "Data Science",
        "next_action": "Send Workshop Details"
    }

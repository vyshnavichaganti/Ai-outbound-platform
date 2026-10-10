# backend/livekit/function_tools.py

from typing import Optional

try:
    from livekit.agents import function_tool
except ImportError:  # pragma: no cover - fallback for environments without LiveKit installed
    def function_tool(fn=None, *args, **kwargs):
        if fn is None:
            return lambda wrapped: wrapped
        return fn

from backend.services.call_db_service import get_lead, update_lead, save_call_summary as save_call_summary_db

_ACTIVE_SESSION_ID: Optional[str] = None
_TRANSCRIPT: list[str] = []


def set_active_session(session_id: str):
    global _ACTIVE_SESSION_ID
    _ACTIVE_SESSION_ID = session_id or "default-session"


def clear_active_session():
    global _ACTIVE_SESSION_ID, _TRANSCRIPT
    _ACTIVE_SESSION_ID = None
    _TRANSCRIPT = []


def get_active_session_id() -> str:
    return _ACTIVE_SESSION_ID or "default-session"


def _normalize_language(language: Optional[str]) -> str:
    if not language:
        return "english"

    normalized = language.strip().lower()
    if normalized in {"en", "english"}:
        return "english"
    if normalized in {"te", "telugu"}:
        return "telugu"
    if normalized in {"hi", "hindi", "hin"}:
        return "hindi"
    return "english"


def _append_transcript(role: str, text: Optional[str]) -> None:
    if not text:
        return
    _TRANSCRIPT.append(f"{role}: {text}")


@function_tool
async def update_student_profile(
    name: Optional[str] = None,
    degree: Optional[str] = None,
    year: Optional[str] = None,
    branch: Optional[str] = None,
    interest: Optional[str] = None,
    career_goal: Optional[str] = None,
    budget: Optional[str] = None,
    mode: Optional[str] = None,
    language: Optional[str] = None,
    lead_status: Optional[str] = None,
    callback_date: Optional[str] = None,
    callback_time: Optional[str] = None,
    call_summary: Optional[str] = None,
    session_id: Optional[str] = None,
    transcript: Optional[str] = None,
):
    resolved_session_id = session_id or get_active_session_id()
    normalized_language = _normalize_language(language)
    lead = update_lead(
        session_id=resolved_session_id,
        student_name=name,
        degree=degree,
        year=year,
        branch=branch,
        interest=interest,
        career_goal=career_goal,
        budget=budget,
        mode=mode,
        language=normalized_language,
        lead_status=lead_status,
        callback_date=callback_date,
        callback_time=callback_time,
        call_summary=call_summary,
    )

    if transcript:
        _append_transcript("student", transcript)

    return f"Student profile updated for {lead.student_name or 'the student'} in session {resolved_session_id}."


@function_tool
async def recommend_course(interest: str, session_id: Optional[str] = None):
    resolved_session_id = session_id or get_active_session_id()
    update_lead(session_id=resolved_session_id, interest=interest)
    interest_text = (interest or "").lower()

    if "ai" in interest_text or "machine learning" in interest_text:
        return "AI & Machine Learning Course"
    if "python" in interest_text:
        return "Python Fundamentals Course"
    if "software" in interest_text or "full stack" in interest_text:
        return "Full Stack Development Course"
    if "data science" in interest_text:
        return "Data Science Course"
    if "prompt" in interest_text:
        return "Prompt Engineering Course"
    return "Career Foundation Program"


@function_tool
async def book_workshop(student_name: str, session_id: Optional[str] = None):
    resolved_session_id = session_id or get_active_session_id()
    update_lead(
        session_id=resolved_session_id,
        workshop_registered=True,
        lead_status="Workshop Registered",
    )
    return f"Workshop registration completed for {student_name}."


@function_tool
async def schedule_callback(date: str, time: str, session_id: Optional[str] = None):
    resolved_session_id = session_id or get_active_session_id()
    update_lead(
        session_id=resolved_session_id,
        callback_date=date,
        callback_time=time,
        lead_status="Callback Requested",
    )
    return f"Callback scheduled on {date} at {time}."


@function_tool
async def update_language(language: str, session_id: Optional[str] = None):
    resolved_session_id = session_id or get_active_session_id()
    normalized_language = _normalize_language(language)
    update_lead(session_id=resolved_session_id, language=normalized_language)
    return f"Language updated to {normalized_language}."


@function_tool
async def save_call_summary(
    summary: str,
    transcript: Optional[str] = None,
    session_id: Optional[str] = None,
    language: Optional[str] = None,
    lead_status: Optional[str] = None,
    callback_time: Optional[str] = None,
    workshop_registered: Optional[str] = None,
):
    resolved_session_id = session_id or get_active_session_id()
    normalized_language = _normalize_language(language)

    if transcript:
        _append_transcript("assistant", transcript)

    save_call_summary_db(
        student_name="",
        course_recommended="",
        workshop_registered=workshop_registered or "No",
        summary=summary,
        transcript="\n".join(_TRANSCRIPT),
        session_id=resolved_session_id,
        language=normalized_language,
        lead_status=lead_status or "No Response",
        callback_time=callback_time or "",
        worker="livekit-agent",
        status="completed",
        ai_response=summary,
    )
    return "Call summary saved successfully."


@function_tool
async def update_lead_status(status: str, session_id: Optional[str] = None):
    resolved_session_id = session_id or get_active_session_id()
    allowed_status = [
        "Interested",
        "Not Interested",
        "Callback Requested",
        "Workshop Registered",
        "No Response",
    ]

    if status in allowed_status:
        update_lead(session_id=resolved_session_id, lead_status=status)
        return f"Lead status updated to {status}."

    return "Invalid lead status."


@function_tool
async def show_profile(session_id: Optional[str] = None):
    resolved_session_id = session_id or get_active_session_id()
    lead = get_lead(resolved_session_id)
    if lead is None:
        return "No profile found."
    return str({
        "session_id": lead.session_id,
        "student_name": lead.student_name,
        "degree": lead.degree,
        "year": lead.year,
        "branch": lead.branch,
        "interest": lead.interest,
        "career_goal": lead.career_goal,
        "budget": lead.budget,
        "mode": lead.mode,
        "language": lead.language,
        "lead_status": lead.lead_status,
        "callback_date": lead.callback_date,
        "callback_time": lead.callback_time,
        "workshop_registered": bool(lead.workshop_registered),
        "call_summary": lead.call_summary,
    })


@function_tool
async def end_call(session_id: Optional[str] = None, final_summary: Optional[str] = None):
    resolved_session_id = session_id or get_active_session_id()
    if final_summary:
        save_call_summary_db(
            summary=final_summary,
            transcript="\n".join(_TRANSCRIPT),
            session_id=resolved_session_id,
            worker="livekit-agent",
            status="completed",
            ai_response=final_summary,
        )
    return "Goodbye. Thank you for choosing AI Academy."
"""
backend/api/routes/voice_router.py

Twilio Voice Router for the AI Career Counseling Platform.
Handles inbound/outbound calls, speech gathering, Gemini AI response generation, ElevenLabs TTS, and TwiML stream flow.
"""

import logging
import time
import uuid
from pathlib import Path
from typing import Optional
from fastapi import APIRouter, Form, HTTPException, Request, Depends
from fastapi.responses import FileResponse, Response
from twilio.twiml.voice_response import VoiceResponse, Gather

from backend.services.conversation_manager import ConversationManager, ConversationState
from backend.services.counselor_service import CounselorService   # Gemini-backed
from backend.voice.elevenlabs_service import ElevenLabsService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/voice", tags=["voice"])

AUDIO_DIR = Path(__file__).resolve().parent.parent.parent / "voice" / "generated_audio"
AUDIO_DIR.mkdir(parents=True, exist_ok=True)

# ---------------------------------------------------------------------------
# Session store
# ---------------------------------------------------------------------------

_sessions: dict[str, ConversationManager] = {}


def _get_or_create_session(call_sid: str) -> ConversationManager:
    if call_sid not in _sessions:
        _sessions[call_sid] = ConversationManager(session_id=call_sid)
        print(f"[VOICE] session created/reused | CallSid={call_sid}")
        logger.info("[VOICE] session created/reused | CallSid=%s", call_sid)
    return _sessions[call_sid]


def _destroy_session(call_sid: str) -> None:
    _sessions.pop(call_sid, None)
    print(f"[SESSION] Session destroyed | CallSid={call_sid}")
    logger.info("Session destroyed | CallSid=%s", call_sid)


# ---------------------------------------------------------------------------
# Service Dependencies
# ---------------------------------------------------------------------------

def get_elevenlabs() -> ElevenLabsService:
    return ElevenLabsService()

def get_counselor() -> CounselorService:
    return CounselorService()


# ---------------------------------------------------------------------------
# TwiML Constants & Helpers
# ---------------------------------------------------------------------------

_GATHER_TIMEOUT = 8
_LANGUAGE = "en-IN"


def _build_gather_twiml(
    audio_url: Optional[str],
    fallback_text: Optional[str],
    action_url: str,
) -> str:
    response = VoiceResponse()

    gather = Gather(
        input="speech",
        action=action_url,
        method="POST",
        timeout=_GATHER_TIMEOUT,
        speech_timeout="auto",
        language=_LANGUAGE,
    )

    if audio_url:
        gather.play(audio_url)
    if fallback_text and not audio_url:
        gather.say(fallback_text, voice="alice", language=_LANGUAGE)

    response.append(gather)
    response.redirect(action_url + "?no_input=1", method="POST")

    return str(response)


def _build_end_twiml(audio_url: Optional[str], fallback_text: Optional[str]) -> str:
    response = VoiceResponse()
    if audio_url:
        response.play(audio_url)
    elif fallback_text:
        response.say(fallback_text, voice="alice", language=_LANGUAGE)
    response.hangup()
    return str(response)


@router.get("/audio/{filename}")
async def serve_audio(filename: str):
    file_path = AUDIO_DIR / filename
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Audio file not found")
    return FileResponse(path=str(file_path), media_type="audio/mpeg")


def _generate_audio_url(
    text: str,
    elevenlabs: ElevenLabsService,
    request: Request,
) -> Optional[str]:
    if not text:
        return None

    filename = f"{uuid.uuid4().hex}.mp3"
    output_file = AUDIO_DIR / filename

    try:
        elevenlabs.text_to_speech(text=text, output_file=str(output_file))
        return str(request.url_for("serve_audio", filename=filename))
    except Exception as exc:
        logger.warning("ElevenLabs synthesis failed, falling back to Twilio TTS | error=%s", exc)
        return None


# ---------------------------------------------------------------------------
# Route: POST /voice — Inbound/Outbound Call Entrypoint
# ---------------------------------------------------------------------------

@router.post("", response_class=Response, summary="Twilio webhook — inbound call")
async def voice_entry(
    request: Request,
    CallSid: str = Form(...),
    From: Optional[str] = Form(default=None),
    elevenlabs: ElevenLabsService = Depends(get_elevenlabs),
):
    print(f"[VOICE] CallSid={CallSid} received | From={From or 'Unknown'}")
    logger.info("[VOICE] CallSid=%s received", CallSid)

    manager = _get_or_create_session(CallSid)
    opening_text = manager.start_conversation()
    print(f"[VOICE] opening message generated: {opening_text!r}")

    tts_start = time.perf_counter()
    print(f"[VOICE] TTS started | CallSid={CallSid}")
    audio_url = None
    try:
        audio_url = _generate_audio_url(opening_text, elevenlabs, request)
    except Exception as exc:
        logger.warning("[VOICE] ElevenLabs TTS error: %s", exc)

    if audio_url:
        print(f"[VOICE] TTS completed | CallSid={CallSid} | audio_url={audio_url} | duration={time.perf_counter() - tts_start:.2f}s")
    else:
        print(f"[VOICE] TTS completed / fallback used | CallSid={CallSid}")

    gather_url = str(request.url_for("gather_speech"))
    twiml = _build_gather_twiml(
        audio_url=audio_url,
        fallback_text=None if audio_url else opening_text,
        action_url=gather_url,
    )

    print(f"[VOICE] returning initial TwiML | CallSid={CallSid}")
    return Response(content=twiml, media_type="text/xml")


# ---------------------------------------------------------------------------
# Route: POST /voice/gather — Speech Turn Handler
# ---------------------------------------------------------------------------

@router.post("/gather", response_class=Response, summary="Twilio webhook — speech gather result", name="gather_speech")
async def gather_speech(
    request: Request,
    CallSid: str = Form(...),
    SpeechResult: Optional[str] = Form(default=None),
    Confidence: Optional[str] = Form(default=None),
    no_input: Optional[str] = None,
    elevenlabs: ElevenLabsService = Depends(get_elevenlabs),
    counselor: CounselorService = Depends(get_counselor),
):
    start_time = time.perf_counter()
    print(f"[GATHER] CallSid={CallSid} received")
    print(f"[GATHER] SpeechResult={SpeechResult!r} | Confidence={Confidence or 'N/A'}")
    logger.info("[GATHER] CallSid=%s | SpeechResult=%r | Confidence=%s", CallSid, SpeechResult, Confidence)

    no_input_flag = (request.query_params.get("no_input") == "1") or (no_input == "1")

    # Unknown session handling
    if CallSid not in _sessions:
        print(f"[SESSION] Unknown CallSid={CallSid} - initializing session gracefully")
        logger.warning("[SESSION] Unknown CallSid=%s", CallSid)
        _sessions[CallSid] = ConversationManager(session_id=CallSid)
        _sessions[CallSid].start_conversation()

    manager = _sessions[CallSid]
    old_state = manager.get_current_state()
    print(f"[GATHER] current conversation state={old_state.value}")

    user_text = SpeechResult.strip() if SpeechResult and SpeechResult.strip() else None

    # Handle no-input / silence
    if no_input_flag or not user_text:
        manager.no_input_count += 1
        print(f"[GATHER] CallSid={CallSid} no-input detected (attempt {manager.no_input_count}/3)")

        if manager.no_input_count >= 3:
            farewell = "I haven't heard a response. Thank you for calling. Have a great day!"
            audio_url = _generate_audio_url(farewell, elevenlabs, request)
            _destroy_session(CallSid)
            twiml = _build_end_twiml(audio_url, None if audio_url else farewell)
            print(f"[TWIML] CallSid={CallSid} returning farewell Hangup after 3 no-inputs")
            return Response(content=twiml, media_type="text/xml")
        else:
            nudge = _silence_response(manager)
            audio_url = _generate_audio_url(nudge, elevenlabs, request)
            gather_url = str(request.url_for("gather_speech"))
            twiml = _build_gather_twiml(audio_url, None if audio_url else nudge, gather_url)
            print(f"[TWIML] CallSid={CallSid} returning nudge Gather for no-input")
            return Response(content=twiml, media_type="text/xml")

    # Reset no-input counter on valid user speech
    manager.no_input_count = 0

    # 1. Gemini AI Generation
    ai_start = time.perf_counter()
    print(f"[AI] CallSid={CallSid} Gemini request started")
    agent_text = None
    try:
        if counselor:
            agent_text = counselor.generate_counselor_response(user_text)
            print(f"[AI] CallSid={CallSid} Gemini completed in {time.perf_counter() - ai_start:.2f}s")
    except Exception as exc:
        print(f"[AI] CallSid={CallSid} Gemini failed/fallback | error={exc}")
        logger.warning("[AI] CallSid=%s Gemini error: %s", CallSid, exc)

    if not agent_text or not agent_text.strip():
        agent_text = manager.process_user_input(user_text)
    else:
        manager.process_user_input(user_text)

    new_state = manager.get_current_state()
    print(f"[STATE] CallSid={CallSid} {old_state.value} -> {new_state.value}")

    # Trim long responses to 1-3 short sentences (~280 chars) for fast phone turns
    if len(agent_text) > 280:
        sentences = [s.strip() for s in agent_text.replace('!', '.').replace('?', '.').split('.') if s.strip()]
        if len(sentences) >= 2:
            agent_text = sentences[0] + ". " + sentences[1] + "."
        else:
            agent_text = agent_text[:280]

    # 2. ElevenLabs TTS Generation
    tts_start = time.perf_counter()
    print(f"[TTS] CallSid={CallSid} synthesis started")
    audio_url = None
    try:
        audio_url = _generate_audio_url(agent_text, elevenlabs, request)
        if audio_url:
            print(f"[TTS] CallSid={CallSid} synthesis completed in {time.perf_counter() - tts_start:.2f}s | audio_url={audio_url}")
        else:
            print(f"[TTS] CallSid={CallSid} synthesis failed -> fallback")
    except Exception as exc:
        print(f"[TTS] CallSid={CallSid} synthesis failed -> fallback | error={exc}")

    # 3. TwiML Generation
    gather_url = str(request.url_for("gather_speech"))
    if new_state == ConversationState.END_CALL:
        _destroy_session(CallSid)
        twiml = _build_end_twiml(audio_url, None if audio_url else agent_text)
        print(f"[TWIML] CallSid={CallSid} returning END_CALL Hangup")
    else:
        twiml = _build_gather_twiml(audio_url, None if audio_url else agent_text, gather_url)
        print(f"[TWIML] CallSid={CallSid} returning conversational Gather")

    print(f"[GATHER] CallSid={CallSid} turn completed in {time.perf_counter() - start_time:.2f}s total")
    return Response(content=twiml, media_type="text/xml")


# ---------------------------------------------------------------------------
# Route: POST /voice/status — Call Status Callback
# ---------------------------------------------------------------------------

@router.post("/status", summary="Twilio webhook — call status updates")
async def call_status(
    CallSid: str = Form(...),
    CallStatus: str = Form(...),
    CallDuration: Optional[str] = Form(default=None),
):
    print(f"[STATUS] CallSid={CallSid} CallStatus={CallStatus} Duration={CallDuration or '0'}")
    logger.info("[STATUS] CallSid=%s CallStatus=%s Duration=%s", CallSid, CallStatus, CallDuration)

    from backend.db.database import SessionLocal
    from backend.db.models import CallLog, Lead
    from datetime import datetime

    db = SessionLocal()
    try:
        call_log = db.query(CallLog).filter(CallLog.session_id == CallSid).first()
        if not call_log:
            # Fallback search by SIM or latest queued
            call_log = db.query(CallLog).order_by(CallLog.id.desc()).first()

        transcript_text = ""
        student_name = "Candidate"
        if CallSid in _sessions:
            session = _sessions[CallSid]
            profile = session.get_student_profile()
            student_name = profile.get("student_name") or "Candidate"
            history = session.conversation_history
            turns = []
            for h in history:
                speaker = "Student" if h.get("role") == "user" else "Priya AI"
                parts = h.get("parts", [])
                text = " ".join(parts) if isinstance(parts, list) else str(parts)
                turns.append(f"{speaker}: {text}")
            transcript_text = "\n".join(turns)

        if call_log:
            call_log.status = CallStatus.lower()
            if CallDuration and CallDuration.isdigit():
                call_log.duration = int(CallDuration)

            if transcript_text:
                call_log.transcript = transcript_text
                # Generate conversation intelligence if completed
                if CallStatus in ["completed", "in-progress"] and counselor_service:
                    try:
                        intel = counselor_service.analyze_transcript(transcript_text, student_name)
                        call_log.summary = intel.get("summary", call_log.summary)
                        call_log.intent = intel.get("intent", "Medium")
                        call_log.sentiment = intel.get("sentiment", "Neutral")
                        call_log.key_topics = intel.get("key_topics", "")
                        call_log.objections = intel.get("objections", "")
                        call_log.next_action = intel.get("next_action", "")

                        if call_log.lead_id:
                            lead = db.query(Lead).filter(Lead.id == call_log.lead_id).first()
                            if lead:
                                lead.call_summary = call_log.summary
                                if call_log.intent == "High":
                                    lead.lead_status = "Qualified"
                                elif lead.lead_status == "New":
                                    lead.lead_status = "Contacted"
                    except Exception as e:
                        logger.warning(f"[VOICE] Intelligence generation error: {e}")

            if CallStatus in {"completed", "busy", "failed", "no-answer", "canceled"}:
                call_log.end_time = datetime.utcnow()

            db.commit()
    except Exception as exc:
        logger.error(f"[STATUS] Failed updating call log in DB: {exc}")
        db.rollback()
    finally:
        db.close()

    terminal_statuses = {"completed", "busy", "failed", "no-answer", "canceled"}
    if CallStatus in terminal_statuses:
        if CallSid in _sessions:
            print(f"[STATUS] terminal cleanup for CallSid={CallSid}")
            _destroy_session(CallSid)
    else:
        print(f"[STATUS] non-terminal status preserved | CallSid={CallSid}")

    return {"status": "ok"}



def _silence_response(manager: ConversationManager) -> str:
    state = manager.get_current_state()
    name = manager.get_student_profile().get("student_name") or "there"

    prompts = {
        ConversationState.ASK_NAME: "I didn't catch that. Could you please tell me your name?",
        ConversationState.ASK_EDUCATION: f"Sorry {name}, I didn't hear you. Could you share your education background?",
        ConversationState.ASK_INTEREST: f"No worries {name}, could you tell me which course you're interested in?",
        ConversationState.ANSWER_FAQ: "Feel free to ask any questions about fees, duration, or placements!",
        ConversationState.QUALIFY_LEAD: f"Are you still there, {name}? Would you like to know more or shall I schedule a callback?",
        ConversationState.INVITE_WORKSHOP: f"{name}, would you like me to reserve a spot at our free workshop?",
        ConversationState.CALLBACK_REQUEST: "Could you share a convenient date and time for our callback?",
    }
    return prompts.get(
        state,
        f"Sorry {name}, I didn't catch that. Could you please repeat?",
    )
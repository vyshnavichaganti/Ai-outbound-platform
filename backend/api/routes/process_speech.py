# LEGACY ROUTE: replaced by backend/api/routes/voice_router.py in current production.
from fastapi import APIRouter, Request
from fastapi.responses import Response
from twilio.twiml.voice_response import VoiceResponse, Gather

from backend.services.gemini_service import GeminiService

router = APIRouter()


@router.post("/process-speech")
async def process_speech(request: Request):
    form_data = await request.form()

    user_text = form_data.get("SpeechResult", "")

    print("CUSTOMER SAID:", user_text)

    try:
        ai_reply = GeminiService.ask_ai(user_text)

    except Exception as e:
        print("GEMINI ERROR:", str(e))

        ai_reply = (
            "I'm currently experiencing high demand. "
            "Please try again in a moment."
        )

    print("AI REPLY:", ai_reply)

    response = VoiceResponse()

    response.say(ai_reply)

    gather = Gather(
        input="speech",
        action="https://carat-frosty-various.ngrok-free.dev/process-speech",
        method="POST",
        timeout=10,
        speech_timeout="auto"
    )

    gather.say("What else would you like to know?")

    response.append(gather)

    return Response(
        content=str(response),
        media_type="application/xml"
    )
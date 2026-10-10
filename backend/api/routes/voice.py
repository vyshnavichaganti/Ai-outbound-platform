# LEGACY ROUTE: replaced by backend/api/routes/voice_router.py in current production.
from fastapi import APIRouter, Request
from fastapi.responses import Response
from twilio.twiml.voice_response import VoiceResponse, Gather

router = APIRouter()

@router.post("/voice")
async def voice_webhook(request: Request):

    response = VoiceResponse()

    gather = Gather(
    input="speech",
    action="https://carat-frosty-various.ngrok-free.dev/process-speech",
    method="POST",
    speech_timeout="auto"
)

    gather.say(
        "Hello. I am your AI assistant. How can I help you today?"
    )

    response.append(gather)

    return Response(
        content=str(response),
        media_type="application/xml"
    )
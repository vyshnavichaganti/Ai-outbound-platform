import os
import logging
from twilio.rest import Client
from dotenv import load_dotenv

load_dotenv()
logger = logging.getLogger(__name__)

class TwilioService:

    def __init__(self):
        self.account_sid = os.getenv("TWILIO_ACCOUNT_SID")
        self.auth_token = os.getenv("TWILIO_AUTH_TOKEN")
        self.phone_number = os.getenv("TWILIO_PHONE_NUMBER")
        self.webhook_url = os.getenv("BASE_URL") or os.getenv("TWILIO_WEBHOOK_URL")

        if self.account_sid and self.auth_token:
            try:
                self.client = Client(self.account_sid, self.auth_token)
            except Exception as e:
                logger.error(f"Failed to initialize Twilio Client: {e}")
                self.client = None
        else:
            self.client = None

    def is_configured(self) -> bool:
        return bool(self.account_sid and self.auth_token and self.phone_number and self.client)

    def initiate_outbound_call(self, to_number: str, webhook_url: str = None, status_callback_url: str = None) -> dict:
        if not self.is_configured():
            raise RuntimeError("Twilio credentials (TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER) are missing or invalid.")

        url = webhook_url or (f"{self.webhook_url}/voice" if self.webhook_url else None)
        callback = status_callback_url or (f"{self.webhook_url}/voice/status" if self.webhook_url else None)

        kwargs = {
            "to": to_number,
            "from_": self.phone_number,
        }

        if url:
            kwargs["url"] = url
        else:
            kwargs["twiml"] = """<Response><Say voice="alice" language="en-IN">Hello! I am Priya, your AI career counselor. Please tell me your career goals.</Say><Record timeout="3" maxLength="10"/></Response>"""

        if callback:
            kwargs["status_callback"] = callback
            kwargs["status_callback_event"] = ["initiated", "ringing", "answered", "completed"]

        call = self.client.calls.create(**kwargs)
        return {
            "call_sid": call.sid,
            "status": call.status,
            "to": call.to,
            "from": call.from_
        }

    def make_call(self, to_number):
        return self.initiate_outbound_call(to_number)
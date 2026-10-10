import os
from twilio.rest import Client
from dotenv import load_dotenv

load_dotenv()


class TwilioService:

    def __init__(self):

        self.account_sid = os.getenv("TWILIO_ACCOUNT_SID")
        self.auth_token = os.getenv("TWILIO_AUTH_TOKEN")
        self.phone_number = os.getenv("TWILIO_PHONE_NUMBER")

        self.client = Client(
            self.account_sid,
            self.auth_token
        )

    def make_call(self, to_number):

        call = self.client.calls.create(
            to=to_number,
            from_=self.phone_number,
            twiml="""
            <Response>
                <Say>
                    Hello. This is your AI Voice Agent calling.
                </Say>
            </Response>
            """
        )

        return {
            "call_sid": call.sid,
            "status": call.status
        }

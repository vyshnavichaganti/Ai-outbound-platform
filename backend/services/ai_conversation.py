from backend.services.gemini_service import GeminiService
from backend.voice.tts_service import TTSService


class AIConversation:

    @staticmethod
    def process_message(customer_text):

        ai_reply = GeminiService.ask_ai(
            customer_text
        )

        audio_file = TTSService.text_to_speech(
            ai_reply
        )

        return {
            "customer_text": customer_text,
            "ai_reply": ai_reply,
            "audio_file": audio_file
        }
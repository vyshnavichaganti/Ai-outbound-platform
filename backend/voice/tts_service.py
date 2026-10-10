from backend.voice.elevenlabs_service import ElevenLabsService

class TTSService:

    def __init__(self):
        self.elevenlabs = ElevenLabsService()

    def generate_audio(self, text):
        return self.elevenlabs.text_to_speech(
            text=text,
            output_file="education_voice.mp3"
        )
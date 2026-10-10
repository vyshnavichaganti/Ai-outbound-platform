import os
from dotenv import load_dotenv
from elevenlabs.client import ElevenLabs

load_dotenv()

class ElevenLabsService:

    def __init__(self):

        api_key = os.getenv("ELEVENLABS_API_KEY")

        print("KEY FOUND:", api_key is not None)

        self.client = ElevenLabs(
            api_key=api_key
        )

        self.voice_id = "3aPMMoVfLbdhmnFUIG1e"

    def text_to_speech(self, text, output_file="education_voice.mp3"):

        audio = self.client.text_to_speech.convert(
            voice_id=self.voice_id,
            model_id="eleven_turbo_v2",
            text=text,
            optimize_streaming_latency=4,
            language_code="en",
        )

        with open(output_file, "wb") as f:
            for chunk in audio:
                f.write(chunk)

        print("Audio saved:", output_file)

        return output_file

    def is_configured(self) -> bool:
        return bool(os.getenv("ELEVENLABS_API_KEY"))
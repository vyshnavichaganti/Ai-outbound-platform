import os
from google import genai


class GeminiLiveService:

    def __init__(self):

        self.client = genai.Client(
            api_key=os.getenv("GEMINI_API_KEY")
        )

        print("Gemini Live initialized")
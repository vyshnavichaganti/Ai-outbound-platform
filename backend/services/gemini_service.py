import os
import time
from dotenv import load_dotenv
import google.generativeai as genai

load_dotenv()

genai.configure(
    api_key=os.getenv("GEMINI_API_KEY")
)

model = genai.GenerativeModel(
    "gemini-2.5-flash"
)


class GeminiService:

    @staticmethod
    def ask_ai(user_text):

        prompt = f"""
You are a concise phone-call assistant.
Keep replies natural, under 20 words, and ask one question at a time.
No long paragraphs or bullet points.
Be friendly and conversational.

User: {user_text}
"""

        start = time.perf_counter()
        response = model.generate_content(
            prompt,
            generation_config={
                "temperature": 0.2,
                "top_p": 0.95,
                "max_output_tokens": 60,
                "candidate_count": 1,
            },
        )
        elapsed = time.perf_counter() - start
        print(f"GEMINI LATENCY: {elapsed:.2f} sec")
        return response.text.strip()
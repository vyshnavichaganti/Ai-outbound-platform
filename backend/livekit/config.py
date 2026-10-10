import os
from dotenv import load_dotenv

load_dotenv()

LIVEKIT_URL = os.getenv("LIVEKIT_URL")
LIVEKIT_API_KEY = os.getenv("LIVEKIT_API_KEY")
LIVEKIT_API_SECRET = os.getenv("LIVEKIT_API_SECRET")

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

ROOM_NAME = "career-counselor-room"
AGENT_NAME = "career-counselor-agent"
from backend.livekit.room_manager import RoomManager
from backend.livekit.gemini_live_service import GeminiLiveService


class CareerCounselorAgent:

    def __init__(self):

        self.room_manager = RoomManager()

        self.gemini = GeminiLiveService()

        print("Career Counselor Agent initialized.")
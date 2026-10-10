from backend.livekit.config import ROOM_NAME


class RoomManager:

    def __init__(self):
        self.room_name = ROOM_NAME

    def get_room_name(self):
        return self.room_name
import asyncio
import os
from dotenv import load_dotenv
from livekit import api

load_dotenv()

ROOM_NAME = "carreer8919663581"

async def main():

    lkapi = api.LiveKitAPI(
        url=os.getenv("LIVEKIT_URL"),
        api_key=os.getenv("LIVEKIT_API_KEY"),
        api_secret=os.getenv("LIVEKIT_API_SECRET"),
    )

    # Dispatch worker into room
    await lkapi.agent_dispatch.create_dispatch(
        api.CreateAgentDispatchRequest(
            room=ROOM_NAME,
            agent_name="career-counselor"
        )
    )

    # Call phone
    response = await lkapi.sip.create_sip_participant(
        api.CreateSIPParticipantRequest(
            room_name=ROOM_NAME,
            sip_trunk_id="ST_sW2J64h8yZid",
            sip_call_to="+918919663581"
        )
    )

    print(response)

    await lkapi.aclose()

asyncio.run(main())
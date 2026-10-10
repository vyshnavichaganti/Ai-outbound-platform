
print("RUN_AGENT FILE =", __file__)
from dotenv import load_dotenv
load_dotenv()

import os
from livekit.agents import WorkerOptions, cli

from backend.livekit.voice_agent import entrypoint
if __name__ == "__main__":
    print("Launching career-counselor agent")
    cli.run_app(
        WorkerOptions(
    entrypoint_fnc=entrypoint,
    agent_name="career-counselor",
    ws_url=os.getenv("LIVEKIT_URL"),
    api_key=os.getenv("LIVEKIT_API_KEY"),
    api_secret=os.getenv("LIVEKIT_API_SECRET"),
)
    )
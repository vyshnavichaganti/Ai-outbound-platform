# backend/livekit/voice_agent.py


from livekit import agents
from livekit.agents import Agent, AgentSession
from livekit.plugins import google


from backend.services.knowledge_service import load_all_knowledge


from backend.livekit.function_tools import (
    update_student_profile,
    recommend_course,
    book_workshop,
    schedule_callback,
    update_language,
    save_call_summary,
    update_lead_status,
    end_call,
)



async def entrypoint(ctx: agents.JobContext):


    print("\n========== AI Career Counselor ==========")


    # Connect LiveKit room
    print("Connecting to room...")
    await ctx.connect()


    # Wait for SIP participant
    print("Waiting for participant...")

    participant = await ctx.wait_for_participant()

    print(
        f"Participant joined: {participant.identity}"
    )


    # Load knowledge base

    business_context = load_all_knowledge()



    # Gemini realtime model

    model = google.realtime.RealtimeModel(

        model="gemini-3.1-flash-live-preview",

        voice="Puck"

    )



    # AI Agent


    agent = Agent(

        instructions=f"""

You are an AI Career Counselor from AI Academy.


Company Information:

{business_context}



Your job:

- Talk naturally with students
- Understand their career goals
- Recommend courses
- Explain benefits
- Collect student details


Speaking style:

- Human-like
- Friendly counselor
- Indian English style
- Hyderabad/Bangalore tone
- Short answers
- Ask one question at a time


Important:

Never sound robotic.

Never say you are an AI.

Maintain conversation naturally.



Collect:

1. Student name
2. Degree
3. Year
4. Branch
5. Career goal
6. Interest
7. Budget
8. Learning mode
9. Callback time


Use tools when required.

""",


        tools=[

            update_student_profile,

            recommend_course,

            book_workshop,

            schedule_callback,

            update_language,

            save_call_summary,

            update_lead_status,

            end_call

        ]

    )




    # Create session

    session = AgentSession(

        llm=model

    )



    print("Starting session...")



    await session.start(

        agent=agent,

        room=ctx.room

    )



    print("================================")
    print("SESSION STARTED")
    print("AI READY FOR CALL")
    print("================================")



    # Keep conversation alive

    await session.wait_for_idle()



    print("Conversation ended")

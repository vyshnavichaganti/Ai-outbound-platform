import random

from backend.services.calllog_db_service import save_call_log

from backend.db.database import call_logs_db
from backend.workers.worker_status import workers

from backend.telephony.sip_service import make_call

from backend.services.ai_conversation import AIConversation

statuses = [
    "completed",
    "failed",
    "no_answer",
    "interested",
    "callback_requested"
]


def process_call(lead_id, worker):

    # SIP Call
    call = make_call("9876543210")

    # AI Conversation + Voice
    ai_result = AIConversation.process_message(
        "Hello"
    )

    # Random Call Outcome
    status = random.choice(statuses)

    result = {
        "lead_id": lead_id,
        "worker": worker,
        "call": call,
        "conversation": ai_result["ai_reply"],
        "audio_file": ai_result["audio_file"],
        "status": status
    }

    call_logs_db.append(result)

    # Free worker after call
    workers[worker] = "Idle"

    save_call_log(
        lead_id,
        worker,
        status,
        ai_result["ai_reply"]
    )

    return result
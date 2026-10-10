from backend.db.database import campaign_status

from backend.services.dispatcher_service import assign_worker
from backend.services.call_service import process_call

from backend.services.contact_db_service import get_contacts

from backend.services.ai_conversation import AIConversation

def start_campaign():

    contacts = get_contacts()

    results = []

    campaign_status["total"] = len(contacts)
    campaign_status["completed"] = 0
    campaign_status["pending"] = len(contacts)

    for index, contact in enumerate(contacts, start=1):

        worker = assign_worker(index)
        ai_result = AIConversation.process_message(
    f"Call customer {contact.name} and introduce our internship program."
)

        result = process_call(
            lead_id=index,
            worker=worker
        )

        results.append({
            "contact": {
                "id": contact.id,
                "name": contact.name,
                "phone": contact.phone
            },
            "result": result
        })

        campaign_status["completed"] += 1
        campaign_status["pending"] -= 1

    return results
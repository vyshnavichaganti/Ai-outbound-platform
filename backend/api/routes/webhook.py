from fastapi import APIRouter

router = APIRouter()
from backend.db.database import call_logs_db

@router.post("/webhook")
def webhook(data: dict):

    call_logs_db.append(data)

    return {
        "message": "Webhook received",
        "data": data
    }

@router.get("/webhook")
def get_webhooks():
    return call_logs_db
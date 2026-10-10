from fastapi import APIRouter
from backend.workers.worker_status import workers

router = APIRouter()

@router.get("/workers")
def get_workers():
    return workers
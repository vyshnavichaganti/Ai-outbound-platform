from fastapi import APIRouter
from backend.services.campaign_runner import start_campaign

router = APIRouter()

@router.post("/campaign/start")
def run_campaign():

    results = start_campaign()

    return {
        "message": "Campaign Started",
        "calls_processed": len(results),
        "results": results
    }
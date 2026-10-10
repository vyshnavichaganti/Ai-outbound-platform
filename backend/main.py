from fastapi import FastAPI
from backend.api.routes.campaigns import router as campaign_router
from backend.api.routes.contacts import router as contact_router

from backend.api.routes.webhook import router as webhook_router
from backend.api.routes.dashboard import router as dashboard_router
from backend.api.routes.calls import router as calls_router
from backend.api.routes.campaign_runner import router as campaign_runner_router
from backend.api.routes.upload import router as upload_router
from backend.api.routes.workers import router as worker_router
from backend.db.models import Base
from backend.db.database import engine
from backend.api.routes.call_logs import router as call_logs_router
from backend.api.routes.process_speech import router as speech_router
from backend.api.routes.voice_router import router as voice_router



from fastapi.middleware.cors import CORSMiddleware
from backend.api.routes.counselor import router as counselor_router
from backend.api.routes.leads import router as leads_router
from backend.api.routes.agents import router as agents_router
from backend.api.routes.knowledge import router as knowledge_router

app = FastAPI(
    title="AI Outbound Calling Platform"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(campaign_router)
app.include_router(contact_router)
app.include_router(webhook_router)
app.include_router(dashboard_router)
app.include_router(calls_router)
app.include_router(campaign_runner_router)
app.include_router(upload_router)
app.include_router(worker_router)
app.include_router(call_logs_router)

app.include_router(voice_router)
app.include_router(speech_router)
app.include_router(counselor_router)
app.include_router(leads_router)
app.include_router(agents_router)
app.include_router(knowledge_router)

from backend.db.init_db import migrate_db

Base.metadata.create_all(bind=engine)
migrate_db()


@app.get("/")
def home():
    return {"message": "Platform Running"}
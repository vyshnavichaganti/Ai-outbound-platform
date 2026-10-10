import logging
from datetime import datetime
from typing import Optional, List
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session

from backend.db.database import SessionLocal
from backend.db.models import AIAgent

router = APIRouter(prefix="", tags=["agents"])
logger = logging.getLogger(__name__)


class AIAgentSchema(BaseModel):
    name: str
    role: Optional[str] = "Career Counselor"
    language: Optional[str] = "english"
    voice: Optional[str] = "Priya (ElevenLabs)"
    greeting: Optional[str] = "Hello! I'm Priya, your AI career counselor. How can I assist you today?"
    system_prompt: Optional[str] = ""
    objectives: Optional[str] = ""
    is_active: Optional[bool] = True


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def ensure_default_agent(db: Session):
    priya = db.query(AIAgent).filter(AIAgent.agent_id == "priya").first()
    if not priya:
        priya = AIAgent(
            agent_id="priya",
            name="Priya - AI Career Counselor",
            role="Career Counselor",
            language="english",
            voice="Priya (ElevenLabs)",
            greeting="Hello! I'm Priya, your personal AI career counselor. How can I assist with your career path today?",
            system_prompt="You are Priya, an expert AI Career Counselor. Counsel students on tech courses, placement support, and career trajectories.",
            objectives="Qualify student leads, assess career goals, recommend suitable courses, and invite for masterclass workshops.",
            is_active=True,
            created_at=datetime.utcnow()
        )
        db.add(priya)
        db.commit()


@router.get("/agents")
def get_ai_agents(db: Session = Depends(get_db)):
    ensure_default_agent(db)
    agents = db.query(AIAgent).order_by(AIAgent.id.asc()).all()
    result = []
    for a in agents:
        result.append({
            "id": a.id,
            "agent_id": a.agent_id,
            "name": a.name,
            "role": a.role,
            "language": a.language,
            "voice": a.voice,
            "greeting": a.greeting,
            "system_prompt": a.system_prompt,
            "objectives": a.objectives,
            "is_active": bool(a.is_active),
            "created_at": a.created_at.strftime("%Y-%m-%d %H:%M") if a.created_at else ""
        })
    return result


@router.post("/agents")
def create_ai_agent(req: AIAgentSchema, db: Session = Depends(get_db)):
    agent_id = f"agent-{datetime.utcnow().timestamp()}"
    new_agent = AIAgent(
        agent_id=agent_id,
        name=req.name,
        role=req.role or "Career Counselor",
        language=req.language or "english",
        voice=req.voice or "Priya (ElevenLabs)",
        greeting=req.greeting or "Hello!",
        system_prompt=req.system_prompt or "",
        objectives=req.objectives or "",
        is_active=bool(req.is_active),
        created_at=datetime.utcnow()
    )
    db.add(new_agent)
    db.commit()
    db.refresh(new_agent)
    return {"message": "AI Agent created successfully", "agent": new_agent}


@router.put("/agents/{agent_db_id}")
def update_ai_agent(agent_db_id: int, req: AIAgentSchema, db: Session = Depends(get_db)):
    agent = db.query(AIAgent).filter(AIAgent.id == agent_db_id).first()
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")

    agent.name = req.name
    agent.role = req.role or agent.role
    agent.language = req.language or agent.language
    agent.voice = req.voice or agent.voice
    agent.greeting = req.greeting or agent.greeting
    agent.system_prompt = req.system_prompt or agent.system_prompt
    agent.objectives = req.objectives or agent.objectives
    agent.is_active = bool(req.is_active)

    db.commit()
    return {"message": "AI Agent updated successfully"}


@router.post("/agents/{agent_db_id}/activate")
def activate_agent(agent_db_id: int, db: Session = Depends(get_db)):
    agent = db.query(AIAgent).filter(AIAgent.id == agent_db_id).first()
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")

    agent.is_active = True
    db.commit()
    return {"message": f"Agent {agent.name} activated."}


@router.post("/agents/{agent_db_id}/deactivate")
def deactivate_agent(agent_db_id: int, db: Session = Depends(get_db)):
    agent = db.query(AIAgent).filter(AIAgent.id == agent_db_id).first()
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")

    if agent.agent_id == "priya":
        raise HTTPException(status_code=400, detail="Cannot deactivate primary counselor Priya.")

    agent.is_active = False
    db.commit()
    return {"message": f"Agent {agent.name} deactivated."}

from sqlalchemy import Boolean, Column, Integer, String, DateTime, Text, Float, ForeignKey
from datetime import datetime
from backend.db.database import Base


class Lead(Base):
    __tablename__ = "leads"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(String, index=True, default="")

    student_name = Column(String, default="")
    phone = Column(String, default="", index=True)
    email = Column(String, default="")
    degree = Column(String, default="B.Tech")
    year = Column(String, default="3rd Year")
    branch = Column(String, default="CSE")
    career_goal = Column(String, default="Software Engineer")

    interest = Column(String, default="Data Science & AI")
    budget = Column(String, default="₹30,000")
    mode = Column(String, default="Online Live")
    language = Column(String, default="english")

    lead_status = Column(String, default="New") # New, Contacted, Interested, Qualified, Workshop Registered, Converted, Not Interested, DNC
    is_dnc = Column(Boolean, default=False)
    campaign_id = Column(Integer, nullable=True, index=True)
    callback_date = Column(String, default="")
    callback_time = Column(String, default="")
    workshop_registered = Column(Boolean, default=False)
    call_summary = Column(Text, default="")
    notes = Column(Text, default="")

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class CallLog(Base):
    __tablename__ = "call_logs"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(String, index=True, default="") # Twilio Call SID or session UUID
    lead_id = Column(Integer, nullable=True, index=True)
    campaign_id = Column(Integer, nullable=True, index=True)
    phone = Column(String, default="")

    student_name = Column(String, default="")
    course_recommended = Column(String, default="")
    workshop_registered = Column(String, default="No")
    summary = Column(Text, default="")
    transcript = Column(Text, default="")
    language = Column(String, default="english")
    lead_status = Column(String, default="No Response")
    callback_time = Column(String, default="")
    worker = Column(String, default="Priya AI")
    status = Column(String, default="queued") # initiated, ringing, in-progress, completed, busy, failed, no-answer, canceled
    ai_response = Column(Text, default="")

    # Conversation Intelligence fields
    intent = Column(String, default="")
    sentiment = Column(String, default="")
    key_topics = Column(Text, default="")
    objections = Column(Text, default="")
    next_action = Column(String, default="")
    duration = Column(Integer, default=0) # duration in seconds

    start_time = Column(DateTime, default=datetime.utcnow)
    end_time = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class Contact(Base):
    __tablename__ = "contacts"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, default="")
    phone = Column(String, default="")
    email = Column(String, default="")
    education = Column(String, default="B.Tech")
    source = Column(String, default="CSV Import")
    is_dnc = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)


class CampaignModel(Base):
    __tablename__ = "campaigns_table"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    description = Column(Text, default="")
    target_audience = Column(String, default="")
    course_interest = Column(String, default="")
    agent_id = Column(String, default="priya")
    language = Column(String, default="english")
    status = Column(String, default="Draft") # Draft, Ready, Running, Paused, Completed
    total_contacts = Column(Integer, default=0)
    completed = Column(Integer, default=0)
    connected = Column(Integer, default=0)
    qualified = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class CallQueueItem(Base):
    __tablename__ = "call_queue"

    id = Column(Integer, primary_key=True, index=True)
    campaign_id = Column(Integer, nullable=True, index=True)
    lead_id = Column(Integer, index=True)
    student_name = Column(String, default="")
    phone = Column(String, default="")
    status = Column(String, default="pending") # pending, in-progress, completed, failed, skipped
    position = Column(Integer, default=0)
    retry_count = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)


class FollowUp(Base):
    __tablename__ = "follow_ups"

    id = Column(Integer, primary_key=True, index=True)
    lead_id = Column(Integer, index=True)
    student_name = Column(String)
    reason = Column(String, default="")
    notes = Column(Text, default="")
    due_date = Column(String)
    due_time = Column(String, default="10:00 AM")
    assigned_agent = Column(String, default="Priya AI")
    status = Column(String, default="Upcoming") # Upcoming, Completed, Overdue, Canceled
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class DNCContact(Base):
    __tablename__ = "dnc_contacts"

    id = Column(Integer, primary_key=True, index=True)
    phone = Column(String, unique=True, index=True)
    reason = Column(String, default="Student requested opt-out")
    created_at = Column(DateTime, default=datetime.utcnow)


class AIAgent(Base):
    __tablename__ = "ai_agents"

    id = Column(Integer, primary_key=True, index=True)
    agent_id = Column(String, unique=True, index=True)
    name = Column(String)
    role = Column(String, default="Career Counselor")
    language = Column(String, default="english")
    voice = Column(String, default="Priya (ElevenLabs)")
    greeting = Column(Text, default="Hello! I'm Priya, your AI career counselor. How can I help you today?")
    system_prompt = Column(Text, default="")
    objectives = Column(Text, default="")
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class KnowledgeDocument(Base):
    __tablename__ = "knowledge_documents"

    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String)
    file_type = Column(String, default="txt") # pdf, txt, etc.
    file_path = Column(String, default="")
    file_size = Column(Integer, default=0)
    content_summary = Column(Text, default="")
    extracted_text = Column(Text, default="")
    created_at = Column(DateTime, default=datetime.utcnow)


class FAQItem(Base):
    __tablename__ = "faqs"

    id = Column(Integer, primary_key=True, index=True)
    question = Column(String)
    answer = Column(Text)
    category = Column(String, default="General")
    created_at = Column(DateTime, default=datetime.utcnow)
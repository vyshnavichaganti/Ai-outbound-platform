import os
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

raw_db_url = os.getenv("DATABASE_URL")

if raw_db_url:
    # Fix Render/Heroku postgres:// URI prefix for SQLAlchemy 1.4+
    if raw_db_url.startswith("postgres://"):
        DATABASE_URL = raw_db_url.replace("postgres://", "postgresql://", 1)
    else:
        DATABASE_URL = raw_db_url
else:
    DATABASE_URL = "sqlite:///voice_agent.db"

if DATABASE_URL.startswith("sqlite"):
    engine = create_engine(
        DATABASE_URL,
        connect_args={"check_same_thread": False}
    )
else:
    engine = create_engine(
        DATABASE_URL,
        pool_pre_ping=True,
        pool_size=10,
        max_overflow=20
    )

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

Base = declarative_base()

campaigns_db = []
contacts_db = []
call_logs_db = []
campaign_status = {"status": "idle", "processed": 0, "total": 0}
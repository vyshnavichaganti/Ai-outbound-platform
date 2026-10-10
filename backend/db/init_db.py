import sqlite3
import os
from backend.db.models import Base
from backend.db.database import engine

def migrate_db():
    Base.metadata.create_all(bind=engine)
    db_file = engine.url.database
    if db_file:
        db_path = os.path.abspath(db_file) if not os.path.isabs(db_file) else db_file
    else:
        db_path = os.path.abspath("voice_agent.db")

    if not os.path.exists(db_path):
        return

    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    columns_to_ensure = {
        "leads": [
            ("session_id", "TEXT DEFAULT ''"),
            ("phone", "TEXT DEFAULT ''"),
            ("email", "TEXT DEFAULT ''"),
            ("degree", "TEXT DEFAULT 'B.Tech'"),
            ("year", "TEXT DEFAULT '3rd Year'"),
            ("branch", "TEXT DEFAULT 'CSE'"),
            ("career_goal", "TEXT DEFAULT 'Software Engineer'"),
            ("interest", "TEXT DEFAULT 'Data Science & AI'"),
            ("budget", "TEXT DEFAULT '₹30,000'"),
            ("mode", "TEXT DEFAULT 'Online Live'"),
            ("language", "TEXT DEFAULT 'english'"),
            ("lead_status", "TEXT DEFAULT 'New'"),
            ("is_dnc", "INTEGER DEFAULT 0"),
            ("campaign_id", "INTEGER"),
            ("callback_date", "TEXT DEFAULT ''"),
            ("callback_time", "TEXT DEFAULT ''"),
            ("workshop_registered", "INTEGER DEFAULT 0"),
            ("call_summary", "TEXT DEFAULT ''"),
            ("notes", "TEXT DEFAULT ''"),
            ("created_at", "DATETIME"),
            ("updated_at", "DATETIME")
        ],
        "call_logs": [
            ("session_id", "TEXT DEFAULT ''"),
            ("lead_id", "INTEGER"),
            ("campaign_id", "INTEGER"),
            ("phone", "TEXT DEFAULT ''"),
            ("student_name", "TEXT DEFAULT ''"),
            ("course_recommended", "TEXT DEFAULT ''"),
            ("workshop_registered", "TEXT DEFAULT 'No'"),
            ("summary", "TEXT DEFAULT ''"),
            ("transcript", "TEXT DEFAULT ''"),
            ("language", "TEXT DEFAULT 'english'"),
            ("lead_status", "TEXT DEFAULT 'No Response'"),
            ("callback_time", "TEXT DEFAULT ''"),
            ("worker", "TEXT DEFAULT ''"),
            ("status", "TEXT DEFAULT ''"),
            ("ai_response", "TEXT DEFAULT ''"),
            ("intent", "TEXT DEFAULT ''"),
            ("sentiment", "TEXT DEFAULT ''"),
            ("key_topics", "TEXT DEFAULT ''"),
            ("objections", "TEXT DEFAULT ''"),
            ("next_action", "TEXT DEFAULT ''"),
            ("duration", "INTEGER DEFAULT 0"),
            ("start_time", "DATETIME"),
            ("end_time", "DATETIME"),
            ("created_at", "DATETIME")
        ],
        "campaigns_table": [
            ("description", "TEXT DEFAULT ''"),
            ("agent_id", "TEXT DEFAULT 'priya'"),
            ("language", "TEXT DEFAULT 'english'"),
            ("updated_at", "DATETIME")
        ],
        "follow_ups": [
            ("notes", "TEXT DEFAULT ''"),
            ("updated_at", "DATETIME")
        ],
        "contacts": [
            ("name", "TEXT DEFAULT ''"),
            ("phone", "TEXT DEFAULT ''"),
            ("email", "TEXT DEFAULT ''"),
            ("education", "TEXT DEFAULT 'B.Tech'"),
            ("source", "TEXT DEFAULT 'CSV Import'"),
            ("is_dnc", "INTEGER DEFAULT 0"),
            ("created_at", "DATETIME")
        ]
    }

    for table_name, cols in columns_to_ensure.items():
        cursor.execute(f"PRAGMA table_info({table_name})")
        existing_cols = [row[1] for row in cursor.fetchall()]
        for col_name, col_type in cols:
            if col_name not in existing_cols:
                print(f"Adding missing column {col_name} to table {table_name}")
                cursor.execute(f"ALTER TABLE {table_name} ADD COLUMN {col_name} {col_type}")

    conn.commit()
    conn.close()
    print("Database schema migration checked and up to date.")

if __name__ == "__main__":
    migrate_db()

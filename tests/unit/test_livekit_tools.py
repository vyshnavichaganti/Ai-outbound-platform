import asyncio

from backend.db.database import SessionLocal, engine
from backend.db.models import Base, Lead
from backend.livekit import function_tools


def test_update_student_profile_persists_lead_record():
    Base.metadata.create_all(bind=engine)

    function_tools.clear_active_session()
    function_tools.set_active_session("unit-test-session")

    asyncio.run(
        function_tools.update_student_profile(
            name="Asha",
            degree="B.Tech",
            year="2nd",
            branch="CSE",
            interest="AI",
            language="telugu",
            lead_status="Interested",
        )
    )

    db = SessionLocal()
    try:
        lead = db.query(Lead).filter(Lead.session_id == "unit-test-session").first()
        assert lead is not None
        assert lead.student_name == "Asha"
        assert lead.degree == "B.Tech"
        assert lead.language == "telugu"
        assert lead.lead_status == "Interested"
    finally:
        db.close()

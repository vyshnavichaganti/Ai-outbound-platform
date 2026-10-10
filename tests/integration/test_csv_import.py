import pytest
from backend.db.database import SessionLocal
from backend.db.models import Lead
from backend.api.routes.leads import process_lead_import_items

def test_csv_lead_import_pipeline():
    db = SessionLocal()
    test_phones = ["+918919663581", "+919876543210", "+919123456789"]
    db.query(Lead).filter(Lead.phone.in_(test_phones)).delete(synchronize_session=False)
    db.commit()

    # 1. Test Valid Import (3 Leads)
    raw_csv_items = [
        {"student_name": "Test Student 1", "phone": "8919663581", "email": "test1@example.com", "degree": "B.Tech", "year": "3", "branch": "CSE", "career_goal": "Software Engineer", "interest": "AI"},
        {"student_name": "Test Student 2", "phone": "9876543210", "email": "test2@example.com", "degree": "B.Tech", "year": "4", "branch": "CSE", "career_goal": "Data Scientist", "interest": "ML"},
        {"student_name": "Test Student 3", "phone": "9123456789", "email": "test3@example.com", "degree": "B.Tech", "year": "3", "branch": "AI&ML", "career_goal": "AI Engineer", "interest": "Generative AI"}
    ]

    res = process_lead_import_items(raw_csv_items, db)
    assert res["success"] == True
    assert res["imported"] == 3
    assert res["duplicates"] == 0
    assert res["invalid"] == 0

    # 2. Test Duplicate Detection (Same Leads Re-imported)
    res_dup = process_lead_import_items(raw_csv_items, db)
    assert res_dup["imported"] == 0
    assert res_dup["duplicates"] == 3
    assert res_dup["invalid"] == 0

    # 3. Test Invalid Rows Validation
    invalid_items = [
        {"student_name": "", "phone": "9999999999"},
        {"student_name": "No Phone Student", "phone": ""},
        {"student_name": "Bad Phone Student", "phone": "12345"},
        {"student_name": "Duplicate Student", "phone": "8919663581"}
    ]
    res_inv = process_lead_import_items(invalid_items, db)
    assert res_inv["imported"] == 0
    assert res_inv["duplicates"] == 1
    assert res_inv["invalid"] == 3

    # Cleanup test leads
    db.query(Lead).filter(Lead.phone.in_(test_phones)).delete(synchronize_session=False)
    db.commit()
    db.close()

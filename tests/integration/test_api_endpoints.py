import pytest
from fastapi.testclient import TestClient
from backend.main import app

client = TestClient(app)

def test_get_leads():
    response = client.get("/leads")
    assert response.status_code == 200
    assert isinstance(response.json(), list)

def test_lead_lifecycle_and_dnc():
    # 1. Create Lead
    create_payload = {
        "student_name": "Rohan Verma",
        "phone": "+919988776655",
        "email": "rohan.verma@example.com",
        "degree": "B.Tech",
        "year": "3rd Year",
        "branch": "CSE",
        "career_goal": "AI Engineer",
        "interest": "Data Science & AI",
        "budget": "₹35,000",
        "mode": "Online Live",
        "lead_status": "New"
    }
    r_create = client.post("/leads", json=create_payload)
    assert r_create.status_code == 200
    lead_id = r_create.json()["lead"]["id"]
    assert lead_id is not None

    # 2. Update Lead
    update_payload = {
        "student_name": "Rohan Verma (Updated)",
        "career_goal": "Senior AI Architect",
        "lead_status": "Interested"
    }
    r_update = client.put(f"/leads/{lead_id}", json=update_payload)
    assert r_update.status_code == 200
    assert r_update.json()["lead"]["student_name"] == "Rohan Verma (Updated)"

    # 3. Get Lead Details
    r_get = client.get(f"/leads/{lead_id}")
    assert r_get.status_code == 200
    assert r_get.json()["student_name"] == "Rohan Verma (Updated)"

    # 4. Mark DNC & Verify Call Block
    r_dnc = client.post(f"/leads/{lead_id}/dnc")
    assert r_dnc.status_code == 200

    r_call_blocked = client.post("/calls/initiate", json={"lead_id": lead_id})
    assert r_call_blocked.status_code == 400

    # 5. Unmark DNC
    r_undnc = client.post(f"/leads/{lead_id}/undnc")
    assert r_undnc.status_code == 200

def test_campaigns_and_analytics():
    camp_payload = {
        "name": "Integration Test Campaign",
        "description": "Outbound test campaign",
        "course_interest": "Data Science & AI",
        "status": "Draft"
    }
    r_camp = client.post("/campaigns", json=camp_payload)
    assert r_camp.status_code == 200
    camp_id = r_camp.json()["campaign"]["id"]

    r_launch = client.post(f"/campaigns/{camp_id}/launch")
    assert r_launch.status_code == 200

    r_analytics = client.get("/analytics")
    assert r_analytics.status_code == 200

    r_report = client.get("/reports/leads/export")
    assert r_report.status_code == 200
    assert "Student Name" in r_report.text

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional
from backend.db.database import SessionLocal
from backend.db.models import Contact

router = APIRouter(prefix="/contacts", tags=["contacts"])

class ContactCreate(BaseModel):
    name: str
    phone: str
    email: Optional[str] = ""
    education: Optional[str] = "B.Tech"
    source: Optional[str] = "CSV Upload"
    campaign: Optional[str] = "B.Tech Outbound"

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.get("")
def get_contacts(db: SessionLocal = Depends(get_db)):
    contacts = db.query(Contact).all()
    result = []
    for c in contacts:
        result.append({
            "id": c.id,
            "name": c.name,
            "phone": c.phone,
            "email": f"{c.name.lower().replace(' ', '.')}@example.com",
            "education": "B.Tech CSE",
            "source": "Outbound Campaign",
            "status": "Ready",
            "created_at": c.created_at.strftime("%Y-%m-%d %H:%M") if c.created_at else ""
        })
    return result

@router.post("")
def create_contact(req: ContactCreate, db: SessionLocal = Depends(get_db)):
    new_contact = Contact(name=req.name, phone=req.phone)
    db.add(new_contact)
    db.commit()
    db.refresh(new_contact)
    return {"message": "Contact created successfully", "id": new_contact.id}
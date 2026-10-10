from backend.db.database import SessionLocal
from backend.db.models import Contact


def create_contact(name, phone):

    db = SessionLocal()

    contact = Contact(
        name=name,
        phone=str(phone)
    )

    db.add(contact)
    db.commit()
    db.refresh(contact)

    db.close()

    return contact


def get_contacts():

    db = SessionLocal()

    contacts = db.query(Contact).all()

    db.close()

    return contacts
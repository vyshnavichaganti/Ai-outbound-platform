import os
import logging
from pathlib import Path
from datetime import datetime
from typing import Optional, List
from fastapi import APIRouter, HTTPException, Depends, UploadFile, File
from pydantic import BaseModel
from sqlalchemy.orm import Session

from backend.db.database import SessionLocal
from backend.db.models import KnowledgeDocument, FAQItem
from backend.services.counselor_service import counselor_service

router = APIRouter(prefix="/knowledge", tags=["knowledge"])
logger = logging.getLogger(__name__)

UPLOAD_DIR = Path(__file__).resolve().parent.parent.parent / "data" / "uploads"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)


class FAQCreateSchema(BaseModel):
    question: str
    answer: str
    category: Optional[str] = "General"


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# ---------------------------------------------------------------------------
# Document Routes
# ---------------------------------------------------------------------------

@router.get("/documents")
def get_documents(db: Session = Depends(get_db)):
    docs = db.query(KnowledgeDocument).order_by(KnowledgeDocument.id.desc()).all()
    result = []
    for d in docs:
        result.append({
            "id": d.id,
            "filename": d.filename,
            "file_type": d.file_type,
            "file_size": d.file_size,
            "file_path": d.file_path,
            "content_summary": d.content_summary or "Uploaded knowledge document.",
            "created_at": d.created_at.strftime("%Y-%m-%d %H:%M") if d.created_at else ""
        })
    return result


@router.post("/documents/upload")
async def upload_document(file: UploadFile = File(...), db: Session = Depends(get_db)):
    filename = file.filename
    ext = os.path.splitext(filename)[1].lower().replace(".", "")
    if ext not in ["pdf", "txt", "md"]:
        raise HTTPException(status_code=400, detail="Only PDF, TXT, and Markdown files are supported.")

    file_path = UPLOAD_DIR / filename
    content = await file.read()
    file_size = len(content)

    with open(file_path, "wb") as f:
        f.write(content)

    # Simple text extraction for RAG indexing
    extracted_text = ""
    if ext in ["txt", "md"]:
        extracted_text = content.decode("utf-8", errors="ignore")
    elif ext == "pdf":
        try:
            import pypdf
            reader = pypdf.PdfReader(str(file_path))
            text_parts = [page.extract_text() or "" for page in reader.pages]
            extracted_text = "\n".join(text_parts)
        except Exception as e:
            logger.warning(f"PDF extraction fallback: {e}")
            extracted_text = f"PDF Document: {filename} ({file_size} bytes)"

    summary_preview = extracted_text[:250].strip() if extracted_text else f"Uploaded {filename}"

    doc = KnowledgeDocument(
        filename=filename,
        file_type=ext,
        file_path=str(file_path),
        file_size=file_size,
        content_summary=summary_preview,
        extracted_text=extracted_text,
        created_at=datetime.utcnow()
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)

    return {"message": f"Document '{filename}' uploaded and indexed for AI knowledge base.", "document": doc}


@router.delete("/documents/{doc_id}")
def delete_document(doc_id: int, db: Session = Depends(get_db)):
    doc = db.query(KnowledgeDocument).filter(KnowledgeDocument.id == doc_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    if doc.file_path and os.path.exists(doc.file_path):
        try:
            os.remove(doc.file_path)
        except Exception as e:
            logger.warning(f"Could not remove file: {e}")

    filename = doc.filename
    db.delete(doc)
    db.commit()
    return {"message": f"Document '{filename}' deleted successfully"}


# ---------------------------------------------------------------------------
# FAQ Routes
# ---------------------------------------------------------------------------

@router.get("/faqs")
def get_faqs(db: Session = Depends(get_db)):
    faqs = db.query(FAQItem).order_by(FAQItem.id.desc()).all()
    # If DB has no FAQs, fallback to json faqs
    if not faqs:
        base_faqs = counselor_service.get_faqs()
        for idx, f in enumerate(base_faqs):
            item = FAQItem(
                question=f.get("question", ""),
                answer=f.get("answer", ""),
                category=f.get("category", "General"),
                created_at=datetime.utcnow()
            )
            db.add(item)
        db.commit()
        faqs = db.query(FAQItem).all()

    result = []
    for f in faqs:
        result.append({
            "id": f.id,
            "question": f.question,
            "answer": f.answer,
            "category": f.category or "General",
            "created_at": f.created_at.strftime("%Y-%m-%d %H:%M") if f.created_at else ""
        })
    return result


@router.post("/faqs")
def create_faq(req: FAQCreateSchema, db: Session = Depends(get_db)):
    faq = FAQItem(
        question=req.question.strip(),
        answer=req.answer.strip(),
        category=req.category or "General",
        created_at=datetime.utcnow()
    )
    db.add(faq)
    db.commit()
    db.refresh(faq)
    return {"message": "FAQ created successfully", "faq": faq}


@router.delete("/faqs/{faq_id}")
def delete_faq(faq_id: int, db: Session = Depends(get_db)):
    faq = db.query(FAQItem).filter(FAQItem.id == faq_id).first()
    if not faq:
        raise HTTPException(status_code=404, detail="FAQ not found")

    db.delete(faq)
    db.commit()
    return {"message": "FAQ deleted successfully"}

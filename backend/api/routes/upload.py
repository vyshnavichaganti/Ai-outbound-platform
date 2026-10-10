from fastapi import APIRouter, UploadFile, File
import pandas as pd

from backend.services.contact_db_service import create_contact

router = APIRouter()


@router.post("/upload-leads")
async def upload_leads(file: UploadFile = File(...)):

    df = pd.read_csv(file.file)

    count = 0

    for _, row in df.iterrows():

        create_contact(
            row["name"],
            str(row["phone"])
        )

        count += 1

    return {
        "message": "Leads Uploaded",
        "count": count
    }
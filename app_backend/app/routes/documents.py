from fastapi import APIRouter, HTTPException, Depends, UploadFile, File
import httpx
from app.core.security import get_current_user
from app.db.supabase import get_supabase

router = APIRouter()

PIPELINE_URL = "http://localhost:8001"

@router.post("/upload")
async def upload_document(
    file: UploadFile = File(...), 
    user=Depends(get_current_user)
):
    supabase = get_supabase()
    
    # 1. Insert initial record in Supabase
    db_response = supabase.table("documents").insert({
        "user_id": user.id,
        "file_name": file.filename,
        "status": "processing"
    }).execute()
    
    if not db_response.data:
        raise HTTPException(status_code=500, detail="Failed to record document in database")
    
    doc_id = db_response.data[0]['id']
    
    # 2. Forward file to Student 1's Pipeline
    file_content = await file.read()
    try:
        async with httpx.AsyncClient() as client:
            files = {'file': (file.filename, file_content, file.content_type)}
            pipeline_response = await client.post(f"{PIPELINE_URL}/upload", files=files, timeout=30.0)
            
            if pipeline_response.status_code != 200:
                # Mark as failed
                supabase.table("documents").update({"status": "failed"}).eq("id", doc_id).execute()
                raise HTTPException(status_code=pipeline_response.status_code, detail="Pipeline failed to process the PDF")
            
            # Mark as ready
            supabase.table("documents").update({"status": "ready"}).eq("id", doc_id).execute()
            
            return {
                "status": "success", 
                "message": "Document uploaded and indexed successfully",
                "document_id": doc_id,
                "pipeline_response": pipeline_response.json()
            }
    except Exception as e:
        # Mark as failed
        supabase.table("documents").update({"status": "failed"}).eq("id", doc_id).execute()
        raise HTTPException(status_code=500, detail=f"Pipeline error: {str(e)}")

@router.get("/")
async def get_documents(user=Depends(get_current_user)):
    supabase = get_supabase()
    response = supabase.table("documents").select("*").eq("user_id", user.id).order("created_at", desc=True).execute()
    return {"documents": response.data}

from fastapi import APIRouter, HTTPException, Depends
import httpx
from app.core.security import get_current_user
from app.db.supabase import get_supabase
from app.models.chat import QuestionRequest

router = APIRouter()

TUTOR_URL = "http://localhost:8000"

@router.post("/ask")
async def ask_question(request: QuestionRequest, user=Depends(get_current_user)):
    supabase = get_supabase()
    
    # 1. Ensure Chat Session exists
    chat_session_id = request.chat_session_id
    if not chat_session_id:
        chat_res = supabase.table("chat_sessions").insert({
            "user_id": str(user.id),
            "title": request.content[:50] + "..." if len(request.content) > 50 else request.content
        }).execute()
        
        if not chat_res.data:
            raise HTTPException(status_code=500, detail="Could not create chat session")
        chat_session_id = chat_res.data[0]['id']
        
    # 2. Save User Message
    supabase.table("messages").insert({
        "chat_session_id": str(chat_session_id),
        "sender_type": "user",
        "content": request.content
    }).execute()
    
    # 3. Forward question to Student 2's Tutor Engine
    try:
        async with httpx.AsyncClient() as client:
            # We assume Student 2 has an endpoint shaped like { question: "str" }
            tutor_response = await client.post(
                f"{TUTOR_URL}/tutor", 
                json={"question": request.content},
                timeout=60.0 # LLMs can be slow
            )
            
            if tutor_response.status_code != 200:
                raise HTTPException(status_code=tutor_response.status_code, detail="Tutor Engine failed to respond.")
                
            response_data = tutor_response.json()
            tutor_answer = response_data.get("answer", "No answer found.")
            
            # Save Assistant Message
            supabase.table("messages").insert({
                "chat_session_id": str(chat_session_id),
                "sender_type": "assistant",
                "content": tutor_answer
            }).execute()
            
            return {
                "chat_session_id": chat_session_id,
                "answer": tutor_answer,
                "raw_tutor_response": response_data # Might include source chunks!
            }
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Tutor engine error: {str(e)}")

@router.get("/")
async def get_chats(user=Depends(get_current_user)):
    supabase = get_supabase()
    response = supabase.table("chat_sessions").select("*").eq("user_id", str(user.id)).order("created_at", desc=True).execute()
    return {"chats": response.data}

@router.get("/{session_id}/messages")
async def get_messages(session_id: str, user=Depends(get_current_user)):
    supabase = get_supabase()
    # Verify ownership
    chat_res = supabase.table("chat_sessions").select("*").eq("id", session_id).eq("user_id", str(user.id)).execute()
    if not chat_res.data:
        raise HTTPException(status_code=404, detail="Chat not found")
        
    messages_res = supabase.table("messages").select("*").eq("chat_session_id", session_id).order("created_at", asc=True).execute()
    return {"messages": messages_res.data}

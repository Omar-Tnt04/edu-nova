from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from uuid import UUID

class MessageResponse(BaseModel):
    id: UUID
    chat_session_id: UUID
    sender_type: str
    content: str
    created_at: datetime

class ChatSessionResponse(BaseModel):
    id: UUID
    user_id: UUID
    title: str
    created_at: datetime

class QuestionRequest(BaseModel):
    chat_session_id: Optional[UUID] = None
    content: str

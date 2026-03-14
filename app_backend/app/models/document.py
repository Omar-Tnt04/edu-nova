from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from uuid import UUID

class DocumentResponse(BaseBaseModel):
    id: UUID
    user_id: UUID
    file_name: str
    status: str
    created_at: datetime

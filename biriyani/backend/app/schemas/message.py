from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field
from app.schemas.document import DocumentOut


class MessageOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    conversation_id: str
    role: str
    content: str
    status: str
    created_at: datetime
    documents: list[DocumentOut] = []


class MessageCreate(BaseModel):
    content: str = Field(min_length=1, max_length=8000)
    document_ids: list[str] = []

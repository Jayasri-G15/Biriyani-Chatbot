from datetime import datetime
from pydantic import BaseModel, ConfigDict


class DocumentOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    conversation_id: str
    message_id: str | None = None
    filename: str
    file_type: str
    file_size: int
    created_at: datetime

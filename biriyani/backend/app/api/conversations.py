from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.conversation import ConversationOut, ConversationUpdate
from app.services import conversation_service

router = APIRouter(prefix="/api/v1/conversations", tags=["conversations"])


def _get_or_404(db: Session, conversation_id: str):
    conversation = conversation_service.get_conversation(db, conversation_id)
    if conversation is None:
        raise HTTPException(
            status_code=404,
            detail={"error": {"code": "CONVERSATION_NOT_FOUND", "message": "Conversation not found"}},
        )
    return conversation


@router.post("", response_model=ConversationOut, status_code=201)
def create_conversation(db: Session = Depends(get_db)):
    return conversation_service.create_conversation(db)


@router.get("", response_model=list[ConversationOut])
def list_conversations(db: Session = Depends(get_db)):
    return conversation_service.list_conversations(db)


@router.get("/{conversation_id}", response_model=ConversationOut)
def get_conversation(conversation_id: str, db: Session = Depends(get_db)):
    return _get_or_404(db, conversation_id)


@router.patch("/{conversation_id}", response_model=ConversationOut)
def update_conversation(conversation_id: str, payload: ConversationUpdate, db: Session = Depends(get_db)):
    conversation = _get_or_404(db, conversation_id)
    if payload.title is not None:
        conversation = conversation_service.update_conversation_title(db, conversation, payload.title)
    return conversation


@router.delete("/{conversation_id}", status_code=204)
def delete_conversation(conversation_id: str, db: Session = Depends(get_db)):
    conversation = _get_or_404(db, conversation_id)
    conversation_service.delete_conversation(db, conversation)

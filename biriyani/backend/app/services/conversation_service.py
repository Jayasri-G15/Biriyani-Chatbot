from sqlalchemy.orm import Session

from app.models.conversation import Conversation
from app.models.message import Message
from app.models.document import Document


def make_title(first_message: str) -> str:
    title = " ".join(first_message.strip().split())
    return title[:60] + ("…" if len(title) > 60 else "")


def create_conversation(db: Session) -> Conversation:
    conversation = Conversation()
    db.add(conversation)
    db.commit()
    db.refresh(conversation)
    return conversation


def get_conversation(db: Session, conversation_id: str) -> Conversation | None:
    return db.get(Conversation, conversation_id)


def list_conversations(db: Session) -> list[Conversation]:
    return db.query(Conversation).order_by(Conversation.updated_at.desc()).all()


def delete_conversation(db: Session, conversation: Conversation) -> None:
    db.delete(conversation)
    db.commit()


def update_conversation_title(db: Session, conversation: Conversation, title: str) -> Conversation:
    conversation.title = title
    db.commit()
    db.refresh(conversation)
    return conversation


def add_message(
    db: Session,
    conversation: Conversation,
    role: str,
    content: str,
    status: str = "complete",
    document_ids: list[str] | None = None,
) -> Message:
    message = Message(conversation_id=conversation.id, role=role, content=content, status=status)
    db.add(message)
    db.flush()

    if document_ids:
        db.query(Document).filter(
            Document.id.in_(document_ids),
            Document.conversation_id == conversation.id,
        ).update({Document.message_id: message.id}, synchronize_session=False)

    if role == "user" and conversation.title == "New chat":
        conversation.title = make_title(content)

    db.commit()
    db.refresh(message)
    db.refresh(conversation)
    return message


def get_history(db: Session, conversation: Conversation) -> list[dict[str, str]]:
    return [
        {"role": m.role, "content": m.content}
        for m in conversation.messages
        if m.status == "complete"
    ]

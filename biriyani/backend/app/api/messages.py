import json

from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import JSONResponse, StreamingResponse
from sqlalchemy.orm import Session

from app.core.database import SessionLocal, get_db
from app.schemas.message import MessageCreate, MessageOut
from app.services import conversation_service
from app.services.guardrail_service import REFUSAL_MESSAGE, check_input
from app.services.llm_service import LLMServiceError, stream_reply
from app.services.rate_limit_service import RateLimitExceeded, check_rate_limit

router = APIRouter(tags=["messages"])


def _get_conversation_or_404(db: Session, conversation_id: str):
    conversation = conversation_service.get_conversation(db, conversation_id)
    if conversation is None:
        raise HTTPException(
            status_code=404,
            detail={"error": {"code": "CONVERSATION_NOT_FOUND", "message": "Conversation not found"}},
        )
    return conversation


@router.get("/api/v1/conversations/{conversation_id}/messages", response_model=list[MessageOut])
def list_messages(conversation_id: str, db: Session = Depends(get_db)):
    conversation = _get_conversation_or_404(db, conversation_id)
    return conversation.messages


def _sse(event: dict) -> str:
    return f"data: {json.dumps(event)}\n\n"


@router.post("/api/v1/conversations/{conversation_id}/messages")
async def send_message(
    conversation_id: str, payload: MessageCreate, request: Request, db: Session = Depends(get_db)
):
    client_key = request.client.host if request.client else "unknown"
    try:
        check_rate_limit(client_key)
    except RateLimitExceeded as exc:
        return JSONResponse(
            status_code=429,
            headers={"Retry-After": str(exc.retry_after)},
            content={
                "error": {
                    "code": "RATE_LIMITED",
                    "message": f"Too many messages sent — please wait {exc.retry_after}s and try again.",
                }
            },
        )

    conversation = _get_conversation_or_404(db, conversation_id)
    conversation_service.add_message(db, conversation, "user", payload.content, document_ids=payload.document_ids)

    content = payload.content

    async def event_stream():
        # A fresh session is opened here (rather than reusing the request-scoped
        # dependency) because StreamingResponse keeps this generator running after
        # FastAPI tears down the Depends(get_db) session.
        stream_db = SessionLocal()
        try:
            stream_conversation = conversation_service.get_conversation(stream_db, conversation_id)

            if check_input(content):
                conversation_service.add_message(stream_db, stream_conversation, "assistant", REFUSAL_MESSAGE)
                yield _sse({"type": "delta", "content": REFUSAL_MESSAGE})
                yield _sse({"type": "done"})
                return

            history = conversation_service.get_history(stream_db, stream_conversation)
            document_texts = [
                f"--- Document: {doc.filename} ---\n{doc.extracted_text}"
                for doc in stream_conversation.documents
                if doc.extracted_text
            ]
            collected = ""
            try:
                async for delta in stream_reply(history, documents_context=document_texts):
                    collected += delta
                    yield _sse({"type": "delta", "content": delta})
            except LLMServiceError as exc:

                if collected:
                    conversation_service.add_message(stream_db, stream_conversation, "assistant", collected)
                yield _sse({"type": "error", "message": str(exc)})
                return

            conversation_service.add_message(stream_db, stream_conversation, "assistant", collected)
            yield _sse({"type": "done"})
        finally:
            stream_db.close()

    return StreamingResponse(event_stream(), media_type="text/event-stream")

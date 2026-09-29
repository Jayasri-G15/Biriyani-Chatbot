from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.document import DocumentOut
from app.services import conversation_service, document_service
from app.services.document_service import DocumentProcessingError

router = APIRouter(prefix="/api/v1/conversations", tags=["documents"])


def _get_conversation_or_404(db: Session, conversation_id: str):
    conversation = conversation_service.get_conversation(db, conversation_id)
    if conversation is None:
        raise HTTPException(
            status_code=404,
            detail={"error": {"code": "CONVERSATION_NOT_FOUND", "message": "Conversation not found"}},
        )
    return conversation


@router.post("/{conversation_id}/documents", response_model=DocumentOut, status_code=201)
async def upload_document(
    conversation_id: str,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    conversation = _get_conversation_or_404(db, conversation_id)

    if not file.filename:
        raise HTTPException(
            status_code=400,
            detail={"error": {"code": "EMPTY_FILENAME", "message": "Uploaded file must have a filename."}},
        )

    try:
        content = await file.read()
        file_type, text = document_service.extract_text_from_file(file.filename, content)
    except DocumentProcessingError as exc:
        raise HTTPException(
            status_code=400,
            detail={"error": {"code": exc.code, "message": exc.message}},
        ) from exc
    except Exception as exc:
        raise HTTPException(
            status_code=400,
            detail={"error": {"code": "FILE_READ_ERROR", "message": f"Could not read uploaded file: {str(exc)}"}},
        ) from exc

    doc = document_service.save_document(
        db=db,
        conversation=conversation,
        filename=file.filename,
        file_type=file_type,
        file_size=len(content),
        extracted_text=text,
    )
    return doc


@router.get("/{conversation_id}/documents", response_model=list[DocumentOut])
def list_documents(conversation_id: str, db: Session = Depends(get_db)):
    _get_conversation_or_404(db, conversation_id)
    return document_service.get_conversation_documents(db, conversation_id)


@router.delete("/{conversation_id}/documents/{document_id}", status_code=204)
def delete_document(conversation_id: str, document_id: str, db: Session = Depends(get_db)):
    _get_conversation_or_404(db, conversation_id)
    doc = document_service.get_document(db, document_id)
    if not doc or doc.conversation_id != conversation_id:
        raise HTTPException(
            status_code=404,
            detail={"error": {"code": "DOCUMENT_NOT_FOUND", "message": "Document not found"}},
        )
    document_service.delete_document(db, doc)

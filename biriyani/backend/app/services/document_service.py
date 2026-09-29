import io
import pypdf
import docx
from sqlalchemy.orm import Session

from app.models.conversation import Conversation
from app.models.document import Document

MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB limit


class DocumentProcessingError(Exception):
    def __init__(self, code: str, message: str):
        self.code = code
        self.message = message


def extract_text_from_file(filename: str, content: bytes) -> tuple[str, str]:
    if len(content) > MAX_FILE_SIZE:
        raise DocumentProcessingError(
            "FILE_TOO_LARGE", f"File size exceeds maximum allowed limit of {MAX_FILE_SIZE // (1024 * 1024)}MB."
        )

    ext = filename.lower().split(".")[-1] if "." in filename else ""

    if ext == "pdf":
        file_type = "pdf"
        try:
            reader = pypdf.PdfReader(io.BytesIO(content))
            extracted_pages = []
            for page in reader.pages:
                txt = page.extract_text()
                if txt:
                    extracted_pages.append(txt)
            text = "\n".join(extracted_pages).strip()
        except Exception as e:
            raise DocumentProcessingError(
                "PDF_EXTRACTION_FAILED", f"Could not extract text from PDF document: {str(e)}"
            ) from e

    elif ext in ("docx", "doc"):
        file_type = "docx"
        try:
            doc = docx.Document(io.BytesIO(content))
            paragraphs = [p.text for p in doc.paragraphs if p.text.strip()]
            text = "\n".join(paragraphs).strip()
        except Exception as e:
            raise DocumentProcessingError(
                "DOCX_EXTRACTION_FAILED", f"Could not extract text from DOCX document: {str(e)}"
            ) from e

    elif ext in ("txt", "text", "md"):
        file_type = "txt"
        try:
            text = content.decode("utf-8")
        except UnicodeDecodeError:
            text = content.decode("latin-1", errors="ignore")
        text = text.strip()

    else:
        raise DocumentProcessingError(
            "UNSUPPORTED_FILE_TYPE", "Only PDF, DOCX, and TXT files are supported."
        )

    return file_type, text


def save_document(
    db: Session,
    conversation: Conversation,
    filename: str,
    file_type: str,
    file_size: int,
    extracted_text: str,
) -> Document:
    doc = Document(
        conversation_id=conversation.id,
        filename=filename,
        file_type=file_type,
        file_size=file_size,
        extracted_text=extracted_text,
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)
    return doc


def get_conversation_documents(db: Session, conversation_id: str) -> list[Document]:
    return (
        db.query(Document)
        .filter(Document.conversation_id == conversation_id)
        .order_by(Document.created_at.asc())
        .all()
    )


def get_document(db: Session, document_id: str) -> Document | None:
    return db.get(Document, document_id)


def delete_document(db: Session, document: Document) -> None:
    db.delete(document)
    db.commit()

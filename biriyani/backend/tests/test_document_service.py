import pytest
from app.services.document_service import extract_text_from_file, DocumentProcessingError, save_document, get_conversation_documents
from app.services.conversation_service import create_conversation


def test_extract_txt():
    file_type, text = extract_text_from_file("test.txt", b"Hello World")
    assert file_type == "txt"
    assert text == "Hello World"


def test_extract_unsupported():
    with pytest.raises(DocumentProcessingError) as exc_info:
        extract_text_from_file("image.png", b"fake binary content")
    assert exc_info.value.code == "UNSUPPORTED_FILE_TYPE"


def test_extract_file_too_large():
    large_content = b"x" * (11 * 1024 * 1024)
    with pytest.raises(DocumentProcessingError) as exc_info:
        extract_text_from_file("large.txt", large_content)
    assert exc_info.value.code == "FILE_TOO_LARGE"


def test_save_and_get_document(db_session):
    conv = create_conversation(db_session)
    doc = save_document(db_session, conv, "notes.txt", "txt", 12, "Sample text content")

    assert doc.id is not None
    assert doc.conversation_id == conv.id
    assert doc.filename == "notes.txt"

    docs = get_conversation_documents(db_session, conv.id)
    assert len(docs) == 1
    assert docs[0].filename == "notes.txt"

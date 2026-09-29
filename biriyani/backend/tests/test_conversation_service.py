from app.services import conversation_service


def test_create_and_list_conversations(db_session):
    conversation_service.create_conversation(db_session)
    conversation_service.create_conversation(db_session)
    assert len(conversation_service.list_conversations(db_session)) == 2


def test_first_user_message_becomes_title(db_session):
    conversation = conversation_service.create_conversation(db_session)
    conversation_service.add_message(db_session, conversation, "user", "What's the weather like today?")
    assert conversation.title == "What's the weather like today?"


def test_delete_conversation_removes_messages(db_session):
    conversation = conversation_service.create_conversation(db_session)
    conversation_service.add_message(db_session, conversation, "user", "hello")
    conversation_service.add_message(db_session, conversation, "assistant", "hi there")
    conversation_id = conversation.id

    conversation_service.delete_conversation(db_session, conversation)

    assert conversation_service.get_conversation(db_session, conversation_id) is None


def test_rename_persists(db_session):
    conversation = conversation_service.create_conversation(db_session)
    conversation_service.update_conversation_title(db_session, conversation, "Renamed chat")
    fetched = conversation_service.get_conversation(db_session, conversation.id)
    assert fetched.title == "Renamed chat"


def test_history_excludes_error_messages(db_session):
    conversation = conversation_service.create_conversation(db_session)
    conversation_service.add_message(db_session, conversation, "user", "hi")
    conversation_service.add_message(db_session, conversation, "assistant", "broken", status="error")
    history = conversation_service.get_history(db_session, conversation)
    assert len(history) == 1
    assert history[0]["role"] == "user"

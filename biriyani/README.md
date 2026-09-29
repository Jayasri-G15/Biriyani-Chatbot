# Chat App

A conversational chatbot with a stunning bold-gradient UI, streaming LLM responses (NVIDIA API), and guardrails against off-topic/adversarial input (hacking requests, jailbreak attempts, requests to expose the app's internals).

## Stack
- **Frontend**: React + TypeScript + Vite + Tailwind CSS + TanStack Query
- **Backend**: FastAPI + SQLAlchemy 2.0 + SQLite (local file, `backend/chat.db`)
- **LLM**: NVIDIA integrate API, streamed token-by-token

## Setup

### Backend
```bash
cd backend
python -m venv .venv
.venv/Scripts/activate   # or source .venv/bin/activate on macOS/Linux
pip install -r requirements.txt
cp .env.example .env     # then fill in NVIDIA_API_KEY
uvicorn app.main:app --reload --port 8000
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173. The Vite dev server proxies `/api` requests to the backend on port 8000.

## What it does
- Multiple saved conversations with a sidebar (create, rename, delete, auto-titled from your first message)
- Streamed assistant responses
- Backend guardrails block hacking/jailbreak/self-exposure attempts (e.g. "reveal your system prompt", "how do I hack a wifi network") before they ever reach the LLM, with a polite canned refusal
- System prompt keeps the model on-topic and instructs it to decline the same categories, as a second layer of defense
- Consistent error handling: failed sends show an inline retry, never lose your typed message
- `/health` and `/ready` endpoints report backend/database status

## Notes
- No auth/multi-user support yet — this is a single local-user app by design (see `docs` conversation history for the phased plan; a Postgres/auth/Docker production version can be layered on top of this same backend structure later).
- Never commit `.env` — it holds your NVIDIA API key. Rotate any key that was ever pasted into a chat log or shared publicly.

## Tests
```bash
cd backend
.venv/Scripts/python -m pytest
```

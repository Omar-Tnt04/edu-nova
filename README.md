# EduNova Codebase Status (March 2026)

EduNova is a multi-service EdTech monorepo with four active runtime components:

- Frontend (Next.js, port 3000)
- Tutor Engine (FastAPI, port 8000)
- Retrieval Pipeline (FastAPI, port 8001)
- App Backend / Auth and User Data API (FastAPI, port 8002)

The platform supports PDF-grounded tutoring, quiz and flashcard generation, concept explanations, and Supabase-backed user flows.

## Platform Concept

EduNova is designed as a grounded learning copilot, not a generic chatbot.

The core idea is simple: students should be able to study from their own course material and receive answers that stay anchored to those sources. Instead of producing confident but unverified responses, the platform prioritizes traceability, learning progression, and study reinforcement.

### Learning Philosophy

- Retrieval-first tutoring: the model responds using indexed chunks from uploaded PDFs.
- Pedagogical scaffolding: students can move through staged help (`guide` -> `hint1` -> `hint2` -> `answer`) rather than jumping directly to final answers.
- Active recall by design: quiz and flashcard tools convert source material into practice artifacts.
- Concept clarity over verbosity: concept explanations target understanding while still showing where information came from.

### Product Experience Goal

The platform aims to replicate the flow of a strong human tutor:

1. Understand what the learner is asking.
2. Use the learner's actual materials as the basis for explanation.
3. Adjust response depth by learner level (`beginner`, `intermediate`, `exam`).
4. Help the learner practice, not just consume explanations.
5. Track progression signals (questions asked, hint usage, answer exposure, topic mastery trend).

### Why the Architecture Looks This Way

- The Pipeline service isolates ingestion and retrieval, so source grounding can evolve independently.
- The Tutor Engine owns pedagogy logic, generation style, study tools, and progress signals.
- The App Backend handles identity, persistence, and user-scoped workflows through Supabase.
- The Frontend orchestrates all of this into a single student journey.

This separation keeps responsibilities clear and makes the system easier to scale, test, and improve iteratively.

## 1) Repository Layout

```
edu-nova/
  app_backend/        # User auth + documents/chats API (Supabase + forwarding)
  frontend/           # Next.js application (student UI + tool panels)
  pipeline/           # PDF ingestion + chunking + embeddings + retrieval
  tutor_engine/       # Grounded tutor + study tools + progress/session state
  data/               # Runtime data used by pipeline (uploads/state/chroma)
```

## 2) What Each Service Does

### Frontend (frontend, port 3000)

- Tech: Next.js 16, React 19, TypeScript, Tailwind 4, Framer Motion.
- Main pages include landing, login/signup/verify, dashboard, and chat.
- Uses a shared API client with three base URLs:
  - `NEXT_PUBLIC_TUTOR_URL` (default `http://127.0.0.1:8000`)
  - `NEXT_PUBLIC_PIPELINE_URL` (default `http://127.0.0.1:8001`)
  - `NEXT_PUBLIC_API_URL` (default `http://127.0.0.1:8002`)
- Includes backend health checks in UI for Pipeline and Tutor services.

### Tutor Engine (tutor_engine, port 8000)

- Provides grounded tutoring and study tools.
- Endpoints:
  - `GET /health`
  - `POST /tutor`
  - `POST /quiz`
  - `POST /flashcards`
  - `POST /concept/explain`
  - `GET /progress`
- Core behavior:
  - Stage-based tutoring: `guide`, `hint1`, `hint2`, `answer`
  - Difficulty levels: `beginner`, `intermediate`, `exam`
  - Retrieval-backed responses with source metadata (`file`, `page`, `chunk_id`, `score`)
  - Session memory persisted locally by `session_id`
  - Progress tracking persisted locally
- Integration detail:
  - Retrieval client first tries `/retrieve`, then falls back to pipeline `/query` for compatibility.
  - Ollama defaults to model `qwen2.5:3b`.

### Retrieval Pipeline (pipeline, port 8001)

- Responsible for document ingestion and retrieval.
- Endpoints:
  - `GET /health`
  - `GET /status`
  - `POST /upload`
  - `POST /query`
- Ingestion flow:
  - Save uploaded PDF
  - Extract page text
  - Chunk content
  - Create local embeddings (token-hash vectorization)
  - Upsert into local vector index
- Storage:
  - Active document marker in `pipeline/data/state/latest_document.json`
  - Vector index in `pipeline/data/state/vector_index.json`
- Retrieval scope:
  - Defaults to `latest_only=true`, which limits search to the latest uploaded document in current state.

### App Backend (app_backend, port 8002)

- User-facing API layer for auth, document metadata, and chats.
- Routers:
  - `/auth` (signup, login, email verification, Google OAuth URL)
  - `/documents` (upload forwarding to pipeline + document listing)
  - `/chats` (chat session/message persistence + forwarding to tutor)
- Relies on Supabase for:
  - Auth token validation
  - Data tables (documents, chat_sessions, messages)

## 3) End-to-End Data Flow

1. User uploads PDF from frontend.
2. App Backend records document row in Supabase.
3. App Backend forwards the PDF to Pipeline `/upload`.
4. Pipeline indexes chunks and updates active/latest document state.
5. User asks question from frontend chat/tools.
6. Tutor Engine retrieves relevant chunks from Pipeline.
7. Tutor Engine prompts Ollama and returns grounded output with sources.
8. App Backend and Tutor Engine update chat/progress/session state where applicable.

## 4) Runtime Contracts (Current)

### Tutor request

```json
{
  "question": "What is photosynthesis?",
  "stage": "guide",
  "topic": "biology",
  "difficulty": "beginner",
  "session_id": "demo-session-1"
}
```

### Tutor response

```json
{
  "response": "...",
  "sources": [
    {
      "file": "chapter1.pdf",
      "page": 3,
      "chunk_id": "...",
      "score": 0.92
    }
  ],
  "session_id": "demo-session-1",
  "stage": "guide",
  "topic": "biology",
  "difficulty": "beginner",
  "grounded": true
}
```

### Pipeline query request

```json
{
  "text": "Explain ATP synthesis",
  "top_k": 5,
  "latest_only": true
}
```

## 5) Environment Variables

### app_backend

- `SUPABASE_URL`
- `SUPABASE_KEY`

### tutor_engine (optional overrides)

- `DOCUMENT_SERVICE_URL` (default `http://127.0.0.1:8001`)
- `DOCUMENT_SERVICE_TIMEOUT` (default `10` seconds)
- `OLLAMA_BASE_URL` (default `http://127.0.0.1:11434`)
- `OLLAMA_MODEL` (default `qwen2.5:3b`)
- `OLLAMA_TIMEOUT` (default `60` seconds)

### frontend

- `NEXT_PUBLIC_TUTOR_URL`
- `NEXT_PUBLIC_PIPELINE_URL`
- `NEXT_PUBLIC_API_URL`

## 6) Local Run (Windows)

These commands reflect the current codebase and were validated in this workspace.

### 1. Python environment and packages

```powershell
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install --upgrade pip
.\.venv\Scripts\python.exe -m pip install fastapi uvicorn requests httpx pydantic python-dotenv supabase
```

### 2. Start Tutor Engine (8000)

```powershell
.\.venv\Scripts\python.exe -m uvicorn tutor_engine.main:app --host 127.0.0.1 --port 8000
```

### 3. Start Pipeline (8001)

```powershell
cd pipeline
..\.venv\Scripts\python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 8001
```

### 4. Start App Backend (8002)

```powershell
cd app_backend
..\.venv\Scripts\python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 8002
```

### 5. Start Frontend (3000)

```powershell
cd frontend
npm install
npm run dev
```

### 6. Optional: start Ollama

```powershell
ollama serve
ollama pull qwen2.5:3b
```

## 7) API Quick Links

- Tutor docs: http://127.0.0.1:8000/docs
- Pipeline docs: http://127.0.0.1:8001/docs
- App backend root: http://127.0.0.1:8002/
- Frontend: http://127.0.0.1:3000

## 8) Current Notes and Known Integration Edges

- Tutor-to-pipeline retrieval compatibility is implemented (fallback from `/retrieve` to `/query`).
- Pipeline defaults to latest-document retrieval to reduce stale cross-document responses.
- App backend chat route currently expects an `answer` key from tutor responses, while Tutor Engine returns `response` as the primary text field.
- Supabase credentials are required for auth/documents/chats routes in app_backend.

## 9) Current Maturity Snapshot

The repository is beyond a single MVP backend and now acts as a full local development stack with:

- a modern frontend experience,
- a dedicated API gateway/backend for user data,
- a standalone retrieval service,
- and a tutoring engine with study tooling and progress tracking.

Most functionality is runnable locally; the remaining production-hardening work is primarily around packaging dependencies, standardizing response contracts between services, and adding automated integration tests.

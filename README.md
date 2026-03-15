# EduNova

## Project Overview

EduNova is a multi-service educational platform that provides grounded tutoring over user-uploaded course documents.

The project uses a Retrieval-Augmented Generation (RAG) architecture:

1. Course PDFs are ingested and indexed by the Retrieval Pipeline.
2. Relevant chunks are retrieved for each learner question.
3. The Tutor Engine generates a response constrained by retrieved context.
4. The response includes source references so answers remain inspectable.

This design reduces ungrounded responses and supports reproducible learning interactions.

## Key Features

- Grounded tutoring with source references (`file`, `page`, `chunk_id`, `score`).
- Staged pedagogical flow: `guide`, `hint1`, `hint2`, `answer`.
- Difficulty modes: `beginner`, `intermediate`, `exam`.
- Study tools: quiz generation, flashcard generation, concept explanation.
- Session memory and progress tracking for longitudinal learner context.
- Supabase-backed authentication and user data persistence.

## System Architecture

EduNova is split into four services with clear responsibilities:

- Frontend (`Next.js`, port `3000`): user interface and orchestration.
- Tutor Engine (`FastAPI`, port `8000`): tutoring logic and generation workflows.
- Retrieval Pipeline (`FastAPI`, port `8001`): ingestion, indexing, and retrieval.
- App Backend (`FastAPI`, port `8002`): auth, document metadata, and chat persistence.

### Grounded Tutoring and RAG Behavior

The tutoring path is retrieval-first. For each question, the Tutor Engine obtains relevant chunks from the Retrieval Pipeline and builds prompts from those chunks.

- If retrieval returns relevant context, tutoring and study-tool outputs are grounded and cite sources.
- The pipeline supports scoped retrieval using `document_id`, `filename`, and `latest_only`.
- By default, `latest_only=true` reduces cross-document contamination during local development and demos.

## Repository Structure

```text
edu-nova/
  app_backend/      # Auth and user-facing API (Supabase integration)
  frontend/         # Next.js client application
  pipeline/         # PDF ingestion, chunking, embeddings, retrieval
  tutor_engine/     # Tutoring workflows, study tools, progress tracking
  data/             # Runtime data (uploads, state, local vector files)
```

## Services Description

### Frontend (port 3000)

- Stack: Next.js 16, React 19, TypeScript, Tailwind 4.
- Implements landing, authentication, dashboard, and chat/tool pages.
- Uses environment-configurable backend base URLs.

### Tutor Engine (port 8000)

- Endpoints: `GET /health`, `POST /tutor`, `POST /quiz`, `POST /flashcards`, `POST /concept/explain`, `GET /progress`.
- Manages tutoring stages, difficulty-aware responses, and study-tool generation.
- Stores session memory and progress summaries locally.
- Calls Ollama for generation and Pipeline for retrieval.

### Retrieval Pipeline (port 8001)

- Endpoints: `GET /health`, `GET /status`, `POST /upload`, `POST /query`.
- Ingestion workflow: PDF save -> text extraction -> chunking -> embedding -> vector index upsert.
- Maintains active document state in `pipeline/data/state/latest_document.json`.

### App Backend (port 8002)

- Endpoints grouped under routers: `/auth`, `/documents`, `/chats`.
- Integrates Supabase authentication and data tables.
- Forwards uploads to the Pipeline and chat queries to the Tutor Engine.

## Data Flow

1. User uploads a PDF from the frontend.
2. App Backend creates document metadata in Supabase.
3. App Backend forwards the file to Pipeline `/upload`.
4. Pipeline indexes chunks and updates active document state.
5. User asks a question in chat or study tools.
6. Tutor Engine retrieves relevant chunks from Pipeline.
7. Tutor Engine generates a grounded response through Ollama.
8. Frontend displays response content and source metadata.
9. Progress and session artifacts are updated for later analysis.

## API Contracts (example request/response)

### Tutor API

Request (`POST /tutor`):

```json
{
  "question": "What is photosynthesis?",
  "stage": "guide",
  "topic": "biology",
  "difficulty": "beginner",
  "session_id": "demo-session-1"
}
```

Response:

```json
{
  "response": "...",
  "sources": [
    {
      "file": "chapter1.pdf",
      "page": 3,
      "chunk_id": "abc123_p3_c2",
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

### Pipeline Query API

Request (`POST /query`):

```json
{
  "text": "Explain ATP synthesis",
  "top_k": 5,
  "latest_only": true
}
```

Response shape:

```json
{
  "results": [
    {
      "id": "...",
      "score": 0.81,
      "text": "...",
      "metadata": {
        "filename": "...",
        "page": 12,
        "document_id": "...",
        "chunk_index": 4
      }
    }
  ]
}
```

## Environment Variables

### Frontend

- `NEXT_PUBLIC_TUTOR_URL` (default: `http://127.0.0.1:8000`)
- `NEXT_PUBLIC_PIPELINE_URL` (default: `http://127.0.0.1:8001`)
- `NEXT_PUBLIC_API_URL` (default: `http://127.0.0.1:8002`)

### Tutor Engine

- `DOCUMENT_SERVICE_URL` (default: `http://127.0.0.1:8001`)
- `DOCUMENT_SERVICE_TIMEOUT` (default: `10`)
- `OLLAMA_BASE_URL` (default: `http://127.0.0.1:11434`)
- `OLLAMA_MODEL` (default: `qwen2.5:3b`)
- `OLLAMA_TIMEOUT` (default: `60`)

### App Backend

- `SUPABASE_URL`
- `SUPABASE_KEY`

## Local Development Setup

### Prerequisites

- Python 3.12+
- Node.js 20+
- npm
- Ollama (optional but recommended for full tutor generation)

### Python Environment

```powershell
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install --upgrade pip
.\.venv\Scripts\python.exe -m pip install fastapi uvicorn requests httpx pydantic python-dotenv supabase
```

### Frontend Dependencies

```powershell
cd frontend
npm install
cd ..
```

## Running the Services

Start each service in a separate terminal.

### 1) Retrieval Pipeline (8001)

```powershell
cd pipeline
..\.venv\Scripts\python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 8001
```

### 2) Tutor Engine (8000)

```powershell
cd ..
.\.venv\Scripts\python.exe -m uvicorn tutor_engine.main:app --host 127.0.0.1 --port 8000
```

### 3) App Backend (8002)

```powershell
cd app_backend
..\.venv\Scripts\python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 8002
```

### 4) Frontend (3000)

```powershell
cd frontend
npm run dev
```

### 5) Optional: Ollama

```powershell
ollama serve
ollama pull qwen2.5:3b
```

### Health Endpoints

- Tutor Engine: `http://127.0.0.1:8000/health`
- Retrieval Pipeline: `http://127.0.0.1:8001/health`
- App Backend: `http://127.0.0.1:8002/`
- Frontend: `http://127.0.0.1:3000`

## Project Status / Roadmap

### Current Status

- Core RAG tutoring workflow is implemented and runnable locally.
- Study tools (quiz, flashcards, concept explanation) are integrated.
- Frontend, retrieval, tutoring, and auth/data layers are separated by service.

### Known Integration Notes

- Retrieval client supports compatibility fallback from `/retrieve` to `/query`.
- App Backend chat integration currently expects `answer` while Tutor Engine returns `response`; contract alignment is pending.
- Supabase credentials are required for authenticated backend routes.

### Roadmap

- Standardize response contracts across all services.
- Add end-to-end integration and regression tests.
- Improve packaging of Python dependencies with locked requirements.
- Expand observability (structured logs, request tracing, service health diagnostics).

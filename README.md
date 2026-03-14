# EduNova (Hackathon MVP)

EduNova is a local-first EdTech backend that turns uploaded course PDFs into grounded tutoring and study tools.

This repository currently contains:

- A Retrieval Pipeline (FastAPI, port 8001)
- A Tutor Engine (FastAPI, port 8000)
- Local LLM integration via Ollama + Qwen2.5:3B
- No external paid APIs

## What We Have Built So Far

## Core Architecture

### 1) Retrieval Pipeline (port 8001)

- Uploads and indexes PDFs
- Extracts text with PyMuPDF
- Chunks text into smaller passages
- Embeds chunks
- Stores vectors in ChromaDB
- Retrieves top relevant chunks

### 2) Tutor Engine (port 8000)

- Calls retrieval service for grounded context
- Generates stage-based tutoring responses
- Supports difficulty modes
- Returns answer + source metadata

## Implemented Features

### Stage-based tutoring (guide, hint1, hint2, answer)

- guide: broad Socratic prompt
- hint1: targeted clue
- hint2: stronger clue with partial explanation
- answer: direct final explanation

### Difficulty mode

- beginner
- intermediate
- exam

### Better source output

Responses now include frontend-friendly source metadata:

- file
- page
- chunk_id
- score

### Retrieval scoping to latest uploaded material

By default, retrieval now targets the latest uploaded document (to avoid mixing old PDFs in demo scenarios).

### Follow-up support (lightweight session memory)

- Session-aware context using session_id
- Stores recent turns locally
- Uses recent context in tutor prompting

### Learning progress tracker

Tracks locally:

- asked questions
- stage sequence
- hints used before answer
- topic
- difficulty
- grounded flag
- simple topic mastery score

### Automatic quiz generation

- Endpoint returns MCQs in clean JSON
- Grounded on retrieved content
- Includes fallback generation if LLM JSON output is not usable

### Flashcard generation

- Endpoint returns front/back pairs in clean JSON
- Grounded on retrieved content
- Includes fallback generation when needed

### Concept explainer

- Explains a concept with retrieval grounding
- Supports beginner_mode
- Returns explanation + sources

## API Endpoints (Current)

### Pipeline service (8001)

- GET /health
- POST /upload
- POST /query

Notes for /query body:

- text: string (required)
- top_k: int (default 5)
- document_id: optional
- filename: optional
- latest_only: bool (default true)

### Tutor engine (8000)

- GET /health
- POST /tutor
- POST /quiz
- POST /flashcards
- POST /concept/explain
- GET /progress

## Request/Response Contracts (Main)

### Tutor request

{
  "question": "...",
  "stage": "guide|hint1|hint2|answer",
  "topic": "...",
  "difficulty": "beginner|intermediate|exam",
  "session_id": "..."
}

### Tutor response (shape)

{
  "response": "...",
  "sources": [
    {
      "file": "...",
      "page": 1,
      "chunk_id": "...",
      "score": 0.123
    }
  ],
  "session_id": "...",
  "stage": "guide",
  "topic": "...",
  "difficulty": "beginner",
  "grounded": true
}

## Local Run Instructions (Windows)

## 1) Install dependencies

At repository root:

- .venv\Scripts\python.exe -m pip install -r requirements.txt
- .venv\Scripts\python.exe -m pip install -r pipeline/requirements.txt

## 2) Start Pipeline

- cd pipeline
- ..\.venv\Scripts\python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 8001

## 3) Start Tutor Engine

- cd ..
- .venv\Scripts\python.exe -m uvicorn main:app --host 127.0.0.1 --port 8000

## 4) Start Ollama (for tutor/concept full generation)

- ollama serve
- ollama pull qwen2.5:3b

## 5) Open docs

- Pipeline docs: http://127.0.0.1:8001/docs
- Tutor docs: http://127.0.0.1:8000/docs

## Demo Flow (Recommended)

1. Upload a PDF in /upload.
2. Call /tutor with stage=guide, then hint1, hint2, answer using same session_id.
3. Call /quiz and /flashcards with same session_id and topic.
4. Call /concept/explain for a key term.
5. Open /progress to show tracked learning analytics.

## Current Behavior Notes

- Tutor and concept endpoints require Ollama to generate model text.
- Quiz and flashcards are resilient: they return fallback grounded outputs even if LLM generation is unavailable.
- Retrieval defaults to latest uploaded document for safer demos.

## Project Status

This is a strong hackathon MVP backend with:

- grounded tutoring
- study tools generation
- progress analytics
- local-only AI stack

Next likely enhancements:

- frontend dashboard for session/progress visualization
- stricter topic extraction
- richer source highlighting in UI
- automated integration tests

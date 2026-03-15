from __future__ import annotations

from uuid import uuid4

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from .learning_state import ProgressTrackerService, SessionMemoryService
from .models import (
    ConceptExplainRequest,
    ConceptExplainResponse,
    FlashcardGenerateRequest,
    FlashcardResponse,
    HealthResponse,
    ProgressSummaryResponse,
    QuizGenerateRequest,
    QuizResponse,
    TutorRequest,
    TutorResponse,
)
from .ollama_client import OllamaClient, OllamaClientError
from .retrieval_client import RetrievalClient, RetrievalClientError
from .study_tools_service import StudyToolsService
from .tutor_service import TutorService

app = FastAPI(title="Tutor Engine", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3001",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

retrieval_client = RetrievalClient()
ollama_client = OllamaClient()
progress_tracker = ProgressTrackerService()
session_memory = SessionMemoryService()
tutor_service = TutorService(
    retrieval_client=retrieval_client,
    ollama_client=ollama_client,
    progress_tracker=progress_tracker,
    session_memory=session_memory,
)
study_tools_service = StudyToolsService(
    retrieval_client=retrieval_client,
    ollama_client=ollama_client,
)


@app.get("/health", response_model=HealthResponse)
def health() -> HealthResponse:
    return HealthResponse(status="ok")


@app.post("/tutor", response_model=TutorResponse)
def tutor(request: TutorRequest) -> TutorResponse:
    question = request.question.strip()
    if not question:
        raise HTTPException(status_code=422, detail="Question must not be blank.")

    session_id = (request.session_id or "").strip() or str(uuid4())

    try:
        return tutor_service.generate_response(
            question=question,
            stage=request.stage,
            topic=request.topic,
            difficulty=request.difficulty,
            session_id=session_id,
        )
    except RetrievalClientError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc
    except OllamaClientError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc


@app.post("/quiz", response_model=QuizResponse)
def generate_quiz(request: QuizGenerateRequest) -> QuizResponse:
    session_id = (request.session_id or "").strip() or str(uuid4())
    try:
        return study_tools_service.generate_quiz(
            topic=(request.topic or "").strip(),
            count=request.count,
            difficulty=request.difficulty,
            session_id=session_id,
        )
    except RetrievalClientError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc
    except OllamaClientError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc


@app.post("/flashcards", response_model=FlashcardResponse)
def generate_flashcards(request: FlashcardGenerateRequest) -> FlashcardResponse:
    session_id = (request.session_id or "").strip() or str(uuid4())
    try:
        return study_tools_service.generate_flashcards(
            topic=(request.topic or "").strip(),
            count=request.count,
            difficulty=request.difficulty,
            session_id=session_id,
        )
    except RetrievalClientError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc
    except OllamaClientError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc


@app.post("/concept/explain", response_model=ConceptExplainResponse)
def explain_concept(request: ConceptExplainRequest) -> ConceptExplainResponse:
    concept = request.concept.strip()
    if not concept:
        raise HTTPException(status_code=422, detail="Concept must not be blank.")

    session_id = (request.session_id or "").strip() or str(uuid4())
    try:
        return study_tools_service.explain_concept(
            concept=concept,
            topic=(request.topic or "").strip(),
            beginner_mode=request.beginner_mode,
            difficulty=request.difficulty,
            session_id=session_id,
        )
    except RetrievalClientError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc
    except OllamaClientError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc


@app.get("/progress", response_model=ProgressSummaryResponse)
def progress() -> ProgressSummaryResponse:
    return progress_tracker.get_summary(session_count=session_memory.count_sessions())

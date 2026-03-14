from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field

TutorStage = Literal["guide", "hint1", "hint2", "answer"]
DifficultyMode = Literal["beginner", "intermediate", "exam"]


def dump_model(model: BaseModel) -> dict:
    if hasattr(model, "model_dump"):
        return model.model_dump()
    return model.dict()


def validate_model(model_cls: type[BaseModel], data: dict) -> BaseModel:
    if hasattr(model_cls, "model_validate"):
        return model_cls.model_validate(data)
    return model_cls.parse_obj(data)


class HealthResponse(BaseModel):
    status: str = "ok"


class TutorRequest(BaseModel):
    question: str = Field(..., min_length=1)
    stage: TutorStage
    topic: str | None = None
    difficulty: DifficultyMode = "beginner"
    session_id: str | None = None


class SourceReference(BaseModel):
    file: str
    page: int | None = None
    chunk_id: str | None = None
    score: float | None = None


class TutorResponse(BaseModel):
    response: str
    sources: list[SourceReference] = Field(default_factory=list)
    session_id: str | None = None
    stage: TutorStage | None = None
    topic: str | None = None
    difficulty: DifficultyMode = "beginner"
    grounded: bool = True


class RetrievedChunk(BaseModel):
    text: str
    source: str
    page: int | None = None
    chunk_id: str | None = None
    score: float | None = None


class RetrievalRequest(BaseModel):
    query: str
    top_k: int = Field(default=4, ge=1, le=20)


class RetrievalResponse(BaseModel):
    chunks: list[RetrievedChunk] = Field(default_factory=list)


class OllamaGenerateRequest(BaseModel):
    model: str
    prompt: str
    stream: bool = False


class OllamaGenerateResponse(BaseModel):
    response: str


class QuizGenerateRequest(BaseModel):
    topic: str | None = None
    count: int = Field(default=5, ge=1, le=10)
    difficulty: DifficultyMode = "beginner"
    session_id: str | None = None


class QuizQuestion(BaseModel):
    question: str
    choices: list[str] = Field(default_factory=list, min_length=4, max_length=4)
    correct_answer: str
    explanation: str
    topic: str | None = None
    sources: list[SourceReference] = Field(default_factory=list)


class QuizResponse(BaseModel):
    topic: str | None = None
    difficulty: DifficultyMode = "beginner"
    session_id: str | None = None
    grounded: bool = True
    questions: list[QuizQuestion] = Field(default_factory=list)


class FlashcardGenerateRequest(BaseModel):
    topic: str | None = None
    count: int = Field(default=8, ge=1, le=20)
    difficulty: DifficultyMode = "beginner"
    session_id: str | None = None


class Flashcard(BaseModel):
    front: str
    back: str
    topic: str | None = None
    sources: list[SourceReference] = Field(default_factory=list)


class FlashcardResponse(BaseModel):
    topic: str | None = None
    difficulty: DifficultyMode = "beginner"
    session_id: str | None = None
    grounded: bool = True
    flashcards: list[Flashcard] = Field(default_factory=list)


class ConceptExplainRequest(BaseModel):
    concept: str = Field(..., min_length=1)
    topic: str | None = None
    beginner_mode: bool = True
    difficulty: DifficultyMode = "beginner"
    session_id: str | None = None


class ConceptExplainResponse(BaseModel):
    concept: str
    explanation: str
    beginner_mode: bool = True
    difficulty: DifficultyMode = "beginner"
    session_id: str | None = None
    grounded: bool = True
    sources: list[SourceReference] = Field(default_factory=list)


class ProgressEvent(BaseModel):
    timestamp: str
    session_id: str
    question: str
    stage: TutorStage
    topic: str
    difficulty: DifficultyMode
    hints_used_before_answer: int = 0
    grounded: bool = True


class TopicProgress(BaseModel):
    topic: str
    questions_asked: int = 0
    answers_seen: int = 0
    hints_used: int = 0
    mastery_score: float = 0.0


class ProgressSummaryResponse(BaseModel):
    total_questions: int = 0
    sessions_tracked: int = 0
    topics: list[TopicProgress] = Field(default_factory=list)
    recent_events: list[ProgressEvent] = Field(default_factory=list)

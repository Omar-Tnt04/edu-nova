from __future__ import annotations

from .learning_state import ProgressTrackerService, SessionMemoryService
from .models import DifficultyMode, RetrievedChunk, SourceReference, TutorResponse, TutorStage
from .ollama_client import OllamaClient
from .prompt_builder import build_tutor_prompt
from .retrieval_client import RetrievalClient

NO_CONTEXT_RESPONSES: dict[TutorStage, str] = {
    "guide": "I couldn't find relevant course material for that question. Can you rephrase it or name the topic from your notes?",
    "hint1": "I don't have enough retrieved course material to give a reliable first hint yet.",
    "hint2": "I still don't have enough course material to give a stronger hint without guessing.",
    "answer": "I can't answer that from the retrieved course material I was given.",
}


class TutorService:
    def __init__(
        self,
        retrieval_client: RetrievalClient,
        ollama_client: OllamaClient,
        progress_tracker: ProgressTrackerService,
        session_memory: SessionMemoryService,
    ) -> None:
        self.retrieval_client = retrieval_client
        self.ollama_client = ollama_client
        self.progress_tracker = progress_tracker
        self.session_memory = session_memory

    def generate_response(
        self,
        *,
        question: str,
        stage: TutorStage,
        topic: str | None,
        difficulty: DifficultyMode,
        session_id: str,
    ) -> TutorResponse:
        normalized_topic = (topic or "").strip() or "general"
        previous_question = self.session_memory.get_last_question(session_id)

        retrieval_query = question
        if previous_question and question.lower() in {"why?", "how?", "explain", "more", "continue"}:
            retrieval_query = f"{previous_question} {question}"

        chunks = self.retrieval_client.retrieve(retrieval_query)
        sources = self._extract_sources(chunks)
        grounded = bool(chunks)

        if not chunks:
            response_text = NO_CONTEXT_RESPONSES[stage]
            self._record_turn(
                session_id=session_id,
                question=question,
                stage=stage,
                topic=normalized_topic,
                difficulty=difficulty,
                response_text=response_text,
                grounded=False,
            )
            return TutorResponse(
                response=response_text,
                sources=sources,
                session_id=session_id,
                stage=stage,
                topic=normalized_topic,
                difficulty=difficulty,
                grounded=False,
            )

        conversation_context = self.session_memory.get_recent_context(session_id=session_id)

        prompt = build_tutor_prompt(
            question=question,
            stage=stage,
            chunks=chunks,
            difficulty=difficulty,
            conversation_context=conversation_context,
        )
        response_text = self.ollama_client.generate(prompt)
        self._record_turn(
            session_id=session_id,
            question=question,
            stage=stage,
            topic=normalized_topic,
            difficulty=difficulty,
            response_text=response_text,
            grounded=grounded,
        )

        return TutorResponse(
            response=response_text,
            sources=sources,
            session_id=session_id,
            stage=stage,
            topic=normalized_topic,
            difficulty=difficulty,
            grounded=grounded,
        )

    def _record_turn(
        self,
        *,
        session_id: str,
        question: str,
        stage: TutorStage,
        topic: str,
        difficulty: DifficultyMode,
        response_text: str,
        grounded: bool,
    ) -> None:
        hints_used_before_answer = self.session_memory.consume_hints_before_answer(session_id, stage)
        self.session_memory.record_turn(
            session_id=session_id,
            question=question,
            stage=stage,
            topic=topic,
            response=response_text,
        )
        self.progress_tracker.record_event(
            session_id=session_id,
            question=question,
            stage=stage,
            topic=topic,
            difficulty=difficulty,
            grounded=grounded,
            hints_used_before_answer=hints_used_before_answer,
        )

    @staticmethod
    def _extract_sources(chunks: list[RetrievedChunk]) -> list[SourceReference]:
        sources: list[SourceReference] = []
        seen: set[tuple[str, int | None, str | None]] = set()

        for chunk in chunks:
            key = (chunk.source, chunk.page, chunk.chunk_id)
            if key in seen:
                continue

            seen.add(key)
            sources.append(
                SourceReference(
                    file=chunk.source,
                    page=chunk.page,
                    chunk_id=chunk.chunk_id,
                    score=chunk.score,
                )
            )

        return sources

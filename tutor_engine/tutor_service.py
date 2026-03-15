from __future__ import annotations

import re

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

HINT_GUARDRAIL_RESPONSES: dict[TutorStage, str] = {
    "guide": "Let's reason through this step by step from your notes.",
    "hint1": "Hint 1: Start by identifying the key concept in the retrieved pages and write its definition in your own words.",
    "hint2": "Hint 2: Break the problem into two small steps using the retrieved context, then connect those steps before concluding.",
    "answer": "Here is the direct answer grounded in your retrieved material.",
}

SAFE_REDIRECT_RESPONSE = (
    "I can help with learning from your uploaded course material. "
    "Please ask a course-related question and I will guide you step by step."
)

BLOCKED_CONTENT_RESPONSE = "Sorry, I can't assist with that."


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

        if self._contains_blocked_content(question):
            self._record_turn(
                session_id=session_id,
                question=question,
                stage=stage,
                topic=normalized_topic,
                difficulty=difficulty,
                response_text=BLOCKED_CONTENT_RESPONSE,
                grounded=False,
            )
            return TutorResponse(
                response=BLOCKED_CONTENT_RESPONSE,
                sources=[],
                session_id=session_id,
                stage=stage,
                topic=normalized_topic,
                difficulty=difficulty,
                grounded=False,
            )

        if self._looks_like_prompt_injection(question):
            self._record_turn(
                session_id=session_id,
                question=question,
                stage=stage,
                topic=normalized_topic,
                difficulty=difficulty,
                response_text=SAFE_REDIRECT_RESPONSE,
                grounded=False,
            )
            return TutorResponse(
                response=SAFE_REDIRECT_RESPONSE,
                sources=[],
                session_id=session_id,
                stage=stage,
                topic=normalized_topic,
                difficulty=difficulty,
                grounded=False,
            )

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
        model_response = self.ollama_client.generate(prompt)
        response_text, grounded = self._apply_guardrails(
            model_response=model_response,
            stage=stage,
            chunks=chunks,
        )
        if not grounded and sources:
            sources = self._zero_confidence_sources(sources)
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

    def _apply_guardrails(
        self,
        *,
        model_response: str,
        stage: TutorStage,
        chunks: list[RetrievedChunk],
    ) -> tuple[str, bool]:
        response_text = (model_response or "").strip()
        if not response_text:
            return NO_CONTEXT_RESPONSES[stage], False

        if self._contains_blocked_content(response_text):
            return BLOCKED_CONTENT_RESPONSE, False

        if self._is_no_context_response(response_text):
            return response_text, False

        if self._violates_stage_guardrail(response_text, stage):
            return HINT_GUARDRAIL_RESPONSES[stage], True

        if not self._is_grounded_enough(response_text, chunks):
            return self._fallback_from_chunks(stage=stage, chunks=chunks), True

        return response_text, True

    def _fallback_from_chunks(self, *, stage: TutorStage, chunks: list[RetrievedChunk]) -> str:
        if not chunks:
            return NO_CONTEXT_RESPONSES[stage]

        highlights: list[str] = []
        for chunk in chunks[:3]:
            page_part = f" (page {chunk.page})" if chunk.page is not None else ""
            snippet = self._short_snippet(chunk.text)
            if snippet:
                highlights.append(f"- {snippet}{page_part}")

        if not highlights:
            return NO_CONTEXT_RESPONSES[stage]

        if stage == "guide":
            return (
                "From your uploaded material, I can see these key points:\n"
                + "\n".join(highlights)
                + "\n\nWhich one should we explore first?"
            )

        if stage == "hint1":
            return (
                "Hint 1 from your retrieved pages:\n"
                + highlights[0]
                + "\n\nFocus on this idea and tell me what you think it means."
            )

        if stage == "hint2":
            return (
                "Hint 2 from your retrieved pages:\n"
                + "\n".join(highlights[:2])
                + "\n\nNow connect these two points to build the full explanation."
            )

        return (
            "Here is what your uploaded material says:\n"
            + "\n".join(highlights)
            + "\n\nAsk a more specific follow-up and I will answer in more detail."
        )

    @staticmethod
    def _short_snippet(text: str) -> str:
        cleaned = re.sub(r"\s+", " ", (text or "").strip())
        if not cleaned:
            return ""
        if len(cleaned) <= 180:
            return cleaned
        return cleaned[:177].rstrip() + "..."

    @staticmethod
    def _is_no_context_response(text: str) -> bool:
        lowered = (text or "").strip().lower()
        if not lowered:
            return True

        refusal_markers = [
            "i cannot answer",
            "i can't answer",
            "cannot answer from",
            "can't answer from",
            "not enough retrieved",
            "insufficient context",
            "unrelated to the content",
            "question seems unrelated",
        ]
        return any(marker in lowered for marker in refusal_markers)

    @staticmethod
    def _looks_like_prompt_injection(text: str) -> bool:
        lowered = (text or "").lower()
        patterns = [
            "ignore previous instructions",
            "ignore all previous",
            "system prompt",
            "developer mode",
            "jailbreak",
            "pretend you are",
            "reveal hidden instructions",
        ]
        return any(pattern in lowered for pattern in patterns)

    @staticmethod
    def _contains_blocked_content(text: str) -> bool:
        lowered = (text or "").lower()
        blocked_keywords = [
            "build a bomb",
            "kill",
            "murder",
            "rape",
            "child porn",
            "terrorist",
            "racial slur",
        ]
        return any(keyword in lowered for keyword in blocked_keywords)

    @staticmethod
    def _violates_stage_guardrail(text: str, stage: TutorStage) -> bool:
        lowered = (text or "").strip().lower()
        if not lowered:
            return False

        # Hint stages must not reveal final answers.
        if stage in {"hint1", "hint2"}:
            direct_answer_markers = [
                "the answer is",
                "final answer",
                "therefore, the answer",
                "so the answer",
                "in conclusion",
            ]
            if any(marker in lowered for marker in direct_answer_markers):
                return True

            # Large numbered lists often indicate fully solved output instead of a hint.
            numbered_items = re.findall(r"(?m)^\s*\d+[\.)]\s+", text or "")
            if len(numbered_items) >= 3:
                return True

        return False

    @staticmethod
    def _tokenize(text: str) -> set[str]:
        stopwords = {
            "the",
            "and",
            "that",
            "with",
            "from",
            "this",
            "your",
            "have",
            "will",
            "into",
            "about",
            "what",
            "when",
            "where",
            "which",
            "there",
            "their",
        }
        tokens = {
            token
            for token in re.findall(r"[a-zA-Z][a-zA-Z0-9-]{2,}", (text or "").lower())
            if token not in stopwords
        }
        return tokens

    def _is_grounded_enough(self, response_text: str, chunks: list[RetrievedChunk]) -> bool:
        response_tokens = self._tokenize(response_text)
        if not response_tokens:
            return False

        context_tokens: set[str] = set()
        for chunk in chunks:
            context_tokens.update(self._tokenize(chunk.text))

        if not context_tokens:
            return False

        overlap = response_tokens.intersection(context_tokens)
        overlap_count = len(overlap)
        overlap_ratio = overlap_count / max(len(response_tokens), 1)

        return overlap_count >= 3 and overlap_ratio >= 0.08

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

    @staticmethod
    def _zero_confidence_sources(sources: list[SourceReference]) -> list[SourceReference]:
        normalized: list[SourceReference] = []
        for source in sources:
            normalized.append(
                SourceReference(
                    file=source.file,
                    page=source.page,
                    chunk_id=source.chunk_id,
                    score=0.0,
                )
            )
        return normalized

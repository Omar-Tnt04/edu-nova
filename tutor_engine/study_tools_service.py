from __future__ import annotations

import json
import re
from typing import Any

from .models import (
    ConceptExplainResponse,
    DifficultyMode,
    Flashcard,
    FlashcardResponse,
    QuizQuestion,
    QuizResponse,
    RetrievedChunk,
    SourceReference,
)
from .ollama_client import OllamaClient
from .ollama_client import OllamaClientError
from .prompt_builder import (
    build_concept_explainer_prompt,
    build_flashcard_prompt,
    build_quiz_prompt,
)
from .retrieval_client import RetrievalClient


class StudyToolsService:
    def __init__(
        self,
        retrieval_client: RetrievalClient,
        ollama_client: OllamaClient,
    ) -> None:
        self.retrieval_client = retrieval_client
        self.ollama_client = ollama_client

    def generate_quiz(
        self,
        *,
        topic: str,
        count: int,
        difficulty: DifficultyMode,
        session_id: str | None,
    ) -> QuizResponse:
        retrieval_query = topic.strip() or "recent uploaded course material key concepts"
        chunks = self.retrieval_client.retrieve(retrieval_query)
        sources = self._extract_sources(chunks)

        if not chunks:
            return QuizResponse(
                topic=topic or None,
                difficulty=difficulty,
                session_id=session_id,
                grounded=False,
                questions=[],
            )

        prompt = build_quiz_prompt(
            topic=topic or "recent material",
            count=count,
            difficulty=difficulty,
            chunks=chunks,
        )
        try:
            raw = self.ollama_client.generate(prompt)
            payload = self._safe_parse_json(raw)
        except OllamaClientError:
            payload = {}

        questions: list[QuizQuestion] = []
        for item in payload.get("questions", []):
            choices = [str(c).strip() for c in item.get("choices", []) if str(c).strip()]
            if len(choices) != 4:
                continue

            correct_answer = str(item.get("correct_answer", "")).strip()
            if correct_answer not in choices:
                continue

            question_text = str(item.get("question", "")).strip()
            explanation = str(item.get("explanation", "")).strip()
            if not question_text or not explanation:
                continue

            questions.append(
                QuizQuestion(
                    question=question_text,
                    choices=choices,
                    correct_answer=correct_answer,
                    explanation=explanation,
                    topic=topic or None,
                    sources=sources,
                )
            )

            if len(questions) >= count:
                break

        if not questions:
            questions = self._fallback_quiz_from_chunks(
                chunks=chunks,
                topic=topic or None,
                count=count,
                sources=sources,
            )

        return QuizResponse(
            topic=topic or None,
            difficulty=difficulty,
            session_id=session_id,
            grounded=True,
            questions=questions,
        )

    def generate_flashcards(
        self,
        *,
        topic: str,
        count: int,
        difficulty: DifficultyMode,
        session_id: str | None,
    ) -> FlashcardResponse:
        retrieval_query = topic.strip() or "recent uploaded course material important terms"
        chunks = self.retrieval_client.retrieve(retrieval_query)
        sources = self._extract_sources(chunks)

        if not chunks:
            return FlashcardResponse(
                topic=topic or None,
                difficulty=difficulty,
                session_id=session_id,
                grounded=False,
                flashcards=[],
            )

        prompt = build_flashcard_prompt(
            topic=topic or "recent material",
            count=count,
            difficulty=difficulty,
            chunks=chunks,
        )
        try:
            raw = self.ollama_client.generate(prompt)
            payload = self._safe_parse_json(raw)
        except OllamaClientError:
            payload = {}

        flashcards: list[Flashcard] = []
        for item in payload.get("flashcards", []):
            front = str(item.get("front", "")).strip()
            back = str(item.get("back", "")).strip()
            if not front or not back:
                continue

            flashcards.append(
                Flashcard(
                    front=front,
                    back=back,
                    topic=topic or None,
                    sources=sources,
                )
            )
            if len(flashcards) >= count:
                break

        if not flashcards:
            flashcards = self._fallback_flashcards_from_chunks(
                chunks=chunks,
                topic=topic or None,
                count=count,
                sources=sources,
            )

        return FlashcardResponse(
            topic=topic or None,
            difficulty=difficulty,
            session_id=session_id,
            grounded=True,
            flashcards=flashcards,
        )

    def explain_concept(
        self,
        *,
        concept: str,
        topic: str,
        beginner_mode: bool,
        difficulty: DifficultyMode,
        session_id: str | None,
    ) -> ConceptExplainResponse:
        retrieval_query = f"{topic} {concept}".strip()
        chunks = self.retrieval_client.retrieve(retrieval_query)
        sources = self._extract_sources(chunks)

        if not chunks:
            return ConceptExplainResponse(
                concept=concept,
                explanation="I cannot answer from the retrieved course material.",
                beginner_mode=beginner_mode,
                difficulty=difficulty,
                session_id=session_id,
                grounded=False,
                sources=sources,
            )

        prompt = build_concept_explainer_prompt(
            concept=concept,
            topic=topic,
            beginner_mode=beginner_mode,
            difficulty=difficulty,
            chunks=chunks,
        )
        response_text = self.ollama_client.generate(prompt).strip()
        if not response_text:
            response_text = "I cannot answer from the retrieved course material."

        grounded = response_text != "I cannot answer from the retrieved course material."

        return ConceptExplainResponse(
            concept=concept,
            explanation=response_text,
            beginner_mode=beginner_mode,
            difficulty=difficulty,
            session_id=session_id,
            grounded=grounded,
            sources=sources,
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
    def _safe_parse_json(raw_text: str) -> dict[str, Any]:
        text = raw_text.strip()
        if not text:
            return {}

        try:
            return json.loads(text)
        except json.JSONDecodeError:
            pass

        match = re.search(r"\{[\s\S]*\}", text)
        if not match:
            return {}

        try:
            return json.loads(match.group(0))
        except json.JSONDecodeError:
            return {}

    @staticmethod
    def _fallback_quiz_from_chunks(
        *,
        chunks: list[RetrievedChunk],
        topic: str | None,
        count: int,
        sources: list[SourceReference],
    ) -> list[QuizQuestion]:
        items: list[QuizQuestion] = []
        stop_words = {
            "the",
            "and",
            "with",
            "from",
            "that",
            "this",
            "into",
            "are",
            "for",
            "was",
            "were",
            "have",
            "has",
            "had",
            "its",
            "their",
            "about",
            "what",
            "which",
        }

        for chunk in chunks:
            if len(items) >= count:
                break

            text = chunk.text.strip()
            if not text:
                continue

            sentence = re.split(r"[.!?]\s+", text)[0].strip()
            if len(sentence.split()) < 6:
                continue

            words = [w for w in re.findall(r"[A-Za-z][A-Za-z-]+", sentence) if w.lower() not in stop_words]
            if not words:
                continue

            key = max(words, key=len)
            pattern = re.compile(re.escape(key), re.IGNORECASE)
            prompt_sentence = pattern.sub("____", sentence, count=1)
            if prompt_sentence == sentence:
                continue

            distractors = ["energy", "process", "system", "reaction", "structure", "function"]
            distractor_choices = [d for d in distractors if d.lower() != key.lower()][:3]
            if len(distractor_choices) < 3:
                distractor_choices = ["concept", "element", "factor"]

            choices = [key] + distractor_choices

            items.append(
                QuizQuestion(
                    question=f"Fill in the blank: {prompt_sentence}",
                    choices=choices,
                    correct_answer=key,
                    explanation=f"Based on the retrieved text, '{key}' is the missing term.",
                    topic=topic,
                    sources=sources,
                )
            )

        return items

    @staticmethod
    def _fallback_flashcards_from_chunks(
        *,
        chunks: list[RetrievedChunk],
        topic: str | None,
        count: int,
        sources: list[SourceReference],
    ) -> list[Flashcard]:
        cards: list[Flashcard] = []

        for chunk in chunks:
            if len(cards) >= count:
                break

            text = chunk.text.strip()
            if not text:
                continue

            sentence = re.split(r"[.!?]\s+", text)[0].strip()
            words = re.findall(r"[A-Za-z][A-Za-z-]+", sentence)
            if len(words) < 5:
                continue

            term = words[0]
            cards.append(
                Flashcard(
                    front=f"Define: {term}",
                    back=sentence,
                    topic=topic,
                    sources=sources,
                )
            )

        return cards

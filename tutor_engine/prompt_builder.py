from __future__ import annotations

from .models import DifficultyMode, RetrievedChunk, TutorStage


def build_document_context(chunks: list[RetrievedChunk]) -> str:
    if not chunks:
        return "No relevant course material was retrieved."

    formatted_chunks: list[str] = []
    for index, chunk in enumerate(chunks, start=1):
        page_label = f"Page {chunk.page}" if chunk.page is not None else "Page unknown"
        score_label = f", score={chunk.score:.4f}" if chunk.score is not None else ""
        formatted_chunks.append(
            f"[Chunk {index}] Source: {chunk.source}, {page_label}{score_label}\n{chunk.text.strip()}"
        )

    return "\n\n".join(formatted_chunks)


def _difficulty_instruction(difficulty: DifficultyMode) -> str:
    if difficulty == "beginner":
        return "Use simple language, short sentences, and define terms before using them."
    if difficulty == "intermediate":
        return "Use university-level language with concise reasoning and key terminology."
    return "Use exam-focused style: precise terminology, likely pitfalls, and what to write for marks."


def _stage_instruction(stage: TutorStage) -> str:
    if stage == "guide":
        return "Ask one broad Socratic question that helps the student reason from the context."
    if stage == "hint1":
        return "Give a targeted clue without revealing the full answer."
    if stage == "hint2":
        return "Give a stronger clue with partial explanation, but do not give the final full answer."
    return "Provide a direct final explanation grounded in the context."


def build_tutor_prompt(
    *,
    question: str,
    stage: TutorStage,
    chunks: list[RetrievedChunk],
    difficulty: DifficultyMode,
    conversation_context: str,
) -> str:
    context = build_document_context(chunks)
    difficulty_instruction = _difficulty_instruction(difficulty)
    stage_instruction = _stage_instruction(stage)

    return f"""SYSTEM ROLE:

You are a university tutor helping students understand concepts from their course material.

Rules:
* Only answer using the provided document context
* Do not invent information
* If context does not contain support for the answer, say exactly: "I cannot answer from the retrieved course material."
* Keep the response aligned with the requested stage and difficulty

DOCUMENT CONTEXT:

{context}

SESSION CONTEXT (for follow-up continuity):

{conversation_context}

STUDENT QUESTION:

{question}

TUTOR STAGE:

{stage}

DIFFICULTY MODE:

{difficulty}

OUTPUT INSTRUCTIONS:

Stage behavior:
{stage_instruction}

Difficulty behavior:
{difficulty_instruction}

CURRENT TASK:
Return only the tutor response for the current stage in plain text.
"""


def build_quiz_prompt(
    *,
    topic: str,
    count: int,
    difficulty: DifficultyMode,
    chunks: list[RetrievedChunk],
) -> str:
    context = build_document_context(chunks)
    difficulty_instruction = _difficulty_instruction(difficulty)

    return f"""SYSTEM ROLE:

You generate grounded multiple-choice quiz questions from course material.

Rules:
* Use only the document context
* If context is insufficient, return an empty question list
* Keep question quality suitable for the requested difficulty

DOCUMENT CONTEXT:

{context}

QUIZ PARAMETERS:
* Topic: {topic}
* Count: {count}
* Difficulty: {difficulty}
* Difficulty instruction: {difficulty_instruction}

OUTPUT FORMAT:
Return strict JSON only with this schema:
{{
    "questions": [
        {{
            "question": "...",
            "choices": ["A", "B", "C", "D"],
            "correct_answer": "...",
            "explanation": "..."
        }}
    ]
}}
"""


def build_flashcard_prompt(
    *,
    topic: str,
    count: int,
    difficulty: DifficultyMode,
    chunks: list[RetrievedChunk],
) -> str:
    context = build_document_context(chunks)
    difficulty_instruction = _difficulty_instruction(difficulty)

    return f"""SYSTEM ROLE:

You generate grounded study flashcards from course material.

Rules:
* Use only the document context
* If context is insufficient, return an empty flashcards list
* Make cards concise and study-friendly

DOCUMENT CONTEXT:

{context}

FLASHCARD PARAMETERS:
* Topic: {topic}
* Count: {count}
* Difficulty: {difficulty}
* Difficulty instruction: {difficulty_instruction}

OUTPUT FORMAT:
Return strict JSON only with this schema:
{{
    "flashcards": [
        {{
            "front": "...",
            "back": "..."
        }}
    ]
}}
"""


def build_concept_explainer_prompt(
    *,
    concept: str,
    topic: str,
    beginner_mode: bool,
    difficulty: DifficultyMode,
    chunks: list[RetrievedChunk],
) -> str:
    context = build_document_context(chunks)
    beginner_instruction = (
    "Explain like to a first-year student, with a simple analogy and plain language."
    if beginner_mode
    else "Use concise technical explanation without oversimplifying."
    )
    difficulty_instruction = _difficulty_instruction(difficulty)

    return f"""SYSTEM ROLE:

You explain concepts using only grounded course material.

Rules:
* Use only the document context
* If unsupported, say exactly: "I cannot answer from the retrieved course material."
* Keep explanation aligned to beginner mode and difficulty

DOCUMENT CONTEXT:

{context}

REQUEST:
* Concept: {concept}
* Topic: {topic}
* Beginner mode: {beginner_mode}
* Difficulty: {difficulty}
* Beginner instruction: {beginner_instruction}
* Difficulty instruction: {difficulty_instruction}

OUTPUT FORMAT:
Return only plain text explanation.
"""

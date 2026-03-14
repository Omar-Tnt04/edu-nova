from __future__ import annotations

import json
from datetime import datetime, timezone
from pathlib import Path
from threading import Lock
from typing import Any

from .models import DifficultyMode, ProgressEvent, ProgressSummaryResponse, TopicProgress, TutorStage

BASE_DIR = Path(__file__).resolve().parent
DATA_DIR = BASE_DIR / "data"
PROGRESS_FILE = DATA_DIR / "progress_history.json"
SESSION_FILE = DATA_DIR / "session_memory.json"


class _JsonFileStore:
    def __init__(self, path: Path, default_data: dict[str, Any]) -> None:
        self.path = path
        self.default_data = default_data
        self._lock = Lock()
        self.path.parent.mkdir(parents=True, exist_ok=True)
        if not self.path.exists():
            self._write(default_data)

    def _read(self) -> dict[str, Any]:
        with self._lock:
            try:
                return json.loads(self.path.read_text(encoding="utf-8"))
            except Exception:
                self._write(self.default_data)
                return dict(self.default_data)

    def _write(self, data: dict[str, Any]) -> None:
        with self._lock:
            self.path.write_text(json.dumps(data, indent=2), encoding="utf-8")

    def load(self) -> dict[str, Any]:
        return self._read()

    def save(self, data: dict[str, Any]) -> None:
        self._write(data)


class SessionMemoryService:
    def __init__(self, max_history_items: int = 8) -> None:
        self.max_history_items = max_history_items
        self.store = _JsonFileStore(
            SESSION_FILE,
            default_data={"sessions": {}},
        )

    def _ensure_session(self, session_id: str) -> dict[str, Any]:
        data = self.store.load()
        sessions = data.setdefault("sessions", {})
        session_state = sessions.setdefault(
            session_id,
            {
                "history": [],
                "stage_sequence": [],
                "pending_hints": 0,
                "last_topic": "general",
            },
        )
        self.store.save(data)
        return session_state

    def get_recent_context(self, session_id: str, limit: int = 3) -> str:
        session_state = self._ensure_session(session_id)
        history = session_state.get("history", [])[-limit:]
        if not history:
            return "No previous turns in this session."

        lines: list[str] = []
        for item in history:
            lines.append(f"Q: {item.get('question', '')}")
            lines.append(f"Stage: {item.get('stage', '')}")
            lines.append(f"A: {item.get('response', '')}")
        return "\n".join(lines)

    def get_last_question(self, session_id: str) -> str | None:
        session_state = self._ensure_session(session_id)
        history = session_state.get("history", [])
        if not history:
            return None
        return str(history[-1].get("question", "")).strip() or None

    def record_turn(
        self,
        *,
        session_id: str,
        question: str,
        stage: TutorStage,
        topic: str,
        response: str,
    ) -> None:
        data = self.store.load()
        sessions = data.setdefault("sessions", {})
        session_state = sessions.setdefault(
            session_id,
            {
                "history": [],
                "stage_sequence": [],
                "pending_hints": 0,
                "last_topic": "general",
            },
        )

        history = session_state.setdefault("history", [])
        history.append(
            {
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "question": question,
                "stage": stage,
                "topic": topic,
                "response": response,
            }
        )
        if len(history) > self.max_history_items:
            session_state["history"] = history[-self.max_history_items :]

        session_state.setdefault("stage_sequence", []).append(stage)
        session_state["last_topic"] = topic

        if stage in {"hint1", "hint2"}:
            session_state["pending_hints"] = int(session_state.get("pending_hints", 0)) + 1
        elif stage == "answer":
            session_state["pending_hints"] = 0

        self.store.save(data)

    def consume_hints_before_answer(self, session_id: str, stage: TutorStage) -> int:
        if stage != "answer":
            return 0

        data = self.store.load()
        sessions = data.setdefault("sessions", {})
        session_state = sessions.setdefault(
            session_id,
            {
                "history": [],
                "stage_sequence": [],
                "pending_hints": 0,
                "last_topic": "general",
            },
        )
        hints = int(session_state.get("pending_hints", 0))
        session_state["pending_hints"] = 0
        self.store.save(data)
        return hints

    def count_sessions(self) -> int:
        data = self.store.load()
        sessions = data.get("sessions", {})
        return len(sessions)


class ProgressTrackerService:
    def __init__(self) -> None:
        self.store = _JsonFileStore(
            PROGRESS_FILE,
            default_data={"events": []},
        )

    @staticmethod
    def _normalize_topic(topic: str | None) -> str:
        clean = (topic or "").strip()
        return clean if clean else "general"

    def record_event(
        self,
        *,
        session_id: str,
        question: str,
        stage: TutorStage,
        topic: str | None,
        difficulty: DifficultyMode,
        grounded: bool,
        hints_used_before_answer: int,
    ) -> None:
        data = self.store.load()
        events = data.setdefault("events", [])
        events.append(
            {
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "session_id": session_id,
                "question": question,
                "stage": stage,
                "topic": self._normalize_topic(topic),
                "difficulty": difficulty,
                "grounded": grounded,
                "hints_used_before_answer": hints_used_before_answer,
            }
        )
        self.store.save(data)

    def get_summary(self, *, session_count: int, limit_recent: int = 20) -> ProgressSummaryResponse:
        data = self.store.load()
        raw_events = data.get("events", [])

        topic_state: dict[str, dict[str, float | int]] = {}
        for item in raw_events:
            topic = self._normalize_topic(item.get("topic"))
            state = topic_state.setdefault(
                topic,
                {
                    "questions_asked": 0,
                    "answers_seen": 0,
                    "hints_used": 0,
                },
            )
            state["questions_asked"] = int(state["questions_asked"]) + 1
            if item.get("stage") == "answer":
                state["answers_seen"] = int(state["answers_seen"]) + 1
            state["hints_used"] = int(state["hints_used"]) + int(item.get("hints_used_before_answer", 0))

        topics: list[TopicProgress] = []
        for topic, state in sorted(topic_state.items(), key=lambda kv: kv[0]):
            questions_asked = int(state["questions_asked"])
            answers_seen = int(state["answers_seen"])
            hints_used = int(state["hints_used"])

            base = 100.0
            if questions_asked > 0:
                penalty = (hints_used / questions_asked) * 15.0
            else:
                penalty = 0.0
            coverage_bonus = min(answers_seen * 3.0, 20.0)
            mastery = max(0.0, min(100.0, base - penalty + coverage_bonus))

            topics.append(
                TopicProgress(
                    topic=topic,
                    questions_asked=questions_asked,
                    answers_seen=answers_seen,
                    hints_used=hints_used,
                    mastery_score=round(mastery, 2),
                )
            )

        recent_events = [ProgressEvent(**item) for item in raw_events[-limit_recent:]]

        return ProgressSummaryResponse(
            total_questions=len(raw_events),
            sessions_tracked=session_count,
            topics=topics,
            recent_events=recent_events,
        )

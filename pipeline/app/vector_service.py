from __future__ import annotations

import json
from pathlib import Path

_BASE_DIR = Path(__file__).resolve().parent.parent
_STATE_DIR = _BASE_DIR / "data" / "state"
_INDEX_FILE = _STATE_DIR / "vector_index.json"
_STATE_DIR.mkdir(parents=True, exist_ok=True)


def _load_index() -> dict:
    if not _INDEX_FILE.exists():
        return {"items": []}
    try:
        return json.loads(_INDEX_FILE.read_text(encoding="utf-8"))
    except Exception:
        return {"items": []}


def _save_index(index: dict) -> None:
    _INDEX_FILE.write_text(json.dumps(index), encoding="utf-8")


def upsert_chunks(*, ids: list[str], texts: list[str], embeddings: list[list[float]], metadatas: list[dict]) -> None:
    index = _load_index()
    existing = {item["id"]: item for item in index.get("items", [])}

    for chunk_id, text, emb, metadata in zip(ids, texts, embeddings, metadatas):
        existing[chunk_id] = {
            "id": chunk_id,
            "text": text,
            "embedding": emb,
            "metadata": metadata or {},
        }

    index["items"] = list(existing.values())
    _save_index(index)


def _dot(a: list[float], b: list[float]) -> float:
    return sum(x * y for x, y in zip(a, b))


def _matches_where(metadata: dict, where: dict | None) -> bool:
    if not where:
        return True
    for key, value in where.items():
        if metadata.get(key) != value:
            return False
    return True


def search(*, query_embedding: list[float], top_k: int, where: dict | None = None) -> dict:
    index = _load_index()
    items = index.get("items", [])

    scored: list[tuple[float, dict]] = []
    for item in items:
        metadata = item.get("metadata", {})
        if not _matches_where(metadata, where):
            continue
        score = _dot(query_embedding, item.get("embedding", []))
        scored.append((score, item))

    scored.sort(key=lambda it: it[0], reverse=True)
    top = scored[: max(top_k, 1)]

    ids = [item["id"] for _, item in top]
    docs = [item.get("text", "") for _, item in top]
    metas = [item.get("metadata", {}) for _, item in top]
    # Keep API contract where lower is better distance.
    distances = [1.0 - max(min(score, 1.0), -1.0) for score, _ in top]

    return {
        "ids": [ids],
        "documents": [docs],
        "metadatas": [metas],
        "distances": [distances],
    }

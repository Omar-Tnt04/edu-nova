from __future__ import annotations

import math
import re

_DIM = 256
_TOKEN_RE = re.compile(r"[a-zA-Z0-9_]+")


def _hash_token(token: str) -> int:
    value = 2166136261
    for ch in token:
        value ^= ord(ch)
        value = (value * 16777619) & 0xFFFFFFFF
    return value


def _embed(text: str) -> list[float]:
    vector = [0.0] * _DIM
    tokens = _TOKEN_RE.findall((text or "").lower())
    if not tokens:
        return vector

    for token in tokens:
        idx = _hash_token(token) % _DIM
        vector[idx] += 1.0

    norm = math.sqrt(sum(v * v for v in vector))
    if norm > 0:
        vector = [v / norm for v in vector]
    return vector


def embed_texts(texts: list[str]) -> list[list[float]]:
    return [_embed(text) for text in texts]


def embed_query(text: str) -> list[float]:
    return _embed(text)

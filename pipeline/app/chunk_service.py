from __future__ import annotations


def chunk_text(text: str, max_chars: int = 900, overlap: int = 120) -> list[str]:
    text = (text or "").strip()
    if not text:
        return []

    chunks: list[str] = []
    start = 0
    length = len(text)

    while start < length:
        end = min(start + max_chars, length)
        chunk = text[start:end].strip()
        if chunk:
            chunks.append(chunk)
        if end >= length:
            break
        start = max(end - overlap, start + 1)

    return chunks

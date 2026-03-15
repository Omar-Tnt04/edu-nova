from __future__ import annotations

from pathlib import Path


def extract_text_by_page(pdf_path: str) -> list[dict]:
    try:
        import fitz  # PyMuPDF
    except Exception as exc:
        raise RuntimeError("PyMuPDF is required. Install with: pip install pymupdf") from exc

    path = Path(pdf_path)
    if not path.exists():
        return []

    pages: list[dict] = []
    with fitz.open(str(path)) as doc:
        for idx, page in enumerate(doc, start=1):
            text = page.get_text("text") or ""
            if text.strip():
                pages.append({"page_number": idx, "text": text})

    return pages

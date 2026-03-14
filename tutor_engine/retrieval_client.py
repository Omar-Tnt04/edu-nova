from __future__ import annotations

import os
import re

import requests

from .models import RetrievalRequest, RetrievalResponse, RetrievedChunk, dump_model, validate_model


class RetrievalClientError(RuntimeError):
    pass


class RetrievalClient:
    def __init__(
        self,
        *,
        base_url: str | None = None,
        top_k: int = 4,
        timeout: float | None = None,
        session: requests.Session | None = None,
    ) -> None:
        self.base_url = (base_url or os.getenv("DOCUMENT_SERVICE_URL", "http://127.0.0.1:8001")).rstrip("/")
        self.top_k = top_k
        self.timeout = timeout if timeout is not None else float(os.getenv("DOCUMENT_SERVICE_TIMEOUT", "10"))
        self.session = session or requests.Session()

    def retrieve(self, question: str) -> list[RetrievedChunk]:
        payload = RetrievalRequest(query=question, top_k=self.top_k)

        try:
            response = self.session.post(
                f"{self.base_url}/retrieve",
                json=dump_model(payload),
                timeout=self.timeout,
            )
            if response.status_code == 404:
                # Compatibility fallback for document services that expose /query.
                response = self.session.post(
                    f"{self.base_url}/query",
                    json={"text": question, "top_k": self.top_k},
                    timeout=self.timeout,
                )

            response.raise_for_status()
            parsed = self._parse_response(response.json())
        except requests.RequestException as exc:
            raise RetrievalClientError(f"Document retrieval failed: {exc}") from exc
        except Exception as exc:
            raise RetrievalClientError(f"Invalid retrieval response: {exc}") from exc

        return parsed.chunks

    @staticmethod
    def _parse_response(data: dict) -> RetrievalResponse:
        if "chunks" in data:
            return validate_model(RetrievalResponse, data)

        if "results" in data and isinstance(data["results"], list):
            chunks: list[RetrievedChunk] = []

            for item in data["results"]:
                text = str(item.get("text", "")).strip()
                if not text:
                    continue

                chunk_id = str(item.get("id", ""))
                metadata = item.get("metadata") if isinstance(item.get("metadata"), dict) else {}
                filename = str(metadata.get("filename", "")).strip()
                page = None
                if metadata.get("page") is not None:
                    try:
                        page = int(metadata.get("page"))
                    except (TypeError, ValueError):
                        page = None
                else:
                    match = re.search(r"_p(\d+)_", chunk_id)
                    if match:
                        page = int(match.group(1))

                score_value = item.get("score")
                score = float(score_value) if isinstance(score_value, (int, float)) else None

                chunks.append(
                    RetrievedChunk(
                        text=text,
                        source=filename or chunk_id or "pipeline",
                        page=page,
                        chunk_id=chunk_id or None,
                        score=score,
                    )
                )

            return RetrievalResponse(chunks=chunks)

        raise ValueError("Response did not contain 'chunks' or 'results'.")

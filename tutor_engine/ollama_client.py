from __future__ import annotations

import os

import requests


class OllamaClientError(RuntimeError):
    pass


class OllamaClient:
    def __init__(
        self,
        *,
        base_url: str | None = None,
        model: str | None = None,
        timeout: float | None = None,
        session: requests.Session | None = None,
    ) -> None:
        self.base_url = (base_url or os.getenv("OLLAMA_BASE_URL", "http://127.0.0.1:11434")).rstrip("/")
        self.model = model or os.getenv("OLLAMA_MODEL", "qwen2.5:3b")
        self.timeout = timeout if timeout is not None else float(os.getenv("OLLAMA_TIMEOUT", "60"))
        self.session = session or requests.Session()

    def generate(self, prompt: str) -> str:
        payload = {
            "model": self.model,
            "prompt": prompt,
            "stream": False,
        }

        try:
            response = self.session.post(
                f"{self.base_url}/api/generate",
                json=payload,
                timeout=self.timeout,
            )
            response.raise_for_status()
            data = response.json()
        except requests.RequestException as exc:
            raise OllamaClientError(f"Ollama request failed: {exc}") from exc
        except ValueError as exc:
            raise OllamaClientError("Ollama returned invalid JSON.") from exc

        text = str(data.get("response", "")).strip()
        if not text:
            raise OllamaClientError("Ollama returned an empty response.")
        return text

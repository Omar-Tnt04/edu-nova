from pydantic import BaseModel


class UploadResponse(BaseModel):
    filename: str
    pages: int
    chunks: int


class QueryRequest(BaseModel):
    text: str
    top_k: int = 5
    document_id: str | None = None
    filename: str | None = None
    latest_only: bool = True


class QueryResult(BaseModel):
    id: str
    score: float
    text: str
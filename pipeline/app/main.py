from pathlib import Path
import json
from uuid import uuid4

from fastapi import FastAPI, File, UploadFile, HTTPException

from app.chunk_service import chunk_text
from app.embedding_service import embed_texts, embed_query
from app.pdf_service import extract_text_by_page
from app.schemas import QueryRequest, UploadResponse
from app.vector_service import search, upsert_chunks


# Base directories
BASE_DIR = Path(__file__).resolve().parent.parent
UPLOAD_DIR = BASE_DIR / "data" / "uploads"
STATE_DIR = BASE_DIR / "data" / "state"
LATEST_DOC_FILE = STATE_DIR / "latest_document.json"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
STATE_DIR.mkdir(parents=True, exist_ok=True)


app = FastAPI(title="Pipeline Service")


def _write_latest_document(document_id: str, filename: str) -> None:
    payload = {
        "document_id": document_id,
        "filename": filename,
    }
    LATEST_DOC_FILE.write_text(json.dumps(payload, indent=2), encoding="utf-8")


def _read_latest_document_id() -> str | None:
    if not LATEST_DOC_FILE.exists():
        return None

    try:
        payload = json.loads(LATEST_DOC_FILE.read_text(encoding="utf-8"))
        value = str(payload.get("document_id", "")).strip()
        return value or None
    except Exception:
        return None


# Health endpoint
@app.get("/health")
def health():
    return {"status": "ok"}


# Upload and index a PDF
@app.post("/upload", response_model=UploadResponse)
async def upload_pdf(file: UploadFile = File(...)):
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are allowed")

    # Create unique document id
    document_id = str(uuid4())

    # Save uploaded file
    save_path = UPLOAD_DIR / f"{document_id}_{file.filename}"
    contents = await file.read()
    save_path.write_bytes(contents)

    # Extract text from PDF
    pages = extract_text_by_page(str(save_path))

    if not pages:
        raise HTTPException(status_code=400, detail="No extractable text found in PDF")

    all_ids = []
    all_texts = []
    all_metadatas = []

    # Chunk each page
    for page in pages:
        page_number = page["page_number"]
        page_text = page["text"]

        page_chunks = chunk_text(page_text)

        for i, chunk in enumerate(page_chunks):
            chunk_id = f"{document_id}_p{page_number}_c{i}"

            all_ids.append(chunk_id)
            all_texts.append(chunk)
            all_metadatas.append({
                "document_id": document_id,
                "filename": file.filename,
                "page": page_number,
                "chunk_index": i
            })

    # Generate embeddings
    embeddings = embed_texts(all_texts) if all_texts else []

    # Store in vector database
    if all_texts and embeddings:
        upsert_chunks(
            ids=all_ids,
            texts=all_texts,
            embeddings=embeddings,
            metadatas=all_metadatas
        )

    _write_latest_document(document_id=document_id, filename=file.filename)

    return UploadResponse(
        filename=file.filename,
        pages=len(pages),
        chunks=len(all_texts)
    )


# Query the indexed documents
@app.post("/query")
def query_documents(request: QueryRequest):
    # Convert question to embedding
    query_vector = embed_query(request.text)

    # Search vector DB
    where = None
    if request.document_id:
        where = {"document_id": request.document_id}
    elif request.filename:
        where = {"filename": request.filename}
    elif request.latest_only:
        latest_doc_id = _read_latest_document_id()
        if latest_doc_id:
            where = {"document_id": latest_doc_id}

    results = search(
        query_embedding=query_vector,
        top_k=request.top_k,
        where=where,
    )

    formatted_results = []

    ids = results["ids"][0]
    documents = results["documents"][0]
    metadatas = results.get("metadatas")
    if metadatas is not None:
        metadatas = metadatas[0]
    else:
        metadatas = [{} for _ in ids]

    distances = results.get("distances")
    if distances is not None:
        distances = results["distances"][0]
    else:
        distances = [0.0] * len(ids)

    # Format response
    for chunk_id, text, distance, metadata in zip(ids, documents, distances, metadatas):
        metadata = metadata or {}
        formatted_results.append({
            "id": chunk_id,
            "score": float(distance) if distance is not None else 0.0,
            "text": text,
            "metadata": {
                "filename": metadata.get("filename"),
                "page": metadata.get("page"),
                "document_id": metadata.get("document_id"),
                "chunk_index": metadata.get("chunk_index"),
            }
        })

    return {"results": formatted_results}
from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes import auth, documents, chats

app = FastAPI(title="EduNova App Backend")

# Allow Next.js frontend to access the API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/auth", tags=["Auth"])
app.include_router(documents.router, prefix="/documents", tags=["Documents"])
app.include_router(chats.router, prefix="/chats", tags=["Chats"])

@app.get("/")
def read_root():
    return {"status": "ok", "message": "EduNova App Backend Running"}

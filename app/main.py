# app/main.py
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import CORS_ORIGINS, AUTO_INGEST_ON_STARTUP
from app.db import init_db
from app.routers import tokenize, embed, attention, sessions, chat, ingest, rag
from app.services.ingest_service import auto_ingest_if_needed
from app.services.vector_store import count


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    if AUTO_INGEST_ON_STARTUP:
        result = auto_ingest_if_needed()
        if result:
            print(
                f"[auto-ingest] {result['ingested']} chunks ingested, "
                f"total {result['total']} in vector store"
            )
    elif count() > 0:
        from app.services.retriever import build_bm25_from_store

        build_bm25_from_store()
    yield


app = FastAPI(title="AI-Brain Chat", version="0.1.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(tokenize.router)
app.include_router(embed.router)
app.include_router(attention.router)
app.include_router(sessions.router)
app.include_router(chat.router)
app.include_router(ingest.router)
app.include_router(rag.router)


@app.get("/health")
def health():
    return {"status": "ok"}

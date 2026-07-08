# app/main.py
from contextlib import asynccontextmanager

from fastapi import FastAPI

from app.db import init_db
from app.routers import tokenize, embed, attention, sessions, chat


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    yield


app = FastAPI(title="AI-Brain Chat", version="0.1.0", lifespan=lifespan)

app.include_router(tokenize.router)
app.include_router(embed.router)
app.include_router(attention.router)
app.include_router(sessions.router)
app.include_router(chat.router)


@app.get("/health")
def health():
    return {"status": "ok"}

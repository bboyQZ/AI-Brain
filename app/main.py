# app/main.py
from fastapi import FastAPI

from app.routers import tokenize

app = FastAPI(title="AI-Brain Chat", version="0.1.0")

app.include_router(tokenize.router)


@app.get("/health")
def health():
    return {"status": "ok"}

import json

from fastapi import APIRouter
from fastapi.responses import StreamingResponse

from app.models.schemas import ChatRequest
from app.services.rag_service import rag_chat

router = APIRouter(prefix="/chat", tags=["chat"])


@router.post("")
def chat(req: ChatRequest):
    def gen():
        for chunk in rag_chat(req.session_id, req.query):
            yield f"data: {json.dumps(chunk, ensure_ascii=False)}\n\n"
        yield "data: [DONE]\n\n"

    return StreamingResponse(
        gen(),
        media_type="text/event-stream",
        headers={"Content-Type": "text/event-stream; charset=utf-8"},
    )

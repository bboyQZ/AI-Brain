# app/routers/attention.py
from fastapi import APIRouter

from app.models.schemas import AttentionRequest, AttentionResponse
from app.services.attention_service import extract_attention

router = APIRouter(prefix="/attention", tags=["attention"])


@router.post("", response_model=AttentionResponse)
def run(req: AttentionRequest) -> AttentionResponse:
    return extract_attention(req.text)

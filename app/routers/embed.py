# app/routers/embed.py
from fastapi import APIRouter

from app.models.schemas import (
    EmbedRequest,
    EmbedResponse,
    SimilarityRequest,
    SimilarityResponse,
)
from app.services.embed_service import embed_texts, compute_similarity

router = APIRouter(prefix="/embed", tags=["embed"])


@router.post("/vectors", response_model=EmbedResponse)
def vectors(req: EmbedRequest) -> EmbedResponse:
    return embed_texts(req.texts)


@router.post("/similarity", response_model=SimilarityResponse)
def similarity(req: SimilarityRequest) -> SimilarityResponse:
    return compute_similarity(req.pairs)

# app/routers/tokenize.py
from fastapi import APIRouter

from app.models.schemas import TokenizeRequest, TokenizeResponse
from app.services.tokenize_service import tokenize

router = APIRouter(prefix="/tokenize", tags=["tokenize"])


@router.post("", response_model=TokenizeResponse)
def run(req: TokenizeRequest) -> TokenizeResponse:
    return tokenize(req.text, req.encoding)

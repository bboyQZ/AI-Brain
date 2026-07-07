# app/models/schemas.py
from pydantic import BaseModel


class TokenizeRequest(BaseModel):
    text: str
    encoding: str = "cl100k_base"


class TokenPiece(BaseModel):
    id: int
    piece: str


class TokenizeResponse(BaseModel):
    text: str
    token_count: int
    tokens: list[TokenPiece]
    encoding: str

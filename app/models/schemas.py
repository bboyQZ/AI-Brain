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


class EmbedRequest(BaseModel):
    texts: list[str]


class EmbedItem(BaseModel):
    text: str
    vector: list[float]
    dim: int


class EmbedResponse(BaseModel):
    items: list[EmbedItem]
    model: str


class SimilarityRequest(BaseModel):
    pairs: list[tuple[str, str]]


class SimilarityPair(BaseModel):
    a: str
    b: str
    score: float


class SimilarityResponse(BaseModel):
    pairs: list[SimilarityPair]
    model: str

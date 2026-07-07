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


class AttentionRequest(BaseModel):
    text: str


class AttentionLayer(BaseModel):
    layer: int
    heads: list[list[list[float]]]  # [head][query_token][key_token]


class AttentionResponse(BaseModel):
    text: str
    tokens: list[str]
    num_layers: int
    num_heads: int
    layers: list[AttentionLayer]
    model: str


class SessionCreate(BaseModel):
    title: str = "新对话"


class SessionInfo(BaseModel):
    id: int
    title: str
    created_at: str


class MessageCreate(BaseModel):
    role: str  # "user" | "assistant"
    content: str


class MessageInfo(BaseModel):
    id: int
    session_id: int
    role: str
    content: str
    created_at: str


class SessionHistory(BaseModel):
    session: SessionInfo
    messages: list[MessageInfo]

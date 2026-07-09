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


class SessionUpdate(BaseModel):
    title: str


class SessionInfo(BaseModel):
    id: int
    title: str
    created_at: str


class SourceRef(BaseModel):
    """一条引用来源：定位到知识库某文档的某章节。"""
    source: str            # 文件名，如 lesson-01-token-tokenizer.md
    source_type: str = ""  # "curriculum" | "note"
    section: str = ""      # 末级标题
    heading_path: str = "" # 标题路径，如 "本课目标 > 核心概念 > Token"


class MessageCreate(BaseModel):
    role: str  # "user" | "assistant"
    content: str


class MessageInfo(BaseModel):
    id: int
    session_id: int
    role: str
    content: str
    created_at: str
    sources: list[SourceRef] = []


class SessionHistory(BaseModel):
    session: SessionInfo
    messages: list[MessageInfo]


class ChatRequest(BaseModel):
    session_id: int
    query: str


class ChatChunk(BaseModel):
    delta: str = ""
    sources: list[SourceRef] = []


class KnowledgeDocInfo(BaseModel):
    id: str           # 文件名（含 .md）
    title: str        # 首个 # 标题，缺省用文件名
    source_type: str  # "curriculum" | "note"


class KnowledgeDocDetail(KnowledgeDocInfo):
    content: str  # 原始 markdown


class RagChunkRequest(BaseModel):
    text: str
    chunk_size: int = 200
    chunk_overlap: int = 50
    mode: str = "simple"  # simple | markdown


class RagChunkResponse(BaseModel):
    chunks: list[str]
    sections: list[str]
    chunk_count: int
    mode: str


class RagRetrieveRequest(BaseModel):
    query: str
    top_k: int = 3


class RagRetrieveHit(BaseModel):
    content: str
    score: float
    source: str = ""
    section: str = ""


class RagRetrieveResponse(BaseModel):
    query: str
    hits: list[RagRetrieveHit]
    total_in_store: int
    message: str | None = None

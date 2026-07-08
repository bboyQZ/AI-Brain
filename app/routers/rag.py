from fastapi import APIRouter

from app.models.schemas import (
    RagChunkRequest,
    RagChunkResponse,
    RagRetrieveRequest,
    RagRetrieveResponse,
    RagRetrieveHit,
)
from app.services.rag_lab_service import (
    chunk_text_simple,
    chunk_text_markdown,
    lab_retrieve,
)
from app.services.vector_store import count

router = APIRouter(prefix="/rag", tags=["rag"])


@router.post("/chunk", response_model=RagChunkResponse)
def chunk(req: RagChunkRequest) -> RagChunkResponse:
    if req.mode == "markdown":
        items = chunk_text_markdown(req.text)
        chunks = [c["content"] for c in items]
        sections = [c.get("heading_path") or c.get("section", "") for c in items]
    else:
        chunks = chunk_text_simple(req.text, req.chunk_size, req.chunk_overlap)
        sections = [""] * len(chunks)
    return RagChunkResponse(
        chunks=chunks,
        sections=sections,
        chunk_count=len(chunks),
        mode=req.mode,
    )


@router.post("/retrieve", response_model=RagRetrieveResponse)
def retrieve(req: RagRetrieveRequest) -> RagRetrieveResponse:
    total = count()
    if total == 0:
        return RagRetrieveResponse(
            query=req.query,
            hits=[],
            total_in_store=0,
            message="向量库为空，请先运行 python scripts/ingest.py",
        )
    results = lab_retrieve(req.query, top_k=req.top_k)
    hits = [
        RagRetrieveHit(
            content=r["content"],
            score=round(float(r.get("score", 0)), 4),
            source=r.get("metadata", {}).get("source", ""),
            section=r.get("metadata", {}).get("heading_path")
            or r.get("metadata", {}).get("section", ""),
        )
        for r in results
    ]
    return RagRetrieveResponse(
        query=req.query,
        hits=hits,
        total_in_store=total,
        message=None,
    )

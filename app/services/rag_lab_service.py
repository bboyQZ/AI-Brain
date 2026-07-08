"""概念实验室 RAG 演示：切块与检索。"""

from app.services.chunker import chunk_markdown
from app.services.retriever import hybrid_retrieve
from app.services.vector_store import count


def chunk_text_simple(
    text: str,
    chunk_size: int = 200,
    chunk_overlap: int = 50,
) -> list[str]:
    if chunk_size <= 0:
        return []
    overlap = max(0, min(chunk_overlap, chunk_size - 1))
    chunks: list[str] = []
    start = 0
    n = len(text)
    while start < n:
        end = min(start + chunk_size, n)
        piece = text[start:end].strip()
        if piece:
            chunks.append(piece)
        if end >= n:
            break
        start = end - overlap
    return chunks


def chunk_text_markdown(text: str) -> list[dict]:
    return chunk_markdown(text, source="lab.md", source_type="lab")


def lab_retrieve(query: str, top_k: int = 3) -> list[dict]:
    if count() == 0:
        return []
    return hybrid_retrieve(query, top_k=top_k)

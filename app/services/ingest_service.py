from pathlib import Path

from app.config import ROOT
from app.services.chunker import chunk_markdown
from app.services.vector_store import add_chunks, count, clear
from app.services.retriever import build_bm25_index


def ingest_dir(dir_path: Path, source_type: str) -> list[dict]:
    all_chunks: list[dict] = []
    if not dir_path.exists():
        return all_chunks
    for md in dir_path.glob("*.md"):
        text = md.read_text(encoding="utf-8")
        chunks = chunk_markdown(text, source=md.name, source_type=source_type)
        all_chunks.extend(chunks)
    return all_chunks


def run_ingest(reset: bool = False) -> dict:
    """扫描 curriculum/ + knowledge/，切片+embedding+入 Chroma，重建 BM25。

    返回 {"ingested": n, "total": m}。
    reset=True 时先清空向量库（全量重建）。
    """
    if reset:
        clear()
    c1 = ingest_dir(ROOT / "curriculum", "curriculum")
    c2 = ingest_dir(ROOT / "knowledge", "note")
    all_chunks = c1 + c2
    add_chunks(all_chunks)
    build_bm25_index(all_chunks)
    return {"ingested": len(all_chunks), "total": count()}

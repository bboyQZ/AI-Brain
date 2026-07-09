import hashlib
import json
import re
from pathlib import Path

from app.config import ROOT, DATA_DIR
from app.utils.text_io import read_text_auto
from app.services.chunker import chunk_markdown
from app.services.vector_store import add_chunks, count, clear
from app.services.retriever import build_bm25_index, build_bm25_from_store

MANIFEST_PATH = DATA_DIR / "ingest_manifest.json"

KNOWLEDGE_DIRS: tuple[tuple[Path, str], ...] = (
    (ROOT / "curriculum", "curriculum"),
    (ROOT / "knowledge", "note"),
)


def _extract_title(text: str, fallback: str) -> str:
    m = re.search(r"^#\s+(.+)$", text, re.MULTILINE)
    return m.group(1).strip() if m else fallback


def list_knowledge_docs() -> list[dict]:
    """列出 curriculum/ + knowledge/ 全部文档元信息（不含正文）。

    课程按文件名正序（lesson-01 在前），笔记按文件名倒序（日期新的在前）。
    """
    docs: list[dict] = []
    for dir_path, source_type in KNOWLEDGE_DIRS:
        if not dir_path.exists():
            continue
        files = sorted(dir_path.glob("*.md"), reverse=(source_type == "note"))
        for md in files:
            text = read_text_auto(md)
            docs.append({
                "id": md.name,
                "title": _extract_title(text, md.stem),
                "source_type": source_type,
            })
    return docs


def read_knowledge_doc(doc_id: str) -> dict | None:
    """按文件名读取单篇文档原文。找不到或文件名非法时返回 None。"""
    if doc_id != Path(doc_id).name or not doc_id.endswith(".md"):
        return None
    for dir_path, source_type in KNOWLEDGE_DIRS:
        candidate = dir_path / doc_id
        if candidate.is_file():
            text = read_text_auto(candidate)
            return {
                "id": doc_id,
                "title": _extract_title(text, candidate.stem),
                "source_type": source_type,
                "content": text,
            }
    return None


def ingest_dir(dir_path: Path, source_type: str) -> list[dict]:
    all_chunks: list[dict] = []
    if not dir_path.exists():
        return all_chunks
    for md in sorted(dir_path.glob("*.md")):
        text = read_text_auto(md)
        chunks = chunk_markdown(text, source=md.name, source_type=source_type)
        all_chunks.extend(chunks)
    return all_chunks


def compute_sources_fingerprint() -> str:
    """对 curriculum/ + knowledge/ 下所有 .md 内容计算指纹，用于检测变更。"""
    h = hashlib.sha256()
    for dir_path, _ in KNOWLEDGE_DIRS:
        if not dir_path.exists():
            continue
        for md in sorted(dir_path.glob("*.md")):
            h.update(md.name.encode("utf-8"))
            h.update(read_text_auto(md).encode("utf-8"))
    return h.hexdigest()


def load_ingest_manifest() -> dict:
    if not MANIFEST_PATH.exists():
        return {}
    try:
        return json.loads(MANIFEST_PATH.read_text(encoding="utf-8"))
    except (json.JSONDecodeError, OSError):
        return {}


def save_ingest_manifest(fingerprint: str, result: dict) -> None:
    payload = {
        "fingerprint": fingerprint,
        "ingested": result.get("ingested", 0),
        "total": result.get("total", 0),
    }
    MANIFEST_PATH.write_text(
        json.dumps(payload, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )


def sources_changed() -> bool:
    current = compute_sources_fingerprint()
    saved = load_ingest_manifest().get("fingerprint")
    return saved != current


def run_ingest(reset: bool = False) -> dict:
    """扫描 curriculum/ + knowledge/，切片+embedding+入 Chroma，重建 BM25。

    返回 {"ingested": n, "total": m}。
    reset=True 时先清空向量库（全量重建）。
    """
    if reset:
        clear()
    all_chunks: list[dict] = []
    for dir_path, source_type in KNOWLEDGE_DIRS:
        all_chunks.extend(ingest_dir(dir_path, source_type))
    add_chunks(all_chunks)
    build_bm25_index(all_chunks)
    result = {"ingested": len(all_chunks), "total": count()}
    save_ingest_manifest(compute_sources_fingerprint(), result)
    return result


def auto_ingest_if_needed() -> dict | None:
    """知识源有变更或向量库为空时全量入库；否则仅重建 BM25 索引。

    返回入库结果；无需入库时返回 None。
    """
    if count() == 0 or sources_changed():
        return run_ingest(reset=True)
    build_bm25_from_store()
    return None

from pathlib import Path

from app.models.schemas import SourceRef
from app.services.retriever import hybrid_retrieve
from app.services.llm_client import get_llm
from app.services.session_store import add_message

# 项目根目录 /prompts —— 改提示词只改这里的文本文件即可
_PROMPTS_DIR = Path(__file__).resolve().parents[2] / "prompts"
# filename -> (mtime_ns, content)；文件变更后自动重读，无需重启
_PROMPT_CACHE: dict[str, tuple[int, str]] = {}


def _load_prompt(filename: str) -> str:
    path = _PROMPTS_DIR / filename
    if not path.is_file():
        raise FileNotFoundError(f"提示词文件不存在: {path}")
    mtime_ns = path.stat().st_mtime_ns
    cached = _PROMPT_CACHE.get(filename)
    if cached and cached[0] == mtime_ns:
        return cached[1]
    content = path.read_text(encoding="utf-8").strip()
    _PROMPT_CACHE[filename] = (mtime_ns, content)
    return content


def build_context(results: list[dict]) -> str:
    parts = []
    for i, r in enumerate(results, 1):
        meta = r.get("metadata", {})
        src = meta.get("heading_path") or meta.get("section") or meta.get("source", "")
        parts.append(f"[资料{i} - {src}]\n{r['content']}")
    return "\n\n".join(parts)


def build_source_refs(results: list[dict]) -> list[SourceRef]:
    """把检索结果组装为结构化引用，按 source+heading_path 去重、保留检索顺序。"""
    refs: list[SourceRef] = []
    seen: set[tuple[str, str]] = set()
    for r in results:
        meta = r.get("metadata", {})
        source = meta.get("source", "")
        if not source:
            continue
        heading_path = meta.get("heading_path", "") or meta.get("section", "")
        key = (source, heading_path)
        if key in seen:
            continue
        seen.add(key)
        refs.append(SourceRef(
            source=source,
            source_type=meta.get("source_type", ""),
            section=meta.get("section", ""),
            heading_path=heading_path,
        ))
    return refs


def rag_chat(session_id: int, query: str):
    """流式 RAG 问答生成器。yield dict(delta=..., sources=...)。

    注意：用户消息由前端通过 POST /sessions/{id}/messages 落库，
    这里只负责流式生成并落库 assistant 消息（含引用），避免重复存储。
    """
    results = hybrid_retrieve(query, top_k=4)
    context = build_context(results)
    user_prompt = _load_prompt("rag_user.txt").format(context=context, query=query)

    messages = [
        {"role": "system", "content": _load_prompt("rag_system.txt")},
        {"role": "user", "content": user_prompt},
    ]
    llm = get_llm()
    stream = llm.chat(messages, stream=True)

    source_refs = build_source_refs(results)
    sources_payload = [s.model_dump() for s in source_refs]
    full = ""
    sent_sources = False
    for chunk in stream:
        delta = chunk.choices[0].delta.content or ""
        full += delta
        payload = {"delta": delta}
        if not sent_sources:
            payload["sources"] = sources_payload
            sent_sources = True
        yield payload
    add_message(session_id, "assistant", full, sources=source_refs)

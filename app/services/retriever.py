from rank_bm25 import BM25Okapi

from app.services.vector_store import query_by_vector, all_chunks

_bm25: BM25Okapi | None = None
_bm25_docs: list[str] = []
_bm25_metas: list[dict] = []


def _tokenize(text: str) -> list[str]:
    """中文友好分词：按字符切（去除空白），兼顾英文按空格的词。

    对中文按字、对英文按词的混合策略，避免纯 split() 对中文完全失效。
    """
    tokens: list[str] = []
    for word in text.split():
        if word.isascii():
            tokens.append(word.lower())
        else:
            tokens.extend(list(word))
    return tokens


def build_bm25_index(chunks: list[dict]) -> None:
    global _bm25, _bm25_docs, _bm25_metas
    _bm25_docs = [c["content"] for c in chunks]
    _bm25_metas = [c.get("metadata", c) for c in chunks]
    tokenized = [_tokenize(d) for d in _bm25_docs]
    _bm25 = BM25Okapi(tokenized)


def build_bm25_from_store() -> None:
    """从向量库重建 BM25 索引（用于进程重启后无需重新 ingest）。"""
    chunks = all_chunks()
    if chunks:
        build_bm25_index(chunks)


def hybrid_retrieve(query: str, top_k: int = 5, alpha: float = 0.5) -> list[dict]:
    vec_results = query_by_vector(query, top_k=top_k * 2)
    if _bm25 is None:
        return vec_results[:top_k]
    bm25_scores = _bm25.get_scores(_tokenize(query))
    bm25_pairs = list(zip(_bm25_docs, _bm25_metas, bm25_scores))
    bm25_pairs.sort(key=lambda x: x[2], reverse=True)
    bm25_results = [
        {"content": d, "metadata": m, "score": s}
        for d, m, s in bm25_pairs[: top_k * 2]
    ]
    merged = _merge(vec_results, bm25_results, alpha)
    return merged[:top_k]


def _merge(vec_results: list[dict], bm25_results: list[dict], alpha: float) -> list[dict]:
    score_map: dict[str, dict] = {}
    vec_max = max((r.get("score", 0) for r in vec_results), default=1.0) or 1.0
    bm25_max = max((r.get("score", 0) for r in bm25_results), default=1.0) or 1.0

    for r in vec_results:
        content = r["content"]
        score_map[content] = {
            "content": content,
            "metadata": r.get("metadata", {}),
            "score": alpha * (r.get("score", 0) / vec_max),
        }
    for r in bm25_results:
        content = r["content"]
        norm = r.get("score", 0) / bm25_max
        if content in score_map:
            score_map[content]["score"] += (1 - alpha) * norm
        else:
            score_map[content] = {
                "content": content,
                "metadata": r.get("metadata", {}),
                "score": (1 - alpha) * norm,
            }
    return sorted(score_map.values(), key=lambda x: x["score"], reverse=True)

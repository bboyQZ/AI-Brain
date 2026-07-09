import chromadb

from app.deps import get_embed_model
from app.config import DATA_DIR

_client = None
_collection = None


def _get_collection():
    global _client, _collection
    if _collection is None:
        _client = chromadb.PersistentClient(path=str(DATA_DIR / "chroma"))
        _collection = _client.get_or_create_collection("ai_brain")
    return _collection


def add_chunks(chunks: list[dict]) -> None:
    if not chunks:
        return
    model = get_embed_model()
    texts = [c["content"] for c in chunks]
    vecs = model.encode(texts, normalize_embeddings=True).tolist()
    ids = [f"{c['source']}_{i}" for i, c in enumerate(chunks)]
    metadatas = [{k: v for k, v in c.items() if k != "content"} for c in chunks]
    col = _get_collection()
    col.upsert(ids=ids, embeddings=vecs, documents=texts, metadatas=metadatas)


def query_by_vector(text: str, top_k: int = 5) -> list[dict]:
    model = get_embed_model()
    vec = model.encode([text], normalize_embeddings=True).tolist()
    col = _get_collection()
    res = col.query(query_embeddings=vec, n_results=top_k)
    results = []
    for i in range(len(res["ids"][0])):
        results.append({
            "content": res["documents"][0][i],
            "metadata": res["metadatas"][0][i],
            "score": 1 - res["distances"][0][i],
        })
    return results


def all_chunks() -> list[dict]:
    col = _get_collection()
    res = col.get()
    return [
        {"content": doc, "metadata": meta}
        for doc, meta in zip(res.get("documents", []), res.get("metadatas", []))
    ]


def count() -> int:
    return _get_collection().count()


def clear() -> None:
    global _collection
    _get_collection()  # 确保 client 已初始化，否则从未查询过的进程里 clear 会静默失效
    _client.delete_collection("ai_brain")
    _collection = None
    _get_collection()

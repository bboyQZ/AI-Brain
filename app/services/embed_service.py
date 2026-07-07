# app/services/embed_service.py
import numpy as np

from app.deps import get_embed_model
from app.models.schemas import (
    EmbedResponse,
    EmbedItem,
    SimilarityResponse,
    SimilarityPair,
)


def _model_name(model) -> str:
    # sentence-transformers >= 5 移除了 SentenceTransformer.model_name 属性，
    # 改为从内部 transformer 的 HuggingFace auto_model.name_or_path 获取。
    try:
        return model[0].auto_model.name_or_path
    except (AttributeError, IndexError):
        return getattr(model, "model_name", "unknown")


def embed_texts(texts: list[str]) -> EmbedResponse:
    model = get_embed_model()
    vecs = model.encode(texts, normalize_embeddings=True)
    items = [
        EmbedItem(text=t, vector=v.tolist(), dim=len(v))
        for t, v in zip(texts, vecs)
    ]
    return EmbedResponse(items=items, model=_model_name(model))


def compute_similarity(pairs: list[tuple[str, str]]) -> SimilarityResponse:
    model = get_embed_model()
    all_texts = list({t for pair in pairs for t in pair})
    emb_map = {}
    if all_texts:
        vecs = model.encode(all_texts, normalize_embeddings=True)
        for t, v in zip(all_texts, vecs):
            emb_map[t] = np.array(v)
    result = []
    for a, b in pairs:
        va, vb = emb_map[a], emb_map[b]
        score = float(np.dot(va, vb))
        result.append(SimilarityPair(a=a, b=b, score=score))
    return SimilarityResponse(pairs=result, model=_model_name(model))

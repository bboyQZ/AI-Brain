from app.services.retriever import build_bm25_index, hybrid_retrieve
from app.services.vector_store import clear, add_chunks


def test_hybrid_retrieve():
    clear()
    chunks = [
        {
            "content": "RAG 是检索增强生成",
            "source": "t1",
            "source_type": "curriculum",
            "section": "1",
            "heading_path": "1",
            "created_at": "2026-01-01",
        },
        {
            "content": "Transformer 用注意力机制",
            "source": "t2",
            "source_type": "curriculum",
            "section": "2",
            "heading_path": "2",
            "created_at": "2026-01-01",
        },
    ]
    add_chunks(chunks)
    build_bm25_index(chunks)
    results = hybrid_retrieve("什么是 RAG", top_k=2)
    assert len(results) <= 2
    assert "RAG" in results[0]["content"]

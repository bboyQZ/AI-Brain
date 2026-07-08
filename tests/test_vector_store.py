from app.services.vector_store import add_chunks, query_by_vector, count, clear


def test_add_and_query():
    clear()
    chunks = [
        {
            "content": "RAG 是检索增强生成",
            "source": "test_rag",
            "source_type": "curriculum",
            "section": "rag",
            "heading_path": "rag",
            "created_at": "2026-01-01",
        },
        {
            "content": "Transformer 用注意力机制",
            "source": "test_attn",
            "source_type": "curriculum",
            "section": "attn",
            "heading_path": "attn",
            "created_at": "2026-01-01",
        },
    ]
    add_chunks(chunks)
    assert count() == 2
    results = query_by_vector("什么是 RAG", top_k=1)
    assert len(results) == 1
    assert "RAG" in results[0]["content"]

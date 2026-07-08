from app.services.rag_lab_service import chunk_text_simple, chunk_text_markdown


def test_chunk_simple_with_overlap():
    text = "abcdefghijklmnop"
    chunks = chunk_text_simple(text, chunk_size=6, chunk_overlap=2)
    assert chunks[0] == "abcdef"
    assert chunks[1] == "efghij"
    assert len(chunks) >= 2


def test_chunk_markdown_by_heading():
    md = "# A\n\npara one.\n\n## B\n\npara two."
    items = chunk_text_markdown(md)
    assert len(items) >= 2
    assert any("para one" in c["content"] for c in items)

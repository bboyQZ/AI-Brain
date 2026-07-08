from app.services.chunker import chunk_markdown


def test_chunk_by_heading():
    md = "# 标题\n概述\n## 第一节\n内容A\n## 第二节\n内容B"
    chunks = chunk_markdown(md, source="test.md", source_type="curriculum")
    assert len(chunks) >= 2
    sections = [c["section"] for c in chunks]
    assert "第一节" in sections
    assert "第二节" in sections
    assert all(c["source_type"] == "curriculum" for c in chunks)


def test_long_section_split():
    long_para = "这是一个很长的段落。" * 200
    md = f"## 长节\n{long_para}"
    chunks = chunk_markdown(md, source="test.md", source_type="curriculum")
    assert len(chunks) > 1


def test_metadata_present():
    md = "## 节\n内容"
    chunks = chunk_markdown(md, source="lesson-01.md", source_type="curriculum")
    assert "source" in chunks[0]
    assert "section" in chunks[0]
    assert "heading_path" in chunks[0]
    assert "created_at" in chunks[0]


def test_heading_path_nested():
    md = "# 大标题\n## 子标题\n内容"
    chunks = chunk_markdown(md, source="test.md", source_type="note")
    paths = [c["heading_path"] for c in chunks]
    assert "大标题 > 子标题" in paths

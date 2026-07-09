# tests/test_knowledge.py
from app.services.rag_service import build_source_refs


def test_list_docs(client):
    resp = client.get("/knowledge/docs")
    assert resp.status_code == 200
    docs = resp.json()
    curriculum = [d for d in docs if d["source_type"] == "curriculum"]
    assert len(curriculum) >= 7
    # 课程按文件名正序
    ids = [d["id"] for d in curriculum]
    assert ids == sorted(ids)
    # 标题取自首个 # 标题
    lesson1 = next(d for d in curriculum if d["id"].startswith("lesson-01"))
    assert "Token" in lesson1["title"]


def test_get_doc(client):
    resp = client.get("/knowledge/docs/lesson-01-token-tokenizer.md")
    assert resp.status_code == 200
    doc = resp.json()
    assert doc["id"] == "lesson-01-token-tokenizer.md"
    assert doc["source_type"] == "curriculum"
    assert "# Lesson 1" in doc["content"]


def test_get_doc_not_found(client):
    resp = client.get("/knowledge/docs/no-such-doc.md")
    assert resp.status_code == 404


def test_get_doc_rejects_traversal(client):
    for bad in ("..%2F..%2Fapp%2Fconfig.py", "config.py", "..%5C.env"):
        resp = client.get(f"/knowledge/docs/{bad}")
        assert resp.status_code == 404, bad


def test_message_sources_roundtrip(client):
    """assistant 消息带 sources 落库后，history 能原样读回。"""
    from app.services.session_store import add_message
    from app.models.schemas import SourceRef

    s = client.post("/sessions", json={"title": "t"}).json()
    sid = s["id"]
    refs = [SourceRef(
        source="lesson-01-token-tokenizer.md",
        source_type="curriculum",
        section="Token",
        heading_path="Lesson 1：Token 与 Tokenizer > 核心概念 > Token",
    )]
    add_message(sid, "assistant", "回答内容", sources=refs)

    hist = client.get(f"/sessions/{sid}").json()
    msg = hist["messages"][-1]
    assert msg["sources"] == [refs[0].model_dump()]


def test_message_without_sources_defaults_empty(client):
    s = client.post("/sessions", json={"title": "t"}).json()
    sid = s["id"]
    client.post(f"/sessions/{sid}/messages", json={"role": "user", "content": "问"})
    hist = client.get(f"/sessions/{sid}").json()
    assert hist["messages"][-1]["sources"] == []


def test_build_source_refs_dedup_and_order():
    results = [
        {"content": "a", "metadata": {
            "source": "lesson-01.md", "source_type": "curriculum",
            "section": "Token", "heading_path": "L1 > Token"}},
        {"content": "b", "metadata": {
            "source": "lesson-01.md", "source_type": "curriculum",
            "section": "Token", "heading_path": "L1 > Token"}},  # 重复
        {"content": "c", "metadata": {
            "source": "lesson-02.md", "source_type": "curriculum",
            "section": "Embedding", "heading_path": "L2 > Embedding"}},
        {"content": "d", "metadata": {"source": ""}},  # 无 source 跳过
    ]
    refs = build_source_refs(results)
    assert len(refs) == 2
    assert refs[0].source == "lesson-01.md"
    assert refs[1].source == "lesson-02.md"
    assert refs[0].heading_path == "L1 > Token"

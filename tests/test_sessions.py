# tests/test_sessions.py


def test_create_session(client):
    resp = client.post("/sessions", json={"title": "测试对话"})
    assert resp.status_code == 200
    data = resp.json()
    assert data["title"] == "测试对话"
    assert "id" in data
    assert "created_at" in data


def test_add_message(client):
    s = client.post("/sessions", json={"title": "t"}).json()
    sid = s["id"]
    resp = client.post(f"/sessions/{sid}/messages", json={"role": "user", "content": "你好"})
    assert resp.status_code == 200
    m = resp.json()
    assert m["role"] == "user"
    assert m["content"] == "你好"
    assert m["session_id"] == sid


def test_get_history(client):
    s = client.post("/sessions", json={"title": "t"}).json()
    sid = s["id"]
    client.post(f"/sessions/{sid}/messages", json={"role": "user", "content": "问"})
    client.post(f"/sessions/{sid}/messages", json={"role": "assistant", "content": "答"})
    resp = client.get(f"/sessions/{sid}")
    assert resp.status_code == 200
    data = resp.json()
    assert data["session"]["id"] == sid
    assert len(data["messages"]) == 2
    assert data["messages"][0]["role"] == "user"
    assert data["messages"][1]["role"] == "assistant"


def test_list_sessions(client):
    client.post("/sessions", json={"title": "a"})
    client.post("/sessions", json={"title": "b"})
    resp = client.get("/sessions")
    assert resp.status_code == 200
    assert len(resp.json()) >= 2


def test_history_not_found(client):
    resp = client.get("/sessions/99999")
    assert resp.status_code == 404


def _derive_title_for_test(content: str, limit: int = 20) -> str:
    normalized = " ".join(content.split())
    default = "新对话"
    if not normalized:
        return default
    if len(normalized) <= limit:
        return normalized
    return normalized[:limit].rstrip() + "..."


def test_first_user_message_auto_titles_new_session(client):
    session = client.post("/sessions", json={"title": "新对话"}).json()
    sid = session["id"]

    content = "什么是 Transformer 的残差连接以及它为什么能缓解梯度消失问题"
    client.post(f"/sessions/{sid}/messages", json={"role": "user", "content": content})

    listed = client.get("/sessions").json()
    current = next(item for item in listed if item["id"] == sid)
    assert current["title"] == _derive_title_for_test(content)


def test_patch_session_title(client):
    session = client.post("/sessions", json={"title": "旧标题"}).json()
    sid = session["id"]

    resp = client.patch(f"/sessions/{sid}", json={"title": "新标题"})
    assert resp.status_code == 200
    assert resp.json()["title"] == "新标题"


def test_delete_session_removes_messages_and_session(client):
    session = client.post("/sessions", json={"title": "待删除"}).json()
    sid = session["id"]
    client.post(f"/sessions/{sid}/messages", json={"role": "user", "content": "hello"})

    resp = client.delete(f"/sessions/{sid}")
    assert resp.status_code == 204

    history = client.get(f"/sessions/{sid}")
    assert history.status_code == 404

    listed = client.get("/sessions").json()
    assert all(item["id"] != sid for item in listed)

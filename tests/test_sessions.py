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

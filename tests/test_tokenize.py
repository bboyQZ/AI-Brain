# tests/test_tokenize.py
def test_tokenize_english(client):
    resp = client.post("/tokenize", json={"text": "Hello"})
    assert resp.status_code == 200
    data = resp.json()
    assert data["text"] == "Hello"
    assert data["token_count"] >= 1
    assert len(data["tokens"]) == data["token_count"]
    assert all("id" in t and "piece" in t for t in data["tokens"])


def test_tokenize_chinese(client):
    resp = client.post("/tokenize", json={"text": "你好"})
    assert resp.status_code == 200
    data = resp.json()
    assert data["token_count"] >= 1


def test_tokenize_empty(client):
    resp = client.post("/tokenize", json={"text": ""})
    assert resp.status_code == 200
    assert resp.json()["token_count"] == 0

# tests/test_embed.py
def test_embed_single(client):
    resp = client.post("/embed/vectors", json={"texts": ["你好"]})
    assert resp.status_code == 200
    data = resp.json()
    assert len(data["items"]) == 1
    assert data["items"][0]["text"] == "你好"
    assert len(data["items"][0]["vector"]) == data["items"][0]["dim"]
    assert data["items"][0]["dim"] > 0


def test_embed_multiple(client):
    resp = client.post("/embed/vectors", json={"texts": ["北京", "上海", "苹果"]})
    assert resp.status_code == 200
    assert len(resp.json()["items"]) == 3


def test_similarity_high(client):
    resp = client.post("/embed/similarity", json={"pairs": [["北京", "上海"]]})
    assert resp.status_code == 200
    score = resp.json()["pairs"][0]["score"]
    assert 0 <= score <= 1


def test_similarity_low(client):
    resp = client.post("/embed/similarity", json={"pairs": [["北京", "香蕉"]]})
    assert resp.status_code == 200
    score = resp.json()["pairs"][0]["score"]
    assert 0 <= score <= 1

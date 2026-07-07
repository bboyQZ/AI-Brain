# tests/test_attention.py


def test_attention_basic(client):
    resp = client.post("/attention", json={"text": "苹果发布手机"})
    assert resp.status_code == 200
    data = resp.json()
    assert data["text"] == "苹果发布手机"
    assert len(data["tokens"]) > 0
    assert data["num_layers"] > 0
    assert data["num_heads"] > 0
    assert len(data["layers"]) == data["num_layers"]
    first_layer = data["layers"][0]
    assert first_layer["layer"] == 0
    seq_len = len(data["tokens"])
    assert len(first_layer["heads"]) == data["num_heads"]
    assert len(first_layer["heads"][0]) == seq_len
    assert len(first_layer["heads"][0][0]) == seq_len


def test_attention_weights_sum_to_one(client):
    resp = client.post("/attention", json={"text": "你好世界"})
    data = resp.json()
    head = data["layers"][0]["heads"][0]
    for row in head:
        assert abs(sum(row) - 1.0) < 0.01

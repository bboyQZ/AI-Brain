r"""
Lesson 4 动手练习：Attention 与 Q/K/V 的玩具演示。

推荐运行（PowerShell）：
    Set-Location "D:\develop\AI-Brain"
    pip install -r ".\requirements.txt"
    python ".\examples\lesson04_attention.py"
"""

import numpy as np

# ── 玩具 Embedding（2 维）：刻意拉开「科技」与「食物」方向 ──
EMBEDDINGS: dict[str, np.ndarray] = {
    "苹果": np.array([0.50, 0.50]),
    "发布": np.array([0.85, 0.15]),
    "手机": np.array([0.95, 0.05]),
    "很": np.array([0.35, 0.65]),
    "好吃": np.array([0.10, 0.90]),
}

# W_Q 让 Query 更偏向「科技轴」，便于在「发布/手机」句子里拉高相关 Token 权重
W_Q = np.array([[1.0, -0.3], [0.0, 0.7]])
W_K = np.array([[1.0, 0.0], [0.0, 1.0]])
W_V = np.array([[1.0, 0.0], [0.0, 1.0]])
# 食物语境下的 W_Q（示意：多层 Transformer 后 Query 会随上下文变化）
W_Q_FOOD = np.array([[0.3, 0.0], [0.0, 1.0]])


def softmax(x: np.ndarray) -> np.ndarray:
    exp_x = np.exp(x - np.max(x))
    return exp_x / exp_x.sum()


def to_qkv(embedding: np.ndarray, w_q: np.ndarray = W_Q) -> tuple[np.ndarray, np.ndarray, np.ndarray]:
    """Q = E × W_Q, K = E × W_K, V = E × W_V"""
    q = embedding @ w_q
    k = embedding @ W_K
    v = embedding @ W_V
    return q, k, v


def attention(query: np.ndarray, keys: list[np.ndarray], values: list[np.ndarray], labels: list[str]) -> np.ndarray:
    """计算 Attention Score 并加权融合 Value。"""
    scores = np.array([query @ k for k in keys])
    weights = softmax(scores)

    print(f"    {'Token':<6} {'Score':>8} {'Weight':>8}")
    print("    " + "-" * 26)
    for label, score, weight in zip(labels, scores, weights):
        bar = "★" * int(weight * 20)
        print(f"    {label:<6} {score:>8.3f} {weight:>8.3f}  {bar}")

    output = sum(w * v for w, v in zip(weights, values))
    return output


def demo_sentence(
    sentence: str,
    tokens: list[str],
    focus: str,
    w_q: np.ndarray | None = None,
) -> None:
    w_q = w_q if w_q is not None else W_Q
    print(f"\n句子: {sentence}")
    print(f"关注 Token: 「{focus}」")

    embeds = [EMBEDDINGS[t] for t in tokens]
    q, k, v = zip(*(to_qkv(e, w_q) for e in embeds))

    focus_idx = tokens.index(focus)
    print(f"\n  Step 1: E → Q/K/V（以「{focus}」为例）")
    print(f"    E = {embeds[focus_idx]}")
    print(f"    Q = E × W_Q = {q[focus_idx]}")

    print(f"\n  Step 2: 「{focus}」的 Query 查看所有 Key，计算 Attention")
    updated = attention(q[focus_idx], list(k), list(v), tokens)

    print(f"\n  Step 3: 加权融合 Value，更新「{focus}」的向量")
    print(f"    初始 E = {embeds[focus_idx]}")
    print(f"    更新后 ≈ {updated.round(3)}  （已融入上下文信息）")


def main() -> None:
    print("Lesson 4 — Transformer 与 Attention 演示")

    demo_sentence("苹果 发布 手机", ["苹果", "发布", "手机"], "苹果", w_q=W_Q)
    demo_sentence("苹果 很 好吃", ["苹果", "很", "好吃"], "苹果", w_q=W_Q_FOOD)

    print(f"\n{'─' * 50}")
    print("结论: Embedding 固定；Attention 按上下文动态融合，同一 Token 语义不同。")
    print("提示: 真实模型有数十层 Transformer，W_Q/W_K/W_V 维度为 768+。")


if __name__ == "__main__":
    main()

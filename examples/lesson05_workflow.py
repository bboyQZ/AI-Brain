r"""
Lesson 5 动手练习：Position Encoding 与逐 Token 生成循环。

推荐运行（PowerShell）：
    Set-Location "D:\develop\AI-Brain"
    pip install -r ".\requirements.txt"
    python ".\examples\lesson05_workflow.py"
"""

import numpy as np

# ── 玩具词表与 Embedding ──
VOCAB = ["《", "原神", "》", "是", "一款", "开放世界", "游戏", "。"]
EMBEDDINGS = {w: np.array([i * 0.1, 1.0 - i * 0.1]) for i, w in enumerate(VOCAB)}

# 位置编码（玩具：位置越靠后，第二维越高）
def position_vector(pos: int) -> np.ndarray:
    return np.array([0.0, pos * 0.05])


def softmax(x: np.ndarray) -> np.ndarray:
    exp_x = np.exp(x - np.max(x))
    return exp_x / exp_x.sum()


def lm_head(hidden: np.ndarray) -> dict[str, float]:
    """玩具 LM Head：用 Hidden State 与每个词 Embedding 的点积作为 Logit。"""
    return {word: float(hidden @ emb) for word, emb in EMBEDDINGS.items()}


def predict_next(hidden: np.ndarray) -> tuple[str, float]:
    logits = np.array(list(lm_head(hidden).values()))
    probs = softmax(logits)
    idx = int(np.argmax(probs))
    return VOCAB[idx], float(probs[idx])


def show_position_encoding() -> None:
    print("【1】Embedding + Position Encoding")
    tokens = ["原神", "是", "什么"]
    for i, token in enumerate(tokens):
        e = EMBEDDINGS.get(token, np.array([0.5, 0.5]))  # 「什么」用默认向量
        p = position_vector(i)
        final = e + p
        print(f"  位置 {i} 「{token}」: E={e} + P={p} = {final.round(3)}")


def show_generation_loop() -> None:
    print("\n【2】逐 Token 生成（Next Token Prediction）")
    prompt = "原神是什么类型的游戏"
    generated: list[str] = []
    print(f"  用户输入: {prompt}")

    # 玩具 Hidden State：随已生成长度缓慢变化，模拟 Transformer 输出
    for step in range(6):
        hidden = np.array([0.3 + step * 0.1, 0.7 - step * 0.05])
        token, prob = predict_next(hidden)
        generated.append(token)
        print(f"  第 {step + 1} 轮: Hidden={hidden.round(2)} → 预测「{token}」(p={prob:.1%})")

    print(f"\n  生成结果: {prompt}{''.join(generated)}")
    print("  （玩具数据，仅演示「一个 Token 一个 Token 生成」的循环机制）")


def main() -> None:
    print("Lesson 5 — Transformer 工作流程演示")
    show_position_encoding()
    show_generation_loop()

    print(f"\n{'─' * 50}")
    print("结论: 输入 = E+P → Transformer → Hidden State → LM Head → 逐 Token 生成。")


if __name__ == "__main__":
    main()

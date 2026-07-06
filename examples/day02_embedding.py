r"""
Day 2 动手练习：对比 Token ID 与 Embedding 向量，观察语义相似度。

本脚本用「玩具向量」演示核心概念（真实模型产出 768+ 维、经训练得到）。
推荐运行（PowerShell）：
    Set-Location "D:\develop\AI-Brain"
    pip install -r ".\requirements.txt"
    python ".\examples\day02_embedding.py"
"""

import numpy as np
import tiktoken

# 玩具向量（2 维，便于理解；真实 Embedding 通常 768～1536 维）
TOY_VECTORS: dict[str, np.ndarray] = {
    "北京": np.array([0.92, 0.38]),
    "上海": np.array([0.88, 0.42]),
    "苹果": np.array([0.15, 0.95]),
    "香蕉": np.array([0.12, 0.91]),
}


def cosine_similarity(a: np.ndarray, b: np.ndarray) -> float:
    return float(np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b)))


def show_token_ids(words: list[str]) -> None:
    enc = tiktoken.get_encoding("cl100k_base")
    print("\n【1】Token ID：只是编号，无语义")
    print(f"{'词':<8} {'Token ID':>10}")
    print("-" * 22)
    for word in words:
        ids = enc.encode(word)
        print(f"{word:<8} {ids[0]:>10}")


def show_embeddings(words: list[str]) -> dict[str, np.ndarray]:
    print("\n【2】Embedding：每个词变成向量（本例为 2 维玩具数据）")
    for word in words:
        vec = TOY_VECTORS[word]
        print(f"{word:<8} {vec}")
    return {w: TOY_VECTORS[w] for w in words}


def show_similarity(pairs: list[tuple[str, str]], vectors: dict[str, np.ndarray]) -> None:
    print("\n【3】余弦相似度：语义相近 → 数值更高")
    print(f"{'词对':<20} {'相似度':>8}")
    print("-" * 32)
    for a, b in pairs:
        score = cosine_similarity(vectors[a], vectors[b])
        print(f"{a} ↔ {b:<12} {score:>8.4f}")


def main() -> None:
    print("Day 2 — Embedding 演示")

    words = ["北京", "上海", "苹果", "香蕉"]
    pairs = [
        ("北京", "上海"),
        ("苹果", "香蕉"),
        ("北京", "香蕉"),
    ]

    show_token_ids(words)
    vectors = show_embeddings(words)
    show_similarity(pairs, vectors)

    print(f"\n{'─' * 50}")
    print("结论: Token ID 无语义；Embedding 让相近语义在向量空间中靠近。")
    print("提示: 真实系统用 text-embedding-3-small、bge-m3 等模型生成高维向量。")


if __name__ == "__main__":
    main()

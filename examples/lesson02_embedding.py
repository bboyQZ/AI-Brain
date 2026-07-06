r"""
Lesson 2 动手练习：对比 Token ID 与 Embedding 向量，观察语义相似度。

本脚本用「玩具向量」演示核心概念（真实模型产出 768+ 维、经训练得到）。
推荐运行（PowerShell）：
    Set-Location "D:\develop\AI-Brain"
    pip install -r ".\requirements.txt"
    python ".\examples\lesson02_embedding.py"
"""

import numpy as np
import tiktoken

# 玩具 Embedding Matrix：行 = Token ID，列 = 向量维度（3 维示意）
EMBEDDING_MATRIX = np.array([
    [0.92, 0.38, 0.10],   # ID 0 → 北京
    [0.88, 0.42, 0.12],   # ID 1 → 上海
    [0.15, 0.95, 0.80],   # ID 2 → 苹果
    [0.12, 0.91, 0.78],   # ID 3 → 香蕉
])

TOY_VOCAB: dict[str, int] = {"北京": 0, "上海": 1, "苹果": 2, "香蕉": 3}


def lookup(token_id: int) -> np.ndarray:
    """用 Token ID 查 Embedding Matrix，取对应行。"""
    return EMBEDDING_MATRIX[token_id]


def cosine_similarity(a: np.ndarray, b: np.ndarray) -> float:
    return float(np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b)))


def show_lookup_table(words: list[str]) -> None:
    print("\n【1】Embedding Matrix 查表（Lookup）")
    print(f"  矩阵形状: {EMBEDDING_MATRIX.shape}  (词表大小 × 向量维度)")
    print(f"  {'Token ID':>10}  {'词':<6}  Embedding")
    print("  " + "-" * 40)
    for word in words:
        tid = TOY_VOCAB[word]
        vec = lookup(tid)
        print(f"  {tid:>10}  {word:<6}  {vec}")


def show_token_ids(words: list[str]) -> None:
    enc = tiktoken.get_encoding("cl100k_base")
    print("\n【2】真实 Token ID：只是编号，无语义（与矩阵行号无关）")
    print(f"{'词':<8} {'Token ID':>10}")
    print("-" * 22)
    for word in words:
        ids = enc.encode(word)
        print(f"{word:<8} {ids[0]:>10}")


def show_embeddings(words: list[str]) -> dict[str, np.ndarray]:
    print("\n【3】查表结果：每个词变成向量")
    vectors = {}
    for word in words:
        vec = lookup(TOY_VOCAB[word])
        vectors[word] = vec
        print(f"{word:<8} {vec}")
    return vectors


def show_similarity(pairs: list[tuple[str, str]], vectors: dict[str, np.ndarray]) -> None:
    print("\n【4】余弦相似度：语义相近 → 数值更高")
    print(f"{'词对':<20} {'相似度':>8}")
    print("-" * 32)
    for a, b in pairs:
        score = cosine_similarity(vectors[a], vectors[b])
        print(f"{a} ↔ {b:<12} {score:>8.4f}")


def main() -> None:
    print("Lesson 2 — Embedding 演示")

    words = ["北京", "上海", "苹果", "香蕉"]
    pairs = [
        ("北京", "上海"),
        ("苹果", "香蕉"),
        ("北京", "香蕉"),
    ]

    show_lookup_table(words)
    show_token_ids(words)
    vectors = show_embeddings(words)
    show_similarity(pairs, vectors)

    print(f"\n{'─' * 50}")
    print("结论: Embedding = 查表；Token ID 查矩阵得向量；语义相近则向量靠近。")
    print("提示: 真实系统用 text-embedding-3-small、bge-m3 等模型生成高维向量。")


if __name__ == "__main__":
    main()

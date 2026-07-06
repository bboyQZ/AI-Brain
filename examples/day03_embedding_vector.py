r"""
Day 3 动手练习：理解向量的含义、聚类与 RAG 检索。

推荐运行（PowerShell）：
    Set-Location "D:\develop\AI-Brain"
    pip install -r ".\requirements.txt"
    python ".\examples\day03_embedding_vector.py"
"""

import numpy as np

# ── 二维玩具向量：便于肉眼理解「坐标」与「聚类」 ──
CITY_CLUSTER: dict[str, np.ndarray] = {
    "北京": np.array([0.92, 0.38]),
    "上海": np.array([0.88, 0.42]),
    "广州": np.array([0.85, 0.45]),
    "深圳": np.array([0.83, 0.48]),
}

FRUIT_CLUSTER: dict[str, np.ndarray] = {
    "苹果": np.array([0.15, 0.95]),
    "香蕉": np.array([0.12, 0.91]),
    "西瓜": np.array([0.10, 0.88]),
}

# RAG 场景：句子级玩具向量（3 维示意）
KNOWLEDGE_BASE: dict[str, np.ndarray] = {
    "任务推送异常导致自动分配失败。": np.array([0.80, 0.75, 0.10]),
    "如何修改客服工作时间的配置？": np.array([0.20, 0.30, 0.90]),
    "今日系统维护公告：凌晨 2 点停机。": np.array([0.50, 0.10, 0.60]),
}

USER_QUERY = "为什么客服没有自动接单？"


def cosine_similarity(a: np.ndarray, b: np.ndarray) -> float:
    return float(np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b)))


def show_basic_vectors() -> None:
    print("【1】向量 = 空间中的坐标")
    print("  二维: (2, 3)  →  x=2, y=3")
    print("  三维: (2, 3, 5)  →  x=2, y=3, z=5")

    beijing_768 = np.random.default_rng(42).normal(0, 1, 768)
    preview = ", ".join(f"{v:.2f}" for v in beijing_768[:6])
    print(f"\n  真实 Embedding 通常是 768+ 维，例如「北京」:")
    print(f"  ({preview}, ... 共 768 个数)")


def show_clusters() -> None:
    print("\n【2】语义相近 → 向量聚类（城市簇 vs 水果簇）")
    all_words = {**CITY_CLUSTER, **FRUIT_CLUSTER}

    pairs = [
        ("北京", "上海"),
        ("广州", "深圳"),
        ("苹果", "西瓜"),
        ("北京", "香蕉"),
    ]
    print(f"{'词对':<16} {'余弦相似度':>10}")
    print("-" * 30)
    for a, b in pairs:
        score = cosine_similarity(all_words[a], all_words[b])
        print(f"{a} ↔ {b:<10} {score:>10.4f}")


def rag_retrieve(query_vec: np.ndarray, top_k: int = 1) -> list[tuple[str, float]]:
    scores = [
        (doc, cosine_similarity(query_vec, vec))
        for doc, vec in KNOWLEDGE_BASE.items()
    ]
    scores.sort(key=lambda x: x[1], reverse=True)
    return scores[:top_k]


def show_rag_demo() -> None:
    print("\n【3】模拟 RAG：用向量距离检索知识库")
    query_vec = np.array([0.78, 0.72, 0.12])  # 与「自动分配失败」语义相近

    print(f"  用户提问: {USER_QUERY!r}")
    print(f"  问题向量: {query_vec}")
    print()
    print(f"  {'知识库条目':<30} {'相似度':>8}")
    print("  " + "-" * 42)
    for doc, score in sorted(
        [(d, cosine_similarity(query_vec, v)) for d, v in KNOWLEDGE_BASE.items()],
        key=lambda x: x[1],
        reverse=True,
    ):
        marker = " ← 命中" if doc.startswith("任务推送") else ""
        print(f"  {doc:<30} {score:>8.4f}{marker}")


def main() -> None:
    print("Day 3 — 什么是 Embedding 向量？")
    show_basic_vectors()
    show_clusters()
    show_rag_demo()

    print(f"\n{'─' * 50}")
    print("结论: 向量是坐标；语义相近则坐标靠近；RAG 靠距离检索，不靠关键词。")


if __name__ == "__main__":
    main()

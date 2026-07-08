r"""
Lesson 7 动手练习：Chunk 切块、Overlap 与玩具 Retriever。

推荐运行（PowerShell）：
    Set-Location "D:\develop\AI-Brain"
    python ".\examples\lesson07_rag_chunk.py"
"""

import numpy as np

SAMPLE_DOC = """
Worker 负责从队列拉取任务并执行。若执行失败，任务会进入重试队列，最多重试 3 次。
Redis 用于缓存任务状态。FAQ v4.3 新增字段：分类、标签、优先级。
测试流程：需求评审、用例设计、执行、回归、上线。
""".strip()

# 玩具知识库（模拟已切块 + 已向量化）
CHUNKS = [
    "Worker 负责从队列拉取任务并执行。",
    "若执行失败，任务会进入重试队列，最多重试 3 次。",
    "Redis 用于缓存任务状态。",
    "FAQ v4.3 新增字段：分类、标签、优先级。",
]

CHUNK_VECTORS = {
    0: np.array([0.90, 0.85, 0.10]),
    1: np.array([0.88, 0.80, 0.15]),
    2: np.array([0.30, 0.25, 0.90]),
    3: np.array([0.20, 0.30, 0.85]),
}


def simple_chunk(text: str, chunk_size: int) -> list[str]:
    """最简切块：固定步长切片。"""
    return [text[i : i + chunk_size] for i in range(0, len(text), chunk_size)]


def chunk_with_overlap(text: str, chunk_size: int, overlap: int) -> list[str]:
    """带重叠的切块。"""
    chunks: list[str] = []
    start = 0
    while start < len(text):
        end = start + chunk_size
        chunks.append(text[start:end])
        if end >= len(text):
            break
        start = end - overlap
    return chunks


def cosine_similarity(a: np.ndarray, b: np.ndarray) -> float:
    return float(np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b)))


def retriever_invoke(query: str, top_k: int = 3) -> list[tuple[str, float]]:
    """玩具 Retriever：用固定问题向量模拟 Embedding 检索。"""
    if "worker" in query.lower() or "执行" in query:
        query_vec = np.array([0.92, 0.82, 0.12])
    elif "faq" in query.lower() or "字段" in query:
        query_vec = np.array([0.15, 0.28, 0.88])
    else:
        query_vec = np.array([0.50, 0.50, 0.50])

    scored = [
        (CHUNKS[i], cosine_similarity(query_vec, vec))
        for i, vec in CHUNK_VECTORS.items()
    ]
    scored.sort(key=lambda x: x[1], reverse=True)
    return scored[:top_k]


def build_prompt(query: str, docs: list[tuple[str, float]]) -> str:
    context = "\n".join(f"- {doc}" for doc, _ in docs)
    return (
        f"问题：{query}\n\n"
        f"资料：\n{context}\n\n"
        "请根据资料回答。"
    )


def main() -> None:
    print("Lesson 7 — Chunk、Retriever 演示")

    print("\n【1】最简切块 chunk_size=40")
    for i, c in enumerate(simple_chunk(SAMPLE_DOC, 40), 1):
        print(f"  Chunk{i}: {c!r}")

    print("\n【2】Overlap 切块 chunk_size=50, overlap=15")
    for i, c in enumerate(chunk_with_overlap(SAMPLE_DOC, 50, 15), 1):
        print(f"  Chunk{i}: {c!r}")

    query = "Worker 为什么没有执行？"
    print(f"\n【3】Retriever.invoke() — 问题: {query}")
    docs = retriever_invoke(query, top_k=3)
    for doc, score in docs:
        print(f"  score={score:.4f}  {doc}")

    print("\n【4】拼接 Prompt（交给 LLM 前的形态）")
    print(build_prompt(query, docs))

    print(f"\n{'─' * 50}")
    print("结论: 切块 → 向量化入库 → Retriever 找 Top K → 拼 Prompt → LLM。")
    print("完整实现见 app/services/chunker.py、retriever.py、rag_service.py")


if __name__ == "__main__":
    main()

r"""
Lesson 6 动手练习：对比「纯 GPT」与「RAG」的回答路径。

推荐运行（PowerShell）：
    Set-Location "D:\develop\AI-Brain"
    pip install -r ".\requirements.txt"
    python ".\examples\lesson06_rag_intro.py"
"""

# 玩具知识库（模拟 AIHelp FAQ 文档）
KNOWLEDGE_BASE: dict[str, str] = {
    "faq_v43": (
        "FAQ v4.3 新增字段：\n"
        "- 分类\n"
        "- 标签\n"
        "- 优先级"
    ),
    "test_sop": "公司测试流程：需求评审 → 用例设计 → 执行 → 回归 → 上线。",
}

# 简化检索：问题关键词 → 文档 ID（真实 RAG 用向量相似度）
RETRIEVAL_HINTS: dict[str, str] = {
    "faq": "faq_v43",
    "字段": "faq_v43",
    "新字段": "faq_v43",
    "测试流程": "test_sop",
    "测试": "test_sop",
}


def retrieve(query: str) -> str | None:
    """玩具检索：根据关键词命中知识库片段。"""
    for hint, doc_id in RETRIEVAL_HINTS.items():
        if hint.lower() in query.lower():
            return KNOWLEDGE_BASE[doc_id]
    return None


def build_rag_prompt(query: str, context: str) -> str:
    return (
        "请根据以下资料回答问题。如果资料中没有答案，请说不知道。\n\n"
        f"【资料】\n{context}\n\n"
        f"【问题】\n{query}"
    )


def answer_without_rag(query: str) -> str:
    return "（模型训练数据中没有贵司内部文档，无法回答）"


def answer_with_rag(query: str) -> str:
    context = retrieve(query)
    if context is None:
        return "（知识库未检索到相关文档，无法回答）"
    prompt = build_rag_prompt(query, context)
    # 真实场景：prompt 发给 LLM API；此处仅展示拼接结果
    if "字段" in query or "FAQ" in query.upper():
        return "根据 FAQ v4.3 文档，新增字段有：分类、标签、优先级。"
    return f"根据内部文档：{context[:40]}..."


def demo(query: str) -> None:
    print(f"\n用户问题: {query}")
    print(f"  纯 GPT: {answer_without_rag(query)}")
    print(f"  RAG:    {answer_with_rag(query)}")
    ctx = retrieve(query)
    if ctx:
        print(f"\n  检索到的资料片段:\n{ctx}")


def main() -> None:
    print("Lesson 6 — 为什么需要 RAG？")

    demo("AIHelp 最新 FAQ v4.3 的字段有哪些？")
    demo("咱们公司测试流程是什么？")

    print(f"\n{'─' * 50}")
    print("结论: RAG 不改变模型，而是检索外部知识 → 拼入 Prompt → 再生成。")


if __name__ == "__main__":
    main()

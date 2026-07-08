from app.services.retriever import hybrid_retrieve
from app.services.llm_client import get_llm
from app.services.session_store import add_message

PROMPT_TEMPLATE = """你是一个 AI 学习助手，根据以下课程资料回答用户问题。

【资料】
{context}

【规则】
1. 只根据【资料】回答，不要编造资料里没有的内容
2. 如果资料不足以回答，明确说"现有资料中没有这个内容"
3. 回答时引用资料来源，格式：[引自：课程第X节 / 笔记：标题]
4. 用中文回答，语言清晰，适合学习者理解

【用户问题】
{query}"""


def build_context(results: list[dict]) -> str:
    parts = []
    for i, r in enumerate(results, 1):
        meta = r.get("metadata", {})
        src = meta.get("heading_path") or meta.get("section") or meta.get("source", "")
        parts.append(f"[资料{i} - {src}]\n{r['content']}")
    return "\n\n".join(parts)


def rag_chat(session_id: int, query: str):
    """流式 RAG 问答生成器。yield dict(delta=..., sources=...)。"""
    results = hybrid_retrieve(query, top_k=4)
    context = build_context(results)
    prompt = PROMPT_TEMPLATE.format(context=context, query=query)
    add_message(session_id, "user", query)

    messages = [
        {"role": "system", "content": "你是一个 AI 学习助手。"},
        {"role": "user", "content": prompt},
    ]
    llm = get_llm()
    stream = llm.chat(messages, stream=True)

    sources = [r.get("metadata", {}).get("heading_path", "") for r in results]
    full = ""
    sent_sources = False
    for chunk in stream:
        delta = chunk.choices[0].delta.content or ""
        full += delta
        payload = {"delta": delta}
        if not sent_sources:
            payload["sources"] = sources
            sent_sources = True
        yield payload
    add_message(session_id, "assistant", full)

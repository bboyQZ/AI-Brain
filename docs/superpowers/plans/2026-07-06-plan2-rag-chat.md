# Plan 2：RAG 问答 实现计划

> **状态：等学完 RAG 课程后再执行。** 本计划基于 spec，但 RAG 的工程落地（Chroma、BM25、切片）需要你先通过课程掌握原理。执行前建议先学完 RAG 切片、向量库、混合检索相关课程。

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 实现课程知识库的 RAG 问答：知识入库（切片+embedding+Chroma）→ 混合检索 → LLM 生成 → `/chat` 接口。

**Architecture:** 入库脚本扫 `curriculum/` + `knowledge/`，按 markdown 结构切片，embedding 写入 Chroma。`/chat` 接口接收问题，向量+BM25 混合检索 top-k，拼 prompt 调 DeepSeek，流式返回。

**Tech Stack:** Chroma / rank-bm25 / openai SDK（调 DeepSeek，兼容 OpenAI 格式）/ FastAPI（复用 Plan 1 骨架）

**Spec 参考:** `docs/superpowers/specs/2026-07-06-ai-brain-chat-design.md` 第 6、8 节

**关键决策:**
- 切片：按 `##`/`###` 结构切，超 800 token 按段落二次切
- 检索：向量（Chroma）+ BM25（rank-bm25）混合，加权融合，top-k=3-5
- LLM：DeepSeek-V3 主力，`LLMClient` 抽象可切智谱
- Embedding：复用 Plan 1 的 bge-base-zh
- 入库：手动触发（`python scripts/ingest.py` 或 `POST /ingest`），只处理新增/变更

---

## 文件结构

```
AI-Brain/
├── app/
│   ├── services/
│   │   ├── chunker.py           # markdown 结构切片
│   │   ├── vector_store.py      # Chroma 封装
│   │   ├── retriever.py         # 混合检索（向量+BM25）
│   │   ├── llm_client.py        # LLM 抽象层
│   │   └── rag_service.py       # 编排：检索→拼prompt→调LLM
│   ├── routers/
│   │   └── chat.py              # /chat 接口（流式）
│   │   └── ingest.py            # /ingest 接口
│   └── models/schemas.py        # 追加 chat/ingest 模型
├── scripts/
│   └── ingest.py                # 命令行入库
├── knowledge/                   # 每日补充的知识（skill 生成）
└── tests/
    ├── test_chunker.py
    ├── test_retriever.py
    └── test_rag.py
```

---

## Task 1：markdown 切片器

**Files:**
- Create: `app/services/chunker.py`
- Create: `tests/test_chunker.py`

- [ ] **Step 1: 写失败测试**

```python
# tests/test_chunker.py
from app.services.chunker import chunk_markdown

def test_chunk_by_heading():
    md = "# 标题\n概述\n## 第一节\n内容A\n## 第二节\n内容B"
    chunks = chunk_markdown(md, source="test.md", source_type="curriculum")
    assert len(chunks) >= 2
    assert chunks[0]["section"] == "第一节"
    assert chunks[1]["section"] == "第二节"
    assert all(c["source_type"] == "curriculum" for c in chunks)

def test_long_section_split():
    long_para = "这是一个很长的段落。" * 200
    md = f"## 长节\n{long_para}"
    chunks = chunk_markdown(md, source="test.md", source_type="curriculum")
    assert len(chunks) > 1

def test_metadata_present():
    md = "## 节\n内容"
    chunks = chunk_markdown(md, source="lesson-01.md", source_type="curriculum")
    assert "source" in chunks[0]
    assert "section" in chunks[0]
    assert "heading_path" in chunks[0]
    assert "created_at" in chunks[0]
```

- [ ] **Step 2: 跑测试验证失败**

```powershell
pytest tests/test_chunker.py -v
```

Expected: FAIL（模块不存在）

- [ ] **Step 3: 实现 chunker.py**

```python
# app/services/chunker.py
import re
from datetime import datetime

MAX_TOKENS = 800  # 粗略按字符数估，1 中文字符 ≈ 1-2 token

def chunk_markdown(md: str, source: str, source_type: str) -> list[dict]:
    lines = md.split("\n")
    chunks = []
    current_section = ""
    current_path = []
    current_content = []
    
    def flush():
        if current_content:
            text = "\n".join(current_content).strip()
            if not text:
                return
            if len(text) > MAX_TOKENS:
                for para in _split_long(text):
                    chunks.append(_make_chunk(para, source, source_type, current_section, current_path))
            else:
                chunks.append(_make_chunk(text, source, source_type, current_section, current_path))
    
    for line in lines:
        m = re.match(r"^(#{1,3})\s+(.+)", line)
        if m:
            flush()
            level = len(m.group(1))
            title = m.group(2).strip()
            current_path = current_path[:level-1] + [title]
            current_section = title
            current_content = [line]
        else:
            current_content.append(line)
    flush()
    return chunks

def _split_long(text: str) -> list[str]:
    paras = text.split("\n\n")
    result = []
    buf = ""
    for p in paras:
        if len(buf) + len(p) > MAX_TOKENS and buf:
            result.append(buf)
            buf = p
        else:
            buf = buf + "\n\n" + p if buf else p
    if buf:
        result.append(buf)
    return result

def _make_chunk(text, source, source_type, section, path):
    return {
        "content": text,
        "source": source,
        "source_type": source_type,
        "section": section,
        "heading_path": " > ".join(path),
        "created_at": datetime.now().isoformat(),
    }
```

- [ ] **Step 4: 跑测试验证通过**

```powershell
pytest tests/test_chunker.py -v
```

Expected: 3 passed

- [ ] **Step 5: Commit**

```powershell
git add app/services/chunker.py tests/test_chunker.py
git commit -m "feat: 添加 markdown 结构切片器"
```

---

## Task 2：Chroma 向量库封装

**Files:**
- Create: `app/services/vector_store.py`
- Modify: `requirements.txt`（追加 chromadb、rank-bm25、openai）
- Create: `tests/test_vector_store.py`

- [ ] **Step 1: 更新 requirements.txt**

追加：

```
chromadb>=0.5.0
rank-bm25>=0.2.2
openai>=1.40.0
```

- [ ] **Step 2: 写 vector_store.py**

```python
# app/services/vector_store.py
import chromadb
from app.deps import get_embed_model
from app.config import DATA_DIR

_client = None
_collection = None

def _get_collection():
    global _client, _collection
    if _collection is None:
        _client = chromadb.PersistentClient(path=str(DATA_DIR / "chroma"))
        _collection = _client.get_or_create_collection("ai_brain")
    return _collection

def add_chunks(chunks: list[dict]) -> None:
    if not chunks:
        return
    model = get_embed_model()
    texts = [c["content"] for c in chunks]
    vecs = model.encode(texts, normalize_embeddings=True).tolist()
    ids = [f"{c['source']}_{i}" for i, c in enumerate(chunks)]
    col = _get_collection()
    col.upsert(
        ids=ids,
        embeddings=vecs,
        documents=texts,
        metadatas=[{k: v for k, v in c.items() if k != "content"} for c in chunks],
    )

def query_by_vector(text: str, top_k: int = 5) -> list[dict]:
    model = get_embed_model()
    vec = model.encode([text], normalize_embeddings=True).tolist()
    col = _get_collection()
    res = col.query(query_embeddings=vec, n_results=top_k)
    results = []
    for i in range(len(res["ids"][0])):
        results.append({
            "content": res["documents"][0][i],
            "metadata": res["metadatas"][0][i],
            "score": 1 - res["distances"][0][i],
        })
    return results

def count() -> int:
    return _get_collection().count()

def clear() -> None:
    global _collection
    if _client is not None:
        _client.delete_collection("ai_brain")
        _collection = None
        _get_collection()
```

- [ ] **Step 3: 写测试**

```python
# tests/test_vector_store.py
from app.services.vector_store import add_chunks, query_by_vector, count, clear

def test_add_and_query():
    clear()
    chunks = [
        {"content": "RAG 是检索增强生成", "source": "test", "source_type": "curriculum", "section": "rag", "heading_path": "rag", "created_at": "2026-01-01"},
        {"content": "Transformer 用注意力机制", "source": "test", "source_type": "curriculum", "section": "attn", "heading_path": "attn", "created_at": "2026-01-01"},
    ]
    add_chunks(chunks)
    assert count() == 2
    results = query_by_vector("什么是 RAG", top_k=1)
    assert len(results) == 1
    assert "RAG" in results[0]["content"]
```

- [ ] **Step 4: 跑测试**

```powershell
pytest tests/test_vector_store.py -v
```

- [ ] **Step 5: Commit**

```powershell
git add app/services/vector_store.py tests/test_vector_store.py requirements.txt
git commit -m "feat: 添加 Chroma 向量库封装"
```

---

## Task 3：混合检索（向量 + BM25）

**Files:**
- Create: `app/services/retriever.py`
- Create: `tests/test_retriever.py`

- [ ] **Step 1: 写 retriever.py**

```python
# app/services/retriever.py
from rank_bm25 import BM25Okapi
from app.services.vector_store import query_by_vector

_bm25 = None
_bm25_docs = None

def build_bm25_index(chunks: list[dict]) -> None:
    global _bm25, _bm25_docs
    _bm25_docs = [c["content"] for c in chunks]
    tokenized = [doc.split() for doc in _bm25_docs]
    _bm25 = BM25Okapi(tokenized)

def hybrid_retrieve(query: str, top_k: int = 5, alpha: float = 0.5) -> list[dict]:
    vec_results = query_by_vector(query, top_k=top_k * 2)
    if _bm25 is None:
        return vec_results[:top_k]
    bm25_scores = _bm25.get_scores(query.split())
    bm25_results = sorted(
        [{"content": d, "score": s} for d, s in zip(_bm25_docs, bm25_scores)],
        key=lambda x: x["score"], reverse=True,
    )[:top_k * 2]
    merged = _merge(vec_results, bm25_results, alpha)
    return merged[:top_k]

def _merge(vec_results, bm25_results, alpha):
    score_map = {}
    for r in vec_results:
        score_map[r["content"]] = alpha * r.get("score", 0)
    for r in bm25_results:
        if r["content"] in score_map:
            score_map[r["content"]] += (1 - alpha) * _normalize(r["score"], bm25_results)
        else:
            score_map[r["content"]] = (1 - alpha) * _normalize(r["score"], bm25_results)
    return [{"content": k, "score": v} for k, v in sorted(score_map.items(), key=lambda x: x[1], reverse=True)]

def _normalize(score, all_results):
    mx = max((r["score"] for r in all_results), default=1)
    return score / mx if mx > 0 else 0
```

- [ ] **Step 2: 写测试**

```python
# tests/test_retriever.py
from app.services.retriever import build_bm25_index, hybrid_retrieve
from app.services.vector_store import clear, add_chunks

def test_hybrid_retrieve():
    clear()
    chunks = [
        {"content": "RAG 是检索增强生成", "source": "t1", "source_type": "curriculum", "section": "1", "heading_path": "1", "created_at": "2026-01-01"},
        {"content": "Transformer 用注意力机制", "source": "t2", "source_type": "curriculum", "section": "2", "heading_path": "2", "created_at": "2026-01-01"},
    ]
    add_chunks(chunks)
    build_bm25_index(chunks)
    results = hybrid_retrieve("什么是 RAG", top_k=2)
    assert len(results) <= 2
    assert "RAG" in results[0]["content"]
```

- [ ] **Step 3: 跑测试 + Commit**

```powershell
pytest tests/test_retriever.py -v
git add app/services/retriever.py tests/test_retriever.py
git commit -m "feat: 添加向量+BM25 混合检索"
```

---

## Task 4：LLM Client 抽象层

**Files:**
- Create: `app/services/llm_client.py`
- Modify: `app/config.py`（补 LLM 配置）

- [ ] **Step 1: 补 config.py 的 LLM 配置**

```python
# 追加到 app/config.py
import os
DEEPSEEK_API_KEY = os.getenv("DEEPSEEK_API_KEY", "")
ZHIPU_API_KEY = os.getenv("ZHIPU_API_KEY", "")
LLM_PROVIDER = os.getenv("LLM_PROVIDER", "deepseek")
DEEPSEEK_BASE_URL = "https://api.deepseek.com/v1"
DEEPSEEK_MODEL = "deepseek-chat"
ZHIPU_BASE_URL = "https://open.bigmodel.cn/api/paas/v4"
ZHIPU_MODEL = "glm-4"
```

- [ ] **Step 2: 写 llm_client.py**

```python
# app/services/llm_client.py
from openai import OpenAI
from app.config import (
    LLM_PROVIDER, DEEPSEEK_API_KEY, DEEPSEEK_BASE_URL, DEEPSEEK_MODEL,
    ZHIPU_API_KEY, ZHIPU_BASE_URL, ZHIPU_MODEL,
)

class LLMClient:
    def __init__(self, provider: str = None):
        provider = provider or LLM_PROVIDER
        if provider == "deepseek":
            self.client = OpenAI(api_key=DEEPSEEK_API_KEY, base_url=DEEPSEEK_BASE_URL)
            self.model = DEEPSEEK_MODEL
        elif provider == "zhipu":
            self.client = OpenAI(api_key=ZHIPU_API_KEY, base_url=ZHIPU_BASE_URL)
            self.model = ZHIPU_MODEL
        else:
            raise ValueError(f"unknown provider: {provider}")

    def chat(self, messages: list[dict], stream: bool = False):
        return self.client.chat.completions.create(
            model=self.model, messages=messages, stream=stream,
        )

_default = None
def get_llm() -> LLMClient:
    global _default
    if _default is None:
        _default = LLMClient()
    return _default
```

- [ ] **Step 3: Commit**

```powershell
git add app/services/llm_client.py app/config.py
git commit -m "feat: 添加 LLM Client 抽象层（DeepSeek 主力，可切换智谱）"
```

---

## Task 5：RAG 服务编排 + /chat 接口

**Files:**
- Create: `app/services/rag_service.py`
- Create: `app/routers/chat.py`
- Modify: `app/models/schemas.py`
- Modify: `app/main.py`

- [ ] **Step 1: 追加 schemas**

```python
# 追加到 app/models/schemas.py
class ChatRequest(BaseModel):
    session_id: int
    query: str

class ChatChunk(BaseModel):
    delta: str
    sources: list[str] = []
```

- [ ] **Step 2: 写 rag_service.py**

```python
# app/services/rag_service.py
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
    for chunk in stream:
        delta = chunk.choices[0].delta.content or ""
        full += delta
        yield {"delta": delta, "sources": sources if not full else []}
    add_message(session_id, "assistant", full)
```

- [ ] **Step 3: 写 chat router（流式 SSE）**

```python
# app/routers/chat.py
import json
from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from app.models.schemas import ChatRequest
from app.services.rag_service import rag_chat

router = APIRouter(prefix="/chat", tags=["chat"])

@router.post("")
def chat(req: ChatRequest):
    def gen():
        for chunk in rag_chat(req.session_id, req.query):
            yield f"data: {json.dumps(chunk, ensure_ascii=False)}\n\n"
    return StreamingResponse(gen(), media_type="text/event-stream")
```

- [ ] **Step 4: 挂载路由 + Commit**

```powershell
# 在 main.py 追加 app.include_router(chat.router)
git add app/services/rag_service.py app/routers/chat.py app/models/schemas.py app/main.py
git commit -m "feat: 添加 /chat RAG 问答接口（流式）"
```

---

## Task 6：入库脚本 + /ingest 接口

**Files:**
- Create: `scripts/ingest.py`
- Create: `app/routers/ingest.py`
- Modify: `app/main.py`

- [ ] **Step 1: 写 scripts/ingest.py**

```python
# scripts/ingest.py
"""手动入库：扫 curriculum/ + knowledge/，切片+embedding+入 Chroma。"""
from pathlib import Path
from app.services.chunker import chunk_markdown
from app.services.vector_store import add_chunks, count
from app.services.retriever import build_bm25_index

ROOT = Path(__file__).resolve().parent.parent

def ingest_dir(dir_path: Path, source_type: str) -> list[dict]:
    all_chunks = []
    for md in dir_path.glob("*.md"):
        text = md.read_text(encoding="utf-8")
        chunks = chunk_markdown(text, source=md.name, source_type=source_type)
        all_chunks.extend(chunks)
        print(f"  {md.name}: {len(chunks)} 片")
    return all_chunks

def main():
    print("入库 curriculum/")
    c1 = ingest_dir(ROOT / "curriculum", "curriculum")
    print("入库 knowledge/")
    c2 = ingest_dir(ROOT / "knowledge", "note")
    all_chunks = c1 + c2
    print(f"共 {len(all_chunks)} 片，写入 Chroma...")
    add_chunks(all_chunks)
    build_bm25_index(all_chunks)
    print(f"完成，向量库现有 {count()} 条")

if __name__ == "__main__":
    main()
```

- [ ] **Step 2: 写 /ingest 接口（复用核心逻辑）**

```python
# app/routers/ingest.py
from pathlib import Path
from fastapi import APIRouter
from app.services.chunker import chunk_markdown
from app.services.vector_store import add_chunks, count
from app.services.retriever import build_bm25_index
from app.config import ROOT

router = APIRouter(prefix="/ingest", tags=["ingest"])

@router.post("")
def ingest():
    all_chunks = []
    for d, st in [(ROOT / "curriculum", "curriculum"), (ROOT / "knowledge", "note")]:
        if d.exists():
            for md in d.glob("*.md"):
                chunks = chunk_markdown(md.read_text(encoding="utf-8"), source=md.name, source_type=st)
                all_chunks.extend(chunks)
    add_chunks(all_chunks)
    build_bm25_index(all_chunks)
    return {"ingested": len(all_chunks), "total": count()}
```

- [ ] **Step 3: 挂载路由 + 测试 + Commit**

```powershell
# 在 main.py 追加 app.include_router(ingest.router)
Set-Location "D:\develop\AI-Brain"
python ".\scripts\ingest.py"
uvicorn app.main:app --reload
# 浏览器测试 POST /ingest，再 POST /chat
git add scripts/ app/routers/ingest.py app/main.py
git commit -m "feat: 添加知识入库脚本和 /ingest 接口"
```

---

## Task 7：Cursor Skill（笔记规范化）

**Files:**
- Create: `.cursor/skills/normalize-note/SKILL.md`

**职责:** 把零散笔记整理成符合知识库规范的结构化文档，输出到 `knowledge/`。

**参考:** spec 第 10 节。

- [ ] **Step 1: 创建 skill 目录**

```powershell
mkdir ".cursor\skills\normalize-note"
```

- [ ] **Step 2: 写 SKILL.md**

```markdown
---
name: normalize-note
description: 把零散笔记整理成符合知识库规范的结构化文档，输出到 knowledge/ 目录，供 RAG 入库。
---

# 规范化笔记

把用户提供的零散笔记整理成结构化 markdown，输出到 `knowledge/` 目录。

## 输入

用户的零散笔记：一段话、几个要点、或粘贴的内容。

## 输出模板

文件名：`knowledge/YYYY-MM-DD-主题.md`

\`\`\`markdown
# [标题]

> 来源：[来源标注]
> 日期：YYYY-MM-DD
> 标签：[标签1, 标签2]
> 主题：[所属主题]

## 概述

[2-3 句话概括本笔记核心内容]

## [第一节标题]

[内容]

## [第二节标题]

[内容]
\`\`\`

## 规则

1. 必有标题、概述、元数据（来源/日期/标签/主题）
2. 分节用 `##`，每节有清晰标题
3. 代码块带语言标签
4. 语言中文，清晰简洁
5. 文件名格式：`YYYY-MM-DD-主题.md`
6. 不做切片/embedding/入库（那是后端职责）
7. 输出后提示用户运行 `python scripts/ingest.py` 入库
```

- [ ] **Step 3: 测试 skill**

在 Cursor 里触发 skill，给它一段零散笔记，验证输出到 `knowledge/` 且符合模板。

- [ ] **Step 4: Commit**

```powershell
git add .cursor/skills/normalize-note/SKILL.md
git commit -m "feat: 添加 normalize-note Cursor Skill"
```

---

## Plan 2 完成标准

- [ ] `python scripts/ingest.py` 能扫 curriculum/ + knowledge/ 入库
- [ ] `/ingest` API 可用
- [ ] `/chat` 流式返回 RAG 回答，带来源标注
- [ ] 混合检索（向量+BM25）生效
- [ ] LLM 可切换 DeepSeek/智谱
- [ ] 对话历史写入 SQLite
- [ ] Cursor Skill 能把零散笔记规范化为结构化 md

## 执行前提

- 学完 RAG 切片、向量库、混合检索相关课程
- `DEEPSEEK_API_KEY` 环境变量已配置

---

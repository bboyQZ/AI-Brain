# Lesson 7：Chunk、Retriever 与 LangChain 实现

> **第二阶段：RAG（第 2 课）** — 偏工程化笔记，覆盖切块、检索与最小 RAG 代码。

## 本课目标

理解 RAG 完整流水线中的 **Chunk → Embedding → 向量库 → Retriever → Prompt → LLM**，并会用 LangChain 写出最小可运行示例。

---

## 一、RAG 的完整流程

```text
用户问题
    │
    ▼
文档切块（Chunk）
    │
    ▼
Embedding（向量化）
    │
    ▼
Vector Database（向量数据库）
    │
    ▼
Retriever（检索最相关 Chunk）
    │
    ▼
拼接 Prompt
    │
    ▼
LLM（GPT）
    │
    ▼
最终回答
```

一句话概括：

> **RAG = 检索相关知识 + LLM 生成答案。**

---

## 二、Chunk（切块）

### 为什么需要切块？

如果一个 PRD 有 100 页，不可能整个发送给 LLM，因此需要拆成多个小片段（Chunk）：

```
PRD → Chunk1 / Chunk2 / Chunk3 / ...
```

### 最简单的切块方式

```python
text = open("prd.md", encoding="utf-8").read()

chunks = []
chunk_size = 500

for i in range(0, len(text), chunk_size):
    chunks.append(text[i : i + chunk_size])
```

#### 代码解析

**① `len(text)`** — 返回字符串长度。

```python
text = "abcdefghij"
len(text)  # → 10
```

**② `range(start, stop, step)`** — 按步长生成索引。

```python
range(0, 10, 3)  # → 0, 3, 6, 9
```

**③ 字符串切片 `text[start:end]`** — 包含开始，**不包含**结束。

```python
text = "abcdefghij"
text[0:3]  # → "abc"
```

#### 整个循环执行过程

假设 `text = "abcdefghij"`，`chunk_size = 3`：

```
i = 0 → "abc"
i = 3 → "def"
i = 6 → "ghi"
i = 9 → "j"
```

最终：`["abc", "def", "ghi", "j"]`

---

## 三、Overlap（重叠）

为避免一句话被切断，Chunk 之间需要保留重叠内容：

```
Chunk1:  0────────500
Chunk2:       400────────900
              ↑
           overlap（400~500）
```

作用：

- 保留上下文
- 提高检索准确率

常见参数：`chunk_size=500`，`chunk_overlap=100`。

---

## 四、为什么不用自己写切块？

真实项目一般不会简单 `text[i:i+500]`，因为可能切断一句话。

LangChain 提供 **`RecursiveCharacterTextSplitter`**，按优先级逐层尝试切分：

```
空段落 → 换行 → 句号 → 空格 → 字符
```

因此得到的 Chunk 更符合语义。

> **Recursive 的含义**：不是 Python 递归函数，而是**按多个分隔符逐层尝试切分**。

---

## 五、Embedding

作用：**把文本转换成向量**。

```
"Worker执行任务" → [0.13, -0.41, 0.89, ...]
```

每个 Chunk 都会生成一个向量，然后存入向量数据库。

---

## 六、向量数据库（Vector Database）

```
Chunk1 → Embedding → Vector
```

数据库保存的是：

| 文本 | 向量 |
|------|------|
| Worker 执行任务 | [0.13, 0.56, ...] |

以后搜索的不是文字，而是**向量之间的相似度**。

---

## 七、Retriever

Retriever 的职责：**从向量数据库中找出最相关的 Chunk**。

```
用户问题 → Embedding → 问题向量
    ↓
和数据库所有向量计算距离 → 排序 → 返回 Top K
```

例如检索结果：

| Chunk | 相似度 |
|-------|--------|
| Worker 执行任务 | 0.95 |
| 失败进入重试 | 0.91 |
| Redis 缓存 | 0.62 |

设置 `k = 3`，返回前三个。

---

## 八、LLM

Retriever 找到 Chunk 后，拼接 Prompt：

```
问题：Worker 为什么没有执行？

资料：
Chunk1
Chunk2
Chunk3

请根据资料回答。
```

然后调用 LLM 生成最终答案。

---

## 九、`invoke()` 是什么？

`invoke()` 的意思：**调用**。

```python
answer = llm.invoke(prompt)
```

等价于：把 Prompt 发给 GPT → GPT 返回回答。本质就是**调用大模型 API**。

Retriever 也有 `retriever.invoke(question)`，但返回的是 **Document 列表**，不是 GPT 的回答。

| invoke 对象 | 返回内容 |
|-------------|----------|
| `llm.invoke()` | AI 回答 |
| `retriever.invoke()` | 检索结果（Document） |

牢记：

> **Retriever 负责找资料，LLM 负责读资料并生成答案。**

---

## 十、LangChain 是什么？

LangChain 是 **AI 应用开发框架（Framework）**，不是单纯连接 GPT 的 SDK。

它包含很多模块：

```
LLM / Prompt / Embedding / Text Splitter
Retriever / Vector Store / Memory / Agent / Output Parser
```

切块、Retriever、Prompt、LLM 都属于 LangChain 生态。

---

## 十一、最小 RAG 代码（LangChain）

```python
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_openai import OpenAIEmbeddings, ChatOpenAI
from langchain_chroma import Chroma

# 创建切块器
splitter = RecursiveCharacterTextSplitter(
    chunk_size=500,
    chunk_overlap=100,
)

# 文档切块
chunks = splitter.split_text(text)

# 创建 Embedding 模型
embedding = OpenAIEmbeddings()

# 建立向量数据库（内部自动完成 Embedding + 存储）
db = Chroma.from_texts(chunks, embedding)

# 创建 Retriever
retriever = db.as_retriever(search_kwargs={"k": 3})

# 检索最相关文档
docs = retriever.invoke("Worker 为什么没有执行？")
context = "\n".join(doc.page_content for doc in docs)

# 拼接 Prompt
prompt = f"""
问题：Worker 为什么没有执行？

资料：
{context}

请根据资料回答。
"""

# 调用 LLM
llm = ChatOpenAI()
answer = llm.invoke(prompt)
```

> 运行 LangChain 示例需要 OpenAI API Key。本仓库的 Web 应用使用火山方舟 + 本地 Embedding，见下文「与本项目的关系」。

---

## 十二、与本项目的关系

本仓库 **AI-Brain Chat** 实现了同一套 RAG 流水线，但未依赖 LangChain，便于理解和部署：

| 概念 | 本仓库实现 |
|------|-----------|
| Chunk | `app/services/chunker.py` — 按 Markdown 标题切块，超长段落再拆分 |
| Embedding | `app/services/embed_service.py` — 本地 `BAAI/bge-*` 模型 |
| Vector DB | `app/services/vector_store.py` — Chroma |
| Retriever | `app/services/retriever.py` — 向量检索 + BM25 混合检索 |
| Prompt + LLM | `app/services/rag_service.py` — 拼 Prompt 后流式调用火山方舟 |

入库命令：`python scripts/ingest.py`

---

## 动手练习（可选）

### A. 纯 Python 切块（无需 API）

```powershell
Set-Location "D:\develop\AI-Brain"
python ".\examples\lesson07_rag_chunk.py"
```

### B. 完整 RAG 应用

```powershell
python ".\scripts\ingest.py"
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

浏览器打开 http://localhost:5173 体验 Chat 问答。

---

## 本课总结

```text
文档 → Chunk → Embedding → Vector DB → Retriever（Top K）→ Prompt → LLM
```

牢记一句话：

> **Retriever 负责找资料，LLM 负责读资料并生成答案。**

---

## 本课关键词

- Chunk、Overlap、`chunk_size` / `chunk_overlap`
- `RecursiveCharacterTextSplitter`
- Vector Database、Retriever、Top K
- `invoke()`、LangChain
- Document、`page_content`

---

## 下一课预告

混合检索（向量 + BM25）、入库流程调优，以及本仓库 `ingest.py` 的完整链路拆解。

# `app/services/` — RAG 与核心业务

这里是「大脑」：入库、检索、拼 Prompt、调模型都在这层。

## RAG 主链路（对话）

按调用顺序读：

```
scripts/ingest.py 或启动自动入库
        ↓
ingest_service.py  +  chunker.py  +  embed_service.py
        ↓
Chroma / 本地索引（data/ 下）
        ↓
用户提问 → rag_service.py
        ↓
retriever.py（混合检索）
        ↓
prompts/rag_*.txt（提示词模板）
        ↓
llm_client.py（流式生成）
        ↓
session_store.py（存助手消息 + 引用）
```

### 文件职责

| 文件 | 一句话 |
|------|--------|
| `rag_service.py` | 编排：检索 → 填提示词 → 流式调 LLM → 存回复 |
| `retriever.py` | 混合检索（向量 + BM25），返回 top-k 片段 |
| `chunker.py` | 把 markdown 切成带标题路径的 chunk |
| `ingest_service.py` | 扫 `curriculum/`、`knowledge/`，切片、向量化、写入 |
| `embed_service.py` | 文本 → 向量（本地 embedding 模型） |
| `llm_client.py` | 封装火山方舟 / DeepSeek 等 Chat API |
| `session_store.py` | 会话与消息的增删改查 |
| `rag_lab_service.py` | 概念实验室里「看检索过程」用的逻辑 |

## `rag_service.py` 怎么读

1. `_load_prompt()`：从项目根 `prompts/` 读模板；用文件 `mtime` 判断要不要重读  
2. `build_context()`：把检索结果拼成「【资料】」文本  
3. `build_source_refs()`：整理成前端可点的引用结构  
4. `rag_chat()`：一次问答的完整生成器（`yield` 流式 delta）

提示词里的 `{context}`、`{query}` 在这里 `.format(...)` 填进去。

## 检索 `retriever.py` 怎么读

重点搞清：

- 查询如何变成向量  
- 向量检索与关键词（BM25）如何合并  
- `top_k` 取多少条进 Prompt  

改「答得准不准」，经常动这里或入库切片，而不只是改提示词。

## 入库

- 脚本入口：项目根 `scripts/ingest.py`（说明见 [../../scripts/README.md](../../scripts/README.md)）  
- 服务实现：`ingest_service.py`  
- 切片规则：`chunker.py`（标题层级、chunk 大小会影响检索质量）

## 和实验室的关系

| 实验室 Tab | 主要后端 |
|------------|----------|
| Tokenize | `tokenize` 相关 router/service |
| Embedding | `embed_service.py` |
| Attention | attention service |
| RAG Demo | `rag_lab_service.py` + `routers/rag.py` |

实验室是「拆开看原理」；正式对话走 `rag_service.py`。

## 想改行为时改哪

| 你想… | 优先看 |
|-------|--------|
| 回答风格 / 是否允许补充知识 | `prompts/rag_*.txt` |
| 引用格式、流式、落库 | `rag_service.py` |
| 检索不准 | `retriever.py`、`chunker.py`、重新 `ingest` |
| 换模型 / API | `llm_client.py`、`config.py`、`.env` |
| 会话标题、历史 | `session_store.py` |
| 多轮上下文（目前没有） | 要在 `rag_chat` 里把 `get_history` 拼进 `messages` |

# 后端 `app/` — 代码学习指南

FastAPI 后端。对话、RAG、实验室 API 都从这里出去。

## 建议阅读顺序

1. `main.py` — 应用入口、路由挂载、启动时是否自动入库  
2. `config.py` — 环境变量、路径、模型名  
3. `db.py` — SQLite 表（会话 / 消息）  
4. `routers/` — HTTP 接口（先看长什么样）  
5. `services/` — 真正业务逻辑（重点看 RAG）  
6. `models/schemas.py` — 请求/响应数据结构  

更细的 RAG 链路说明见：[services/README.md](services/README.md)

## 目录说明

| 路径 | 干什么 |
|------|--------|
| `main.py` | 创建 FastAPI、挂路由、lifespan（启动/关闭） |
| `config.py` | 读 `.env`，定义 `DB_PATH`、模型、CORS 等 |
| `db.py` | 建表、拿数据库连接 |
| `deps.py` | 依赖注入（如 embedding 模型单例） |
| `models/schemas.py` | Pydantic 模型 |
| `routers/` | 按功能拆的 API |
| `services/` | 业务实现（检索、入库、调 LLM…） |
| `utils/` | 小工具函数 |

## 路由一览（`routers/`）

| 文件 | 前缀 / 用途 |
|------|-------------|
| `chat.py` | `/chat` 流式 RAG 问答 |
| `sessions.py` | `/sessions` 会话 CRUD、历史消息 |
| `knowledge.py` | `/knowledge` 知识库文档列表与正文 |
| `ingest.py` | `/ingest` 触发入库 |
| `embed.py` | Embedding / 相似度（实验室） |
| `tokenize.py` | Tokenizer 演示 |
| `attention.py` | Attention 权重演示 |
| `rag.py` | 实验室用的检索演示 API |

读接口时：打开 http://127.0.0.1:8000/docs 对照着看最快。

## 一次「发消息」经过哪里？

```
前端 POST /sessions/{id}/messages   → 用户话落库
前端 POST /chat（SSE 流）           → routers/chat.py
                                    → services/rag_service.py
                                       ├─ retriever 检索知识
                                       ├─ 读 prompts/*.txt 拼提示词
                                       ├─ llm_client 调大模型（流式）
                                       └─ 助手回复落库（含引用）
```

注意：当前**不会**把历史多轮对话发给模型，只发「当前问题 + 检索资料」。会话历史主要给前端展示用。

## 本地怎么跑

在项目根目录：

```powershell
Set-Location "D:\develop\AI-Brain"
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

改 `app/**/*.py` 会热重载；改 `prompts/*.txt` 不用重启（按文件修改时间自动重读）。

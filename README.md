# AI-Brain

个人 AI 学习笔记与实践仓库。按课循序渐进，从 LLM 基础到 RAG、Agent。

配套 Web 应用：**AI-Brain Chat**（RAG 问答 + 概念实验室）。

## 线上地址

> 部署后在此填写：
> - 前端：https://your-app.vercel.app
> - 后端 API：https://your-backend.up.railway.app/docs

## 课程目录

### 第一阶段：理解 LLM 工作原理

| 课次 | 主题 | 文档 |
|------|------|------|
| 1 | Token 与 Tokenizer | [curriculum/lesson-01-token-tokenizer.md](curriculum/lesson-01-token-tokenizer.md) |
| 2 | Embedding（嵌入） | [curriculum/lesson-02-embedding.md](curriculum/lesson-02-embedding.md) |
| 3 | 什么是 Embedding 向量？ | [curriculum/lesson-03-embedding-vector.md](curriculum/lesson-03-embedding-vector.md) |
| 4 | Transformer 与 Attention | [curriculum/lesson-04-transformer-attention.md](curriculum/lesson-04-transformer-attention.md) |
| 5 | Transformer 工作流程（AI 应用开发版） | [curriculum/lesson-05-transformer-workflow.md](curriculum/lesson-05-transformer-workflow.md) |

### 第二阶段：RAG（AI 工程实践）

| 课次 | 主题 | 文档 |
|------|------|------|
| 6 | 为什么需要 RAG？ | [curriculum/lesson-06-rag-why.md](curriculum/lesson-06-rag-why.md) |
| 7 | Chunk、Retriever 与 LangChain | [curriculum/lesson-07-rag-chunk-retriever.md](curriculum/lesson-07-rag-chunk-retriever.md) |

## 本地开发

### 1. 环境准备

```powershell
Set-Location "D:\develop\AI-Brain"
pip install -r ".\requirements.txt"
```

复制 `.env.example` 为 `.env`，填写火山方舟配置：

```env
LLM_PROVIDER=volcano
ARK_API_KEY=你的Key
ARK_BASE_URL=https://ark.cn-beijing.volces.com/api/v3
ARK_MODEL=ep-你的接入点ID
```

### 2. 知识入库

```powershell
python ".\scripts\ingest.py"           # 手动全量入库
python ".\scripts\ingest.py" --reset   # 清空后重建
```

**自动入库**：后端启动时检测 `curriculum/`、`knowledge/` 变更并自动入库（`AUTO_INGEST_ON_STARTUP=true`，默认开启）。新增课程后仍建议立即执行 `--reset`，无需重启即可 Chat 检索。

### 3. 启动后端

```powershell
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

API 文档：http://127.0.0.1:8000/docs

### 4. 启动前端

```powershell
Set-Location "D:\develop\AI-Brain\frontend"
npm install
npm run dev
```

浏览器打开：http://localhost:5173

## 部署（Vercel + Railway）

### Railway 后端

1. [Railway](https://railway.app) → New Project → Deploy from GitHub → 选本仓库
2. 使用根目录 `Dockerfile` 自动构建
3. 配置环境变量：

| 变量 | 值 |
|------|-----|
| `LLM_PROVIDER` | `volcano` |
| `ARK_API_KEY` | 火山方舟 API Key |
| `ARK_BASE_URL` | `https://ark.cn-beijing.volces.com/api/v3` |
| `ARK_MODEL` | `ep-xxxxxxxx` 接入点 ID |
| `EMBEDDING_MODEL_NAME` | `BAAI/bge-small-zh`（免费层推荐） |
| `AUTO_INGEST_ON_STARTUP` | `false`（部署后手动 `POST /ingest?reset=true` 入库，避免启动 OOM） |
| `CORS_ORIGINS` | `https://你的前端.vercel.app` |

4. **内存**：免费层 1 GB 在加载 embedding 模型时可能 OOM。建议在 Railway **Settings → Resources** 将内存调到 **≥ 2 GB**，或保持 `AUTO_INGEST_ON_STARTUP=false` 并在低峰手动入库。
5. 部署完成后访问 `https://xxx.up.railway.app/health` 确认
6. 在 `/docs` 调用 `POST /ingest?reset=true` 完成线上入库

### Vercel 前端

1. [Vercel](https://vercel.com) → New Project → Import 本仓库
2. **Root Directory** 设为 `frontend`
3. Framework Preset：**Vite**
4. 环境变量：

| 变量 | 值 |
|------|-----|
| `VITE_API_BASE` | `https://你的后端.up.railway.app` |

5. Deploy 后访问 `https://xxx.vercel.app`

### 联调检查

- [ ] 后端 `/health` 返回 ok
- [ ] 前端能打开，对话页可新建会话
- [ ] Chat 流式回答正常
- [ ] 概念实验室四个演示可用（含 RAG Tab）

## 目录结构

```
AI-Brain/
├── app/            # 后端（FastAPI）
├── frontend/       # 前端（Vite + React）
├── curriculum/     # 课程文档（RAG 知识源）
├── knowledge/      # 每日笔记（RAG 知识源）
├── scripts/        # 入库脚本
├── tests/          # 后端测试
├── Dockerfile      # Railway 部署
└── requirements.txt
```

## 课程示例脚本

```powershell
python ".\examples\lesson01_tokenize.py"
python ".\examples\lesson02_embedding.py"
python ".\examples\lesson03_embedding_vector.py"
python ".\examples\lesson04_attention.py"
python ".\examples\lesson05_workflow.py"
python ".\examples\lesson06_rag_intro.py"
python ".\examples\lesson07_rag_chunk.py"
```

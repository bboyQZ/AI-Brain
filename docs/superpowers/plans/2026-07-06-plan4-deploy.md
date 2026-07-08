# Plan 4：部署 实现计划

> **状态：Plan 1/2/3 完成后执行。**

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 把前端部署到 Vercel、后端部署到 Railway，免费层，平台子域名。

**Architecture:** 前后端分离部署。前端 Vercel（自动构建 Vite），后端 Railway（跑 uvicorn）。CORS 在后端配置。环境变量在各平台配置。

**Tech Stack:** Vercel / Railway / uvicorn

**Spec 参考:** `docs/superpowers/specs/2026-07-06-ai-brain-chat-design.md` 第 9 节

---

## Task 1：后端 CORS + 启动配置

**Files:**
- Modify: `app/main.py`（加 CORS）
- Create: `app/config.py`（补 CORS 配置）

- [ ] **Step 1: 补 CORS 配置**

```python
# app/config.py 追加
import os
CORS_ORIGINS = os.getenv("CORS_ORIGINS", "http://localhost:5173").split(",")
```

- [ ] **Step 2: 在 main.py 加 CORS 中间件**

```python
# app/main.py 顶部追加
from fastapi.middleware.cors import CORSMiddleware
from app.config import CORS_ORIGINS

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

- [ ] **Step 3: Commit**

```powershell
git add app/
git commit -m "feat: 添加 CORS 中间件"
```

---

## Task 2：Railway 后端部署

- [ ] **Step 1: 创建 Railway 项目**

1. 注册 Railway 账号
2. New Project → Deploy from GitHub repo → 选 AI-Brain 仓库
3. 选 Python 环境

- [ ] **Step 2: 配置 Railway**

- Root Directory: `/`（项目根）
- Start Command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
- Variables:
  - `DEEPSEEK_API_KEY=sk-xxx`
  - `LLM_PROVIDER=deepseek`
  - `CORS_ORIGINS=https://你的前端域名.vercel.app`

- [ ] **Step 3: 验证后端**

Railway 给一个 `xxx.railway.app` 域名，浏览器打开 `https://xxx.railway.app/docs`，能看到 API 文档。

- [ ] **Step 4: 注意内存**

bge-base-zh 加载约 400MB，Railway 免费层 512MB 可能不够。若启动 OOM：
- 升级到 1GB 层（$5/月）
- 或临时降模型为 `BAAI/bge-small-zh`

---

## Task 3：Vercel 前端部署

- [ ] **Step 1: 配置前端环境变量**

在 `frontend/` 创建 `.env.production`：

```
VITE_API_BASE=https://你的后端域名.railway.app
```

- [ ] **Step 2: 创建 Vercel 项目**

1. 注册 Vercel 账号
2. New Project → Import Git Repository → 选 AI-Brain
3. 配置：
   - Root Directory: `frontend`
   - Framework Preset: Vite
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Environment Variables: `VITE_API_BASE=https://xxx.railway.app`

- [ ] **Step 3: 部署 + 验证**

Vercel 自动构建部署，给 `xxx.vercel.app` 域名。打开验证：
- 能看到 chat 界面
- 能调演示接口
- chat 能流式回复

---

## Task 4：联调 + 入库

- [ ] **Step 1: 线上入库**

```powershell
# 后端部署后，调线上 /ingest
curl -X POST https://xxx.railway.app/ingest
```

或浏览器用 `/docs` 调 `/ingest`。

- [ ] **Step 2: 全量验证**

- chat 能回答课程相关问题，带来源标注
- 三个演示组件正常
- 会话历史跨刷新保留

- [ ] **Step 3: 更新 README**

补充线上访问链接。

- [ ] **Step 4: Commit**

```powershell
git add frontend/.env.production README.md
git commit -m "chore: 部署配置 + README 更新线上链接"
```

---

## Plan 4 完成标准

- [ ] 后端在 Railway 可访问，`/docs` 正常
- [ ] 前端在 Vercel 可访问
- [ ] 前后端联调正常（CORS 通过）
- [ ] 线上入库成功
- [ ] chat 问答在线上可用
- [ ] README 有线上链接

## 依赖

- Plan 1/2/3 全部完成
- `DEEPSEEK_API_KEY` 已准备

---
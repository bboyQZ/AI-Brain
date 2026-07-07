# Plan 3：前端 实现计划

> **状态：vibe coding，技术栈不锁死。** 本计划只定结构、体验目标、对接接口，具体库和组件实现让 AI 现场判断。

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 实现前端：chat 为主界面 + 会话侧栏 + 三个概念交互演示组件（tokenize/embedding/attention）。

**Architecture:** 前后端分离，前端调 Plan 1/2 的 FastAPI 接口。形态 A：chat 为主，演示为辅（侧边/顶部入口进入"概念实验室"）。

**Tech Stack:** vibe coding（推荐 Vite + React + TypeScript 起步，动效/3D 库实现时按需选）

**Spec 参考:** `docs/superpowers/specs/2026-07-06-ai-brain-chat-design.md` 第 3、4 节

**体验目标（锁定，技术不锁）:**
- 游戏感交互反馈：即时响应、微动效、状态奖励
- 视觉层次：发光、深度感，非扁平
- 每次操作引发可见状态变化

**各模块深度（锁定）:**

| 模块 | 深度 | 要求 |
|------|------|------|
| Chat | 流畅动效 | 消息进出场、流式输出反馈 |
| Tokenize | 深度交互 | 输入即切分、悬停看 ID、重复高亮、中英对比、费用估算 |
| Attention | 中等 | 2D 热力图、悬停高亮、点击锁定 token、切 head |
| Embedding | 极致打磨 | 3D 向量空间散点云、可旋转缩放、v1 压轴模块 |

---

## 文件结构（建议，可 vibe coding 调整）

```
frontend/
├── src/
│   ├── main.tsx
│   ├── App.tsx                  # 路由 + 布局
│   ├── api/
│   │   └── client.ts            # 后端 API 封装
│   ├── pages/
│   │   ├── ChatPage.tsx         # chat 主页
│   │   └── LabPage.tsx          # 概念实验室
│   ├── components/
│   │   ├── chat/
│   │   │   ├── ChatWindow.tsx   # 对话窗口
│   │   │   ├── MessageList.tsx  # 消息列表
│   │   │   ├── MessageInput.tsx # 输入框
│   │   │   └── SessionSidebar.tsx # 会话侧栏
│   │   └── lab/
│   │       ├── TokenizeDemo.tsx
│   │       ├── EmbeddingDemo.tsx
│   │       └── AttentionDemo.tsx
│   └── hooks/
│       ├── useChat.ts           # chat 流式接收
│       └── useSession.ts        # 会话管理
└── package.json
```

---

## Task 1：项目骨架 + 路由

- [ ] **Step 1: 初始化前端项目**

```powershell
Set-Location "D:\develop\AI-Brain"
npm create vite@latest frontend -- --template react-ts
cd frontend
npm install
```

- [ ] **Step 2: 装 HTTP 客户端 + 路由**

```powershell
npm install axios react-router-dom
```

- [ ] **Step 3: 写 api/client.ts（后端 API 封装）**

```typescript
// src/api/client.ts
import axios from "axios";

const BASE = import.meta.env.VITE_API_BASE || "http://localhost:8000";

export const api = {
  tokenize: (text: string) => axios.post(`${BASE}/tokenize`, { text }),
  embedVectors: (texts: string[]) => axios.post(`${BASE}/embed/vectors`, { texts }),
  embedSimilarity: (pairs: [string, string][]) => axios.post(`${BASE}/embed/similarity`, { pairs }),
  attention: (text: string) => axios.post(`${BASE}/attention`, { text }),
  createSession: (title: string) => axios.post(`${BASE}/sessions`, { title }),
  listSessions: () => axios.get(`${BASE}/sessions`),
  getHistory: (id: number) => axios.get(`${BASE}/sessions/${id}`),
  addMessage: (id: number, role: string, content: string) =>
    axios.post(`${BASE}/sessions/${id}/messages`, { role, content }),
  chat: (sessionId: number, query: string) =>
    fetch(`${BASE}/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ session_id: sessionId, query }),
    }),
  ingest: () => axios.post(`${BASE}/ingest`),
};
```

- [ ] **Step 4: 写 App.tsx（路由 + 布局）**

```tsx
// src/App.tsx
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import ChatPage from "./pages/ChatPage";
import LabPage from "./pages/LabPage";

export default function App() {
  return (
    <BrowserRouter>
      <nav>
        <Link to="/">对话</Link>
        <Link to="/lab">概念实验室</Link>
      </nav>
      <Routes>
        <Route path="/" element={<ChatPage />} />
        <Route path="/lab" element={<LabPage />} />
      </Routes>
    </BrowserRouter>
  );
}
```

- [ ] **Step 5: 启动验证**

```powershell
npm run dev
```

浏览器打开 `http://localhost:5173`，能看到导航和两个空页面。

- [ ] **Step 6: Commit**

```powershell
git add frontend/
git commit -m "feat: 初始化前端骨架（Vite + React + 路由）"
```

---

## Task 2：Chat 页面 + 会话侧栏

**Files:**
- Create: `src/pages/ChatPage.tsx`
- Create: `src/components/chat/*`
- Create: `src/hooks/useChat.ts`, `useSession.ts`

**对接接口:** `POST /sessions`, `GET /sessions`, `GET /sessions/{id}`, `POST /sessions/{id}/messages`, `POST /chat`（SSE 流式）

- [ ] **Step 1: 写 useSession.ts（会话 CRUD）**

封装：创建会话、列表、切换、拉历史。会话列表点切换 → 拉历史 → 渲染。

- [ ] **Step 2: 写 useChat.ts（流式接收）**

封装：调用 `/chat`，用 ReadableStream 解析 SSE `data:` 行，逐 delta 更新当前 assistant 消息。

- [ ] **Step 3: 写 SessionSidebar.tsx**

- 会话列表（从 `GET /sessions`）
- 新建会话按钮（`POST /sessions`）
- 点击切换（拉历史）
- 匿名 session ID 存 localStorage（首次访问生成）

- [ ] **Step 4: 写 ChatWindow + MessageList + MessageInput**

- MessageList：渲染消息气泡，user 右侧、assistant 左侧
- MessageInput：输入框 + 发送，回车发送
- 流式输出：assistant 消息边接收边渲染，有打字机效果

- [ ] **Step 5: 写 ChatPage.tsx（组合）**

左侧 SessionSidebar，右侧 ChatWindow。

- [ ] **Step 6: 手动联调**

启动后端 `uvicorn app.main:app --reload`，启动前端 `npm run dev`，能新建会话、发消息、收到流式回复（Plan 2 完成后才能真通，Plan 1 阶段先联调会话管理）。

- [ ] **Step 7: Commit**

```powershell
git add frontend/src/
git commit -m "feat: 实现 Chat 页面 + 会话侧栏 + 流式接收"
```

---

## Task 3：Tokenize 演示组件

**Files:**
- Create: `src/components/lab/TokenizeDemo.tsx`

**对接接口:** `POST /tokenize`

**深度要求:**
- 输入框，输入即切分（debounce 300ms）
- token 列表：每个 token 一个色块，显示 piece，悬停显示 ID
- 重复 token 高亮（鼠标悬停某 token，所有相同 token 高亮）
- 中英对比：可同时输入两段文本，并排显示 token 数对比
- token 费用估算：按 GPT-4 定价估算（$0.03/1K input token 等，可硬编码）

- [ ] **Step 1: 实现基础切分展示**（输入 → token 色块列表 + 数量）
- [ ] **Step 2: 加悬停交互**（悬停看 ID + 重复高亮）
- [ ] **Step 3: 加中英对比**（双输入框并排）
- [ ] **Step 4: 加费用估算**（底部显示估算成本）
- [ ] **Step 5: 打磨动效**（token 出现动画、悬停反馈）
- [ ] **Step 6: Commit**

```powershell
git add frontend/src/components/lab/TokenizeDemo.tsx
git commit -m "feat: 实现 Tokenize 交互演示组件"
```

---

## Task 4：Attention 演示组件

**Files:**
- Create: `src/components/lab/AttentionDemo.tsx`

**对接接口:** `POST /attention`

**深度要求:**
- 输入文本，返回后渲染 2D 热力图（行=query token，列=key token，颜色=权重）
- 悬停某格高亮该行该列
- 点击某 token 锁定，只看该 token 对其他 token 的注意力
- head 切换器（下拉选 head）
- layer 切换器（下拉选 layer）

- [ ] **Step 1: 实现热力图渲染**（Canvas 或 SVG，颜色映射权重）
- [ ] **Step 2: 加悬停高亮**
- [ ] **Step 3: 加点击锁定 + head/layer 切换**
- [ ] **Step 4: 打磨视觉**（发光、过渡动画）
- [ ] **Step 5: Commit**

```powershell
git add frontend/src/components/lab/AttentionDemo.tsx
git commit -m "feat: 实现 Attention 交互演示组件"
```

---

## Task 5：Embedding 演示组件（压轴）

**Files:**
- Create: `src/components/lab/EmbeddingDemo.tsx`

**对接接口:** `POST /embed/vectors`

**深度要求:**
- 用户输入多个词/句子
- 调接口拿真实 embedding（高维）
- 降维到 3D（PCA 或 t-SNE）
- 3D 散点云：可旋转、缩放、拖拽
- 每个点是可悬停的标签
- 视觉极致打磨：发光、粒子感、深度（vibe coding 自由发挥，可引 Three.js/R3F）

- [ ] **Step 1: 实现输入 + 调接口拿向量**
- [ ] **Step 2: 实现降维（PCA，可用 ml-pca 或手写）**
- [ ] **Step 3: 实现 3D 散点渲染**（OrbitControls + points）
- [ ] **Step 4: 加交互**（悬停标签、点击高亮相似点）
- [ ] **Step 5: 视觉打磨**（发光、粒子、动效，这是压轴模块，投入最多时间）
- [ ] **Step 6: Commit**

```powershell
git add frontend/src/components/lab/EmbeddingDemo.tsx
git commit -m "feat: 实现 Embedding 3D 向量空间演示组件（压轴）"
```

---

## Task 6：Lab 页面 + 整体打磨

**Files:**
- Create: `src/pages/LabPage.tsx`
- Modify: `src/App.tsx`

- [ ] **Step 1: 写 LabPage（三个演示 tab 切换或并排）**
- [ ] **Step 2: 全局视觉统一**（配色、字体、过渡一致）
- [ ] **Step 3: 响应式适配**（移动端可用）
- [ ] **Step 4: 全量手动测试**（三个演示 + chat 联调）
- [ ] **Step 5: Commit**

```powershell
git add frontend/
git commit -m "feat: 前端整体打磨 + Lab 页面整合"
```

---

## Plan 3 完成标准

- [ ] Chat 页面：新建会话、发消息、流式回复、会话切换
- [ ] Tokenize 演示：切分、悬停、重复高亮、中英对比、费用估算
- [ ] Attention 演示：热力图、悬停、锁定、切 head/layer
- [ ] Embedding 演示：3D 散点、旋转缩放、视觉极致
- [ ] 整体游戏感动效、视觉统一
- [ ] 移动端基本可用

## 依赖

- Plan 1 完成（演示接口可用）
- Plan 2 完成（chat 接口可用，否则 chat 页面只能联调会话管理）

---
# 前端 `frontend/` — 代码学习指南

Vite + React + TypeScript。页面：对话、概念实验室、知识库。

## 建议阅读顺序

1. `src/main.tsx` — React 挂载  
2. `src/App.tsx` — 路由 + 顶栏 + **浅色/暗色主题切换**  
3. `src/index.css` — 全局设计 token（颜色变量）  
4. `src/pages/ChatPage.tsx` — 对话页如何拼侧栏 / 消息 / 输入  
5. `src/hooks/useSession.ts`、`useChat.ts` — 会话与流式请求  
6. `src/api/client.ts` — 所有后端 API 封装  

## 目录说明

```
src/
├── api/client.ts          # fetch 封装，BASE = VITE_API_BASE
├── pages/
│   ├── ChatPage.*         # 对话
│   ├── LabPage.*          # 概念实验室
│   └── KnowledgePage.*    # 知识库阅读
├── components/
│   ├── chat/              # 侧栏、消息列表、输入框
│   └── lab/               # Tokenize / Embedding / Attention / RAG 演示
├── hooks/                 # 会话、流式聊天
└── utils/                 # markdown、PCA 等
```

## 主题（浅色 / 暗色）

- Token 定义在 `src/index.css` 的 `:root` 与 `[data-theme="dark"]`  
- `App.tsx` 读写 `localStorage` 键 `ai-brain-theme`，设置 `document.documentElement.dataset.theme`  
- 侧栏用 `--sidebar-bg`（浅色淡天蓝），主区用 `--bg` 白底  

改颜色：优先改 CSS 变量，少写死 `rgba(...)`。

## 对话页布局要点

- `ChatPage`：`chat-scroll` 全宽滚动（滚动条在主区域最右侧），内容列 `max-width: 880px` 居中  
- `MessageList`：渲染消息、欢迎语、引用芯片  
- `MessageInput`：底部输入；流式时 `disabled`  
- 示例问题文案在 `ChatPage.tsx` 的 `examplePrompts`（不是模型提示词）

## 流式聊天怎么走

1. `useChat` / `streamChat` 请求后端 `/chat`（SSE 或流式 JSON）  
2. 边收 `delta` 边 `appendStreaming` 更新界面  
3. 首包可带 `sources`，消息下展示「引用来源」  

后端地址：`.env` / `.env.production` 里的 `VITE_API_BASE`，默认本地 `http://localhost:8000`。

## 概念实验室

| 组件 | 学什么 |
|------|--------|
| `TokenizeDemo` | 分词 |
| `EmbeddingDemo` | 向量 → PCA → 3D 散点（Three.js） |
| `AttentionDemo` | Attention 热力图 |
| `RagDemo` | 检索过程可视化 |

Embedding 散点：实心点 + 正常混合（避免暗色「一坨光」）。

## 本地启动

```powershell
Set-Location "D:\develop\AI-Brain\frontend"
npm install
npm run dev
```

打开 http://localhost:5173

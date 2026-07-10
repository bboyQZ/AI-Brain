export type LineExplain = {
  /** 相对截取源码的 1-based 行号 */
  line: number;
  endLine?: number;
  text: string;
};

export type FlowNodeDef = {
  id: string;
  label: string;
  file: string;
  symbol?: string;
  note?: string;
  position: { x: number; y: number };
};

export type FlowEdgeDef = {
  id: string;
  source: string;
  target: string;
  label?: string;
  /** 连线不好画时，在源节点上显示跳转按钮 */
  jump?: boolean;
  /** React Flow handle id：out | out-top | out-bottom */
  sourceHandle?: string;
  /** React Flow handle id：in | in-top | in-bottom */
  targetHandle?: string;
};

export type FlowDef = {
  id: string;
  title: string;
  summary: string;
  nodes: FlowNodeDef[];
  edges: FlowEdgeDef[];
};

export const GUIDE_FLOWS: FlowDef[] = [
  {
    id: "chat-rag",
    title: "一次对话（RAG）",
    summary: "从发消息到流式回答：落库 → 检索 → 提示词 → 模型 → 回写。",
    nodes: [
      {
        id: "handleSend",
        label: "ChatPage 发送逻辑",
        file: "frontend/src/pages/ChatPage.tsx",
        symbol: "ChatPage",
        note: "组件内 handleSend：落库用户消息并启动流式",
        position: { x: 40, y: 220 },
      },
      {
        id: "streamChat",
        label: "streamChat()",
        file: "frontend/src/hooks/useChat.ts",
        symbol: "streamChat",
        position: { x: 300, y: 220 },
      },
      {
        id: "add_msg",
        label: "add_msg()",
        file: "app/routers/sessions.py",
        symbol: "add_msg",
        position: { x: 300, y: 20 },
      },
      {
        id: "chat_route",
        label: "chat()",
        file: "app/routers/chat.py",
        symbol: "chat",
        position: { x: 560, y: 220 },
      },
      {
        id: "rag_chat",
        label: "rag_chat()",
        file: "app/services/rag_service.py",
        symbol: "rag_chat",
        position: { x: 820, y: 220 },
      },
      {
        id: "hybrid_retrieve",
        label: "hybrid_retrieve()",
        file: "app/services/retriever.py",
        symbol: "hybrid_retrieve",
        position: { x: 820, y: 20 },
      },
      {
        id: "load_prompt",
        label: "_load_prompt()",
        file: "app/services/rag_service.py",
        symbol: "_load_prompt",
        position: { x: 1080, y: 20 },
      },
      {
        id: "get_llm",
        label: "get_llm() / chat()",
        file: "app/services/llm_client.py",
        symbol: "LLMClient.chat",
        position: { x: 1080, y: 220 },
      },
      {
        id: "add_message",
        label: "add_message()",
        file: "app/services/session_store.py",
        symbol: "add_message",
        position: { x: 820, y: 440 },
      },
    ],
    edges: [
      {
        id: "e1",
        source: "handleSend",
        target: "add_msg",
        label: "用户消息落库",
        sourceHandle: "out-top",
        targetHandle: "in-bottom",
      },
      {
        id: "e2",
        source: "handleSend",
        target: "streamChat",
        label: "开始流式",
        sourceHandle: "out",
        targetHandle: "in",
      },
      {
        id: "e3",
        source: "streamChat",
        target: "chat_route",
        label: "POST /chat",
        sourceHandle: "out",
        targetHandle: "in",
      },
      {
        id: "e4",
        source: "chat_route",
        target: "rag_chat",
        sourceHandle: "out",
        targetHandle: "in",
      },
      {
        id: "e5",
        source: "rag_chat",
        target: "hybrid_retrieve",
        label: "检索",
        sourceHandle: "out-top",
        targetHandle: "in-bottom",
      },
      {
        id: "e6",
        source: "rag_chat",
        target: "load_prompt",
        label: "读提示词",
        sourceHandle: "out-top",
        targetHandle: "in",
      },
      {
        id: "e7",
        source: "rag_chat",
        target: "get_llm",
        label: "调模型",
        sourceHandle: "out",
        targetHandle: "in",
      },
      {
        id: "e8",
        source: "rag_chat",
        target: "add_message",
        label: "助手落库",
        sourceHandle: "out-bottom",
        targetHandle: "in-top",
      },
      { id: "e9", source: "get_llm", target: "streamChat", label: "流式 delta", jump: true },
    ],
  },
  {
    id: "ingest",
    title: "知识入库",
    summary: "文档 → 切片 → 向量 → 写入索引，供对话检索。",
    nodes: [
      {
        id: "main",
        label: "main()",
        file: "scripts/ingest.py",
        symbol: "main",
        position: { x: 40, y: 120 },
      },
      {
        id: "run_ingest",
        label: "run_ingest()",
        file: "app/services/ingest_service.py",
        symbol: "run_ingest",
        position: { x: 320, y: 120 },
      },
      {
        id: "ingest_dir",
        label: "ingest_dir()",
        file: "app/services/ingest_service.py",
        symbol: "ingest_dir",
        position: { x: 600, y: 40 },
      },
      {
        id: "chunk_markdown",
        label: "chunk_markdown()",
        file: "app/services/chunker.py",
        symbol: "chunk_markdown",
        position: { x: 600, y: 200 },
      },
      {
        id: "add_chunks",
        label: "add_chunks()",
        file: "app/services/vector_store.py",
        symbol: "add_chunks",
        position: { x: 880, y: 120 },
      },
      {
        id: "build_bm25",
        label: "build_bm25_index()",
        file: "app/services/retriever.py",
        symbol: "build_bm25_index",
        position: { x: 1160, y: 120 },
      },
      {
        id: "auto_ingest",
        label: "auto_ingest_if_needed()",
        file: "app/services/ingest_service.py",
        symbol: "auto_ingest_if_needed",
        note: "后端启动时也可能走这条",
        position: { x: 320, y: 280 },
      },
    ],
    edges: [
      {
        id: "i1",
        source: "main",
        target: "run_ingest",
        sourceHandle: "out",
        targetHandle: "in",
      },
      {
        id: "i2",
        source: "run_ingest",
        target: "ingest_dir",
        sourceHandle: "out",
        targetHandle: "in",
      },
      {
        id: "i3",
        source: "ingest_dir",
        target: "chunk_markdown",
        label: "切片",
        sourceHandle: "out-bottom",
        targetHandle: "in-top",
      },
      {
        id: "i4",
        source: "chunk_markdown",
        target: "add_chunks",
        label: "写入向量库",
        jump: true,
      },
      {
        id: "i5",
        source: "add_chunks",
        target: "build_bm25",
        label: "重建 BM25",
        sourceHandle: "out",
        targetHandle: "in",
      },
      {
        id: "i6",
        source: "auto_ingest",
        target: "run_ingest",
        label: "启动自动入库",
        jump: true,
      },
    ],
  },
  {
    id: "frontend",
    title: "前端会话与主题",
    summary: "主题切换、会话状态、消息列表如何组织。",
    nodes: [
      {
        id: "App",
        label: "App()",
        file: "frontend/src/App.tsx",
        symbol: "App",
        note: "路由 + 主题 data-theme",
        position: { x: 40, y: 200 },
      },
      {
        id: "useSession",
        label: "useSession()",
        file: "frontend/src/hooks/useSession.ts",
        symbol: "useSession",
        position: { x: 360, y: 20 },
      },
      {
        id: "ChatPage",
        label: "ChatPage()",
        file: "frontend/src/pages/ChatPage.tsx",
        symbol: "ChatPage",
        position: { x: 360, y: 200 },
      },
      {
        id: "streamChat2",
        label: "streamChat()",
        file: "frontend/src/hooks/useChat.ts",
        symbol: "streamChat",
        position: { x: 680, y: 200 },
      },
      {
        id: "GuidePage",
        label: "GuidePage()",
        file: "frontend/src/pages/GuidePage.tsx",
        symbol: "GuidePage",
        note: "本页：方法方块图",
        position: { x: 680, y: 20 },
      },
    ],
    edges: [
      {
        id: "f1",
        source: "App",
        target: "ChatPage",
        label: "路由 /",
        sourceHandle: "out",
        targetHandle: "in",
      },
      {
        id: "f2",
        source: "App",
        target: "GuidePage",
        label: "路由 /guide",
        sourceHandle: "out-top",
        targetHandle: "in",
      },
      {
        id: "f3",
        source: "ChatPage",
        target: "useSession",
        label: "会话状态",
        sourceHandle: "out-top",
        targetHandle: "in-bottom",
      },
      {
        id: "f4",
        source: "ChatPage",
        target: "streamChat2",
        label: "发消息",
        sourceHandle: "out",
        targetHandle: "in",
      },
    ],
  },
  {
    id: "lab",
    title: "概念实验室",
    summary: "实验室演示 API 与组件（与正式对话 RAG 分开）。",
    nodes: [
      {
        id: "LabPage",
        label: "LabPage()",
        file: "frontend/src/pages/LabPage.tsx",
        symbol: "LabPage",
        position: { x: 40, y: 200 },
      },
      {
        id: "RagDemo",
        label: "RagDemo",
        file: "frontend/src/components/lab/RagDemo.tsx",
        symbol: "RagDemo",
        position: { x: 340, y: 40 },
      },
      {
        id: "EmbeddingDemo",
        label: "EmbeddingDemo",
        file: "frontend/src/components/lab/EmbeddingDemo.tsx",
        symbol: "EmbeddingDemo",
        position: { x: 340, y: 320 },
      },
      {
        id: "lab_retrieve",
        label: "lab_retrieve()",
        file: "app/services/rag_lab_service.py",
        symbol: "lab_retrieve",
        position: { x: 640, y: 40 },
      },
      {
        id: "chunk_simple",
        label: "chunk_text_simple()",
        file: "app/services/rag_lab_service.py",
        symbol: "chunk_text_simple",
        position: { x: 640, y: 200 },
      },
    ],
    edges: [
      {
        id: "l1",
        source: "LabPage",
        target: "RagDemo",
        sourceHandle: "out-top",
        targetHandle: "in",
      },
      {
        id: "l2",
        source: "LabPage",
        target: "EmbeddingDemo",
        sourceHandle: "out-bottom",
        targetHandle: "in",
      },
      {
        id: "l3",
        source: "RagDemo",
        target: "lab_retrieve",
        label: "演示检索",
        sourceHandle: "out",
        targetHandle: "in",
      },
      {
        id: "l4",
        source: "RagDemo",
        target: "chunk_simple",
        label: "演示切片",
        jump: true,
      },
    ],
  },
  {
    id: "prompts",
    title: "提示词加载",
    summary: "提示词文件如何被读入并填进模型 messages。",
    nodes: [
      {
        id: "rag_user",
        label: "rag_user.txt",
        file: "prompts/rag_user.txt",
        note: "用户模板（含 {context}/{query}）",
        position: { x: 40, y: 40 },
      },
      {
        id: "rag_system",
        label: "rag_system.txt",
        file: "prompts/rag_system.txt",
        note: "system 人设",
        position: { x: 40, y: 280 },
      },
      {
        id: "load",
        label: "_load_prompt()",
        file: "app/services/rag_service.py",
        symbol: "_load_prompt",
        position: { x: 360, y: 160 },
      },
      {
        id: "rag_chat2",
        label: "rag_chat()",
        file: "app/services/rag_service.py",
        symbol: "rag_chat",
        position: { x: 680, y: 160 },
      },
    ],
    edges: [
      {
        id: "p1",
        source: "rag_user",
        target: "load",
        sourceHandle: "out",
        targetHandle: "in-top",
      },
      {
        id: "p2",
        source: "rag_system",
        target: "load",
        sourceHandle: "out",
        targetHandle: "in-bottom",
      },
      {
        id: "p3",
        source: "load",
        target: "rag_chat2",
        label: "format + messages",
        sourceHandle: "out",
        targetHandle: "in",
      },
    ],
  },
];

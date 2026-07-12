export type LineExplain = {
  /** 相对截取源码的 1-based 行号 */
  line: number;
  endLine?: number;
  text: string;
};

export type FlowNodeDef = {
  id: string;
  label: string;
  /** interaction = 用户操作/界面变化；code = 源码方法（默认） */
  kind?: "interaction" | "code";
  /** 交互步骤序号，显示在方块上 */
  step?: number;
  file?: string;
  symbol?: string;
  note?: string;
  /** 交互节点可一键跳到相关代码方块 */
  relatedCodeId?: string;
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
    summary: "从用户点击「发送」开始，按时间顺序看：界面 → 前端 → 后端 → 流式回显。",
    nodes: [
      {
        id: "ix_send",
        kind: "interaction",
        step: 1,
        label: "用户点击「发送」",
        note: "或按 Enter；输入框有内容且 AI 未在回复中",
        relatedCodeId: "handleSend",
        position: { x: 0, y: 140 },
      },
      {
        id: "handleSend",
        label: "handleSend()",
        file: "frontend/src/pages/ChatPage.tsx",
        symbol: "ChatPage",
        note: "前端接管：校验、落库、开流",
        position: { x: 220, y: 140 },
      },
      {
        id: "add_msg",
        label: "POST /sessions/…/messages",
        file: "app/routers/sessions.py",
        symbol: "add_msg",
        note: "用户消息先写入数据库",
        position: { x: 440, y: 140 },
      },
      {
        id: "ix_bubbles",
        kind: "interaction",
        step: 2,
        label: "界面更新气泡",
        note: "侧栏刷新；出现用户气泡 + 空的 AI 气泡",
        relatedCodeId: "handleSend",
        position: { x: 660, y: 140 },
      },
      {
        id: "streamChat",
        label: "streamChat()",
        file: "frontend/src/hooks/useChat.ts",
        symbol: "streamChat",
        note: "POST /chat，准备读 SSE 流",
        position: { x: 880, y: 140 },
      },
      {
        id: "chat_route",
        label: "chat() 路由",
        file: "app/routers/chat.py",
        symbol: "chat",
        position: { x: 1100, y: 140 },
      },
      {
        id: "rag_chat",
        label: "rag_chat()",
        file: "app/services/rag_service.py",
        symbol: "rag_chat",
        note: "检索 → 拼提示词 → 调模型",
        position: { x: 1320, y: 140 },
      },
      {
        id: "hybrid_retrieve",
        label: "hybrid_retrieve()",
        file: "app/services/retriever.py",
        symbol: "hybrid_retrieve",
        position: { x: 1320, y: 0 },
      },
      {
        id: "load_prompt",
        label: "_load_prompt()",
        file: "app/services/rag_service.py",
        symbol: "_load_prompt",
        position: { x: 1540, y: 0 },
      },
      {
        id: "get_llm",
        label: "LLM 流式生成",
        file: "app/services/llm_client.py",
        symbol: "LLMClient.chat",
        position: { x: 1540, y: 140 },
      },
      {
        id: "ix_stream",
        kind: "interaction",
        step: 3,
        label: "AI 回答逐字显示",
        note: "每收到一段 delta 就追加到气泡里",
        relatedCodeId: "streamChat",
        position: { x: 1760, y: 140 },
      },
      {
        id: "add_message",
        label: "add_message() 落库",
        file: "app/services/session_store.py",
        symbol: "add_message",
        position: { x: 1320, y: 280 },
      },
      {
        id: "ix_done",
        kind: "interaction",
        step: 4,
        label: "回复结束",
        note: "输入框恢复；引用来源挂在消息下方",
        relatedCodeId: "streamChat",
        position: { x: 1980, y: 140 },
      },
    ],
    edges: [
      { id: "e1", source: "ix_send", target: "handleSend", label: "① 触发" },
      { id: "e2", source: "handleSend", target: "add_msg", label: "② 存用户话" },
      { id: "e3", source: "add_msg", target: "ix_bubbles", label: "③ 刷新 UI" },
      { id: "e4", source: "ix_bubbles", target: "streamChat", label: "④ 开流" },
      { id: "e5", source: "streamChat", target: "chat_route", label: "⑤ POST /chat" },
      { id: "e6", source: "chat_route", target: "rag_chat" },
      {
        id: "e7",
        source: "rag_chat",
        target: "hybrid_retrieve",
        label: "⑥ 检索知识",
        sourceHandle: "out-top",
        targetHandle: "in-bottom",
      },
      {
        id: "e8",
        source: "rag_chat",
        target: "load_prompt",
        label: "⑦ 读提示词",
        sourceHandle: "out-top",
        targetHandle: "in-bottom",
      },
      { id: "e9", source: "rag_chat", target: "get_llm", label: "⑧ 调模型" },
      {
        id: "e10",
        source: "get_llm",
        target: "ix_stream",
        label: "⑨ SSE delta",
        jump: true,
      },
      { id: "e11", source: "ix_stream", target: "ix_done", label: "⑩ 显示完毕" },
      {
        id: "e12",
        source: "rag_chat",
        target: "add_message",
        label: "⑪ 助手落库",
        sourceHandle: "out-bottom",
        targetHandle: "in-top",
      },
    ],
  },
  {
    id: "ingest",
    title: "知识入库",
    summary: "两条入口（手动脚本 / 启动自动检测），最终都是：读文档 → 切片 → 向量 → 索引。",
    nodes: [
      {
        id: "ix_run_script",
        kind: "interaction",
        step: 1,
        label: "开发者运行 ingest.py",
        note: "终端执行 python scripts/ingest.py（或 --reset 全量重建）",
        relatedCodeId: "main",
        position: { x: 0, y: 40 },
      },
      {
        id: "ix_auto_start",
        kind: "interaction",
        step: 1,
        label: "或：后端启动时自动检测",
        note: "AUTO_INGEST_ON_STARTUP=true 时，发现 curriculum/knowledge 变更就入库",
        relatedCodeId: "auto_ingest",
        position: { x: 0, y: 200 },
      },
      {
        id: "main",
        label: "main()",
        file: "scripts/ingest.py",
        symbol: "main",
        position: { x: 280, y: 40 },
      },
      {
        id: "auto_ingest",
        label: "auto_ingest_if_needed()",
        file: "app/services/ingest_service.py",
        symbol: "auto_ingest_if_needed",
        position: { x: 280, y: 200 },
      },
      {
        id: "run_ingest",
        label: "run_ingest()",
        file: "app/services/ingest_service.py",
        symbol: "run_ingest",
        position: { x: 520, y: 120 },
      },
      {
        id: "ingest_dir",
        label: "ingest_dir()",
        file: "app/services/ingest_service.py",
        symbol: "ingest_dir",
        position: { x: 760, y: 40 },
      },
      {
        id: "chunk_markdown",
        label: "chunk_markdown()",
        file: "app/services/chunker.py",
        symbol: "chunk_markdown",
        position: { x: 760, y: 200 },
      },
      {
        id: "add_chunks",
        label: "add_chunks()",
        file: "app/services/vector_store.py",
        symbol: "add_chunks",
        position: { x: 1000, y: 120 },
      },
      {
        id: "build_bm25",
        label: "build_bm25_index()",
        file: "app/services/retriever.py",
        symbol: "build_bm25_index",
        position: { x: 1240, y: 120 },
      },
      {
        id: "ix_ready",
        kind: "interaction",
        step: 2,
        label: "Chat 可检索新知识",
        note: "向量库 + BM25 就绪；对话时会 hybrid_retrieve 命中",
        relatedCodeId: "run_ingest",
        position: { x: 1480, y: 120 },
      },
    ],
    edges: [
      { id: "i1", source: "ix_run_script", target: "main", label: "① 手动触发" },
      { id: "i2", source: "main", target: "run_ingest" },
      { id: "i3", source: "ix_auto_start", target: "auto_ingest", label: "① 启动触发" },
      { id: "i4", source: "auto_ingest", target: "run_ingest", label: "② 合并入口" },
      { id: "i5", source: "run_ingest", target: "ingest_dir", label: "③ 扫目录" },
      {
        id: "i6",
        source: "ingest_dir",
        target: "chunk_markdown",
        label: "④ 切片",
        sourceHandle: "out-bottom",
        targetHandle: "in-top",
      },
      { id: "i7", source: "chunk_markdown", target: "add_chunks", label: "⑤ 写向量库" },
      { id: "i8", source: "add_chunks", target: "build_bm25", label: "⑥ 建 BM25" },
      { id: "i9", source: "build_bm25", target: "ix_ready", label: "⑦ 完成" },
    ],
  },
  {
    id: "frontend",
    title: "前端会话与主题",
    summary: "用户在前端导航、切会话、切主题时，页面组件如何响应。",
    nodes: [
      {
        id: "ix_load_app",
        kind: "interaction",
        step: 1,
        label: "用户打开网站",
        note: "浏览器加载 SPA，App 挂载路由",
        relatedCodeId: "App",
        position: { x: 0, y: 120 },
      },
      {
        id: "App",
        label: "App()",
        file: "frontend/src/App.tsx",
        symbol: "App",
        note: "路由 + 主题 data-theme",
        position: { x: 240, y: 120 },
      },
      {
        id: "ix_nav_chat",
        kind: "interaction",
        step: 2,
        label: "用户进入「对话」",
        relatedCodeId: "ChatPage",
        position: { x: 480, y: 40 },
      },
      {
        id: "ix_nav_guide",
        kind: "interaction",
        step: 2,
        label: "用户进入「源码导读」",
        relatedCodeId: "GuidePage",
        position: { x: 480, y: 200 },
      },
      {
        id: "ix_pick_session",
        kind: "interaction",
        step: 3,
        label: "用户点击侧栏某个会话",
        note: "加载该会话历史消息",
        relatedCodeId: "useSession",
        position: { x: 1200, y: 40 },
      },
      {
        id: "ChatPage",
        label: "ChatPage()",
        file: "frontend/src/pages/ChatPage.tsx",
        symbol: "ChatPage",
        position: { x: 960, y: 40 },
      },
      {
        id: "useSession",
        label: "useSession()",
        file: "frontend/src/hooks/useSession.ts",
        symbol: "useSession",
        position: { x: 1440, y: 40 },
      },
      {
        id: "GuidePage",
        label: "GuidePage()",
        file: "frontend/src/pages/GuidePage.tsx",
        symbol: "GuidePage",
        note: "本页：交互流程图 + 源码",
        position: { x: 720, y: 200 },
      },
      {
        id: "streamChat2",
        label: "streamChat()",
        file: "frontend/src/hooks/useChat.ts",
        symbol: "streamChat",
        note: "发消息细节见「一次对话」流程",
        position: { x: 1200, y: 40 },
      },
    ],
    edges: [
      { id: "f1", source: "ix_load_app", target: "App", label: "① 加载" },
      { id: "f2", source: "App", target: "ix_nav_chat", label: "② 导航" },
      { id: "f3", source: "ix_nav_chat", target: "ChatPage" },
      { id: "f4", source: "App", target: "ix_nav_guide", label: "② 导航", sourceHandle: "out-bottom", targetHandle: "in-top" },
      { id: "f5", source: "ix_nav_guide", target: "GuidePage" },
      { id: "f6", source: "ChatPage", target: "ix_pick_session", label: "③ 可切会话" },
      { id: "f7", source: "ix_pick_session", target: "useSession", label: "加载消息" },
      { id: "f8", source: "ChatPage", target: "streamChat2", label: "发消息见另一流程", jump: true },
    ],
  },
  {
    id: "lab",
    title: "概念实验室",
    summary: "用户在实验室里点什么 → 调哪个演示 API → 界面怎么更新。",
    nodes: [
      {
        id: "ix_open_lab",
        kind: "interaction",
        step: 1,
        label: "用户打开「概念实验室」",
        note: "顶栏进入 /lab；右侧编辑共用示例文本",
        relatedCodeId: "LabPage",
        position: { x: 0, y: 120 },
      },
      {
        id: "ix_switch_tab",
        kind: "interaction",
        step: 2,
        label: "切换 Tab（Tokenize / RAG…）",
        note: "左侧演示区随 Tab 切换组件",
        relatedCodeId: "LabPage",
        position: { x: 480, y: 120 },
      },
      {
        id: "LabPage",
        label: "LabPage()",
        file: "frontend/src/pages/LabPage.tsx",
        symbol: "LabPage",
        position: { x: 240, y: 120 },
      },
      {
        id: "ix_rag_click",
        kind: "interaction",
        step: 3,
        label: "用户点「执行切块 / 检索」",
        note: "RAG Tab 内按钮触发",
        relatedCodeId: "RagDemo",
        position: { x: 720, y: 40 },
      },
      {
        id: "ix_embed_click",
        kind: "interaction",
        step: 3,
        label: "用户点「生成 3D 向量空间」",
        note: "Embedding Tab 内按钮触发",
        relatedCodeId: "EmbeddingDemo",
        position: { x: 720, y: 240 },
      },
      {
        id: "RagDemo",
        label: "RagDemo",
        file: "frontend/src/components/lab/RagDemo.tsx",
        symbol: "RagDemo",
        position: { x: 960, y: 0 },
      },
      {
        id: "EmbeddingDemo",
        label: "EmbeddingDemo",
        file: "frontend/src/components/lab/EmbeddingDemo.tsx",
        symbol: "EmbeddingDemo",
        position: { x: 960, y: 240 },
      },
      {
        id: "lab_retrieve",
        label: "lab_retrieve()",
        file: "app/services/rag_lab_service.py",
        symbol: "lab_retrieve",
        position: { x: 1200, y: 0 },
      },
      {
        id: "chunk_simple",
        label: "chunk_text_simple()",
        file: "app/services/rag_lab_service.py",
        symbol: "chunk_text_simple",
        position: { x: 1200, y: 120 },
      },
      {
        id: "ix_show_result",
        kind: "interaction",
        step: 4,
        label: "界面展示切块/命中结果",
        note: "列表或 3D 点云更新；与正式 Chat RAG 分开",
        relatedCodeId: "RagDemo",
        position: { x: 1440, y: 120 },
      },
    ],
    edges: [
      { id: "l1", source: "ix_open_lab", target: "LabPage", label: "① 进入" },
      { id: "l2", source: "LabPage", target: "ix_switch_tab", label: "② 切 Tab" },
      {
        id: "l3",
        source: "ix_switch_tab",
        target: "ix_rag_click",
        label: "③ RAG 分支",
        sourceHandle: "out-top",
        targetHandle: "in",
      },
      { id: "l5", source: "ix_rag_click", target: "RagDemo", label: "④ 点击" },
      { id: "l6", source: "RagDemo", target: "chunk_simple", label: "切块 API" },
      { id: "l7", source: "RagDemo", target: "lab_retrieve", label: "检索 API", sourceHandle: "out", targetHandle: "in" },
      {
        id: "l8",
        source: "ix_switch_tab",
        target: "ix_embed_click",
        label: "③ Embedding 分支",
        sourceHandle: "out-bottom",
        targetHandle: "in",
      },
      { id: "l8b", source: "ix_embed_click", target: "EmbeddingDemo", label: "④ 点击" },
      { id: "l9", source: "lab_retrieve", target: "ix_show_result", label: "⑤ 回显" },
      { id: "l10", source: "chunk_simple", target: "ix_show_result", label: "⑤ 回显", jump: true },
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

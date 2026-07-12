import type { LineExplain } from "./flows";

/** 按流程节点 id：方块一句话 + 代码分段说明（多行共用一句） */
export const NODE_EXPLAIN: Record<
  string,
  { blurb: string; lines: LineExplain[] }
> = {
  ix_send: {
    blurb: "整条对话链路的起点：用户在聊天页点发送。",
    lines: [
      { line: 1, text: "输入框里有字，且 AI 当前没在回复（sending=false）。" },
      { line: 2, text: "也可以按 Enter 发送；空内容或正在回复时按钮无效。" },
      { line: 3, text: "接下来由前端 handleSend 接管：检查会话、落库、开流。" },
    ],
  },
  ix_bubbles: {
    blurb: "用户消息已保存，界面立刻有反馈，不用等 AI 说完。",
    lines: [
      { line: 1, text: "侧栏会话列表刷新（新会话会出现，旧会话排序可能变）。" },
      { line: 2, text: "聊天区追加用户气泡（刚发的那句话）。" },
      { line: 3, text: "同时放一个空的 AI 气泡，准备接收流式文字。" },
      { line: 4, text: "输入框进入「发送中」禁用状态，防止连点。" },
    ],
  },
  ix_stream: {
    blurb: "后端通过 SSE 一段段推字，前端边收边画。",
    lines: [
      { line: 1, text: "streamChat 读到 data: {...} 行，解析出 delta 字段。" },
      { line: 2, text: "每来一小段就追加到 AI 气泡末尾，用户看到「打字机」效果。" },
      { line: 3, text: "第一包里可能带上 sources（引用来源），挂在消息下方。" },
    ],
  },
  ix_done: {
    blurb: "流结束，界面恢复可输入状态。",
    lines: [
      { line: 1, text: "收到 [DONE] 或流正常关闭，sending 设回 false。" },
      { line: 2, text: "输入框重新可编辑；完整回答已在后端落库。" },
      { line: 3, text: "若有引用，可点击「引自：…」跳转知识文档。" },
    ],
  },
  ix_run_script: {
    blurb: "开发者主动把课程/笔记灌进检索库。",
    lines: [
      { line: 1, text: "在项目根目录执行 python scripts/ingest.py。" },
      { line: 2, text: "大面积改文档或改切片逻辑后，建议加 --reset 全量重建。" },
      { line: 3, text: "脚本入口 main() 会调用 run_ingest()。" },
    ],
  },
  ix_auto_start: {
    blurb: "不用手动跑脚本时，后端自己检测知识有没有变。",
    lines: [
      { line: 1, text: ".env 里 AUTO_INGEST_ON_STARTUP=true（默认）时生效。" },
      { line: 2, text: "启动时比对 curriculum/、knowledge/ 指纹，有变就全量入库。" },
      { line: 3, text: "和手动脚本最终都汇入 run_ingest()。" },
    ],
  },
  ix_ready: {
    blurb: "入库完成后的「用户可感知」结果。",
    lines: [
      { line: 1, text: "向量库有条目，BM25 索引也建好。" },
      { line: 2, text: "之后在 Chat 提问，hybrid_retrieve 能搜到新课程内容。" },
      { line: 3, text: "不必重启前端；后端检索库已更新。" },
    ],
  },
  ix_open_lab: {
    blurb: "从顶栏进入概念实验室页面。",
    lines: [
      { line: 1, text: "路由切到 /lab，LabPage 挂载。" },
      { line: 2, text: "右侧富文本是各 Tab 共用的示例输入。" },
    ],
  },
  ix_switch_tab: {
    blurb: "用户切换 Tokenize / Attention / Embedding / RAG 等演示。",
    lines: [
      { line: 1, text: "LabPage 根据 tab state 渲染不同 Demo 组件。" },
      { line: 2, text: "示例文本不变，各演示按自己的规则截取/处理。" },
    ],
  },
  ix_rag_click: {
    blurb: "用户在 RAG Tab 点「执行切块」或「检索 Top 3」。",
    lines: [
      { line: 1, text: "RagDemo 读取右侧示例文本（可截断到性能上限）。" },
      { line: 2, text: "切块走 chunk_text_simple；检索走 lab_retrieve（简化版，非正式 Chat）。" },
    ],
  },
  ix_embed_click: {
    blurb: "用户在 Embedding Tab 点「生成 3D 向量空间」。",
    lines: [
      { line: 1, text: "把示例文本按行拆成多个词/短语。" },
      { line: 2, text: "请求后端算 embedding，PCA 降到 3 维后画点云。" },
    ],
  },
  ix_show_result: {
    blurb: "演示结果回到界面，方便肉眼观察。",
    lines: [
      { line: 1, text: "RAG：展示切块列表或 Top 命中片段。" },
      { line: 2, text: "Embedding：3D 散点图，语义相近的词靠得更近。" },
    ],
  },
  ix_load_app: {
    blurb: "用户第一次在浏览器打开本站。",
    lines: [
      { line: 1, text: "加载 Vite 打包的前端资源，React 挂载到 #root。" },
      { line: 2, text: "App 组件提供顶栏导航和 React Router 路由出口。" },
    ],
  },
  ix_nav_chat: {
    blurb: "用户点击顶栏「对话」或访问首页 /。",
    lines: [
      { line: 1, text: "路由渲染 ChatPage：侧栏 + 消息区 + 输入框。" },
      { line: 2, text: "useSession 在挂载时拉取会话列表。" },
    ],
  },
  ix_nav_guide: {
    blurb: "用户点击顶栏「源码导读」。",
    lines: [
      { line: 1, text: "路由渲染 GuidePage（就是当前页）。" },
      { line: 2, text: "左侧选流程，中间看图，右侧看讲解/源码。" },
    ],
  },
  ix_pick_session: {
    blurb: "用户在对话页侧栏点击某个历史会话。",
    lines: [
      { line: 1, text: "useSession 把 currentId 设为该会话。" },
      { line: 2, text: "请求 GET /sessions/{id} 拉取消息列表并渲染。" },
    ],
  },
  handleSend: {
    blurb: "这是聊天页面。你点「发送」后，主要逻辑在下面的 handleSend 里。",
    lines: [
      { line: 1, text: "这是整个聊天页组件的开头。" },
      { line: 2, endLine: 6, text: "先拿出：有哪些会话、当前聊到哪、消息列表，以及新建/切换会话的工具。" },
      { line: 7, text: "sending 表示「AI 正在回复中」。为 true 时输入框会禁用，防止连点。" },
      { line: 9, endLine: 13, text: "欢迎页上那几个可点的示例问题，点了就当用户发了这句话。" },
      { line: 15, text: "真正发消息从这里开始（handleSend）。" },
      { line: 16, endLine: 29, text: "如果还没有会话，就先新建一个；后端连不上就提示你先启动服务。" },
      { line: 30, endLine: 35, text: "标记「正在回复」→ 把你的话存进数据库 → 刷新侧栏 → 先放一个空的 AI 气泡等着填字。" },
      { line: 37, endLine: 57, text: "开始收 AI 的流式回答：来一个字就往气泡里加；结束或出错就恢复输入；有引用就挂在消息下面。" },
      { line: 60, endLine: 68, text: "页面长这样：左边会话列表，右边聊天内容。" },
    ],
  },
  streamChat: {
    blurb: "负责「一边下字一边显示」。后端像直播一样推文字过来，这里负责接住。",
    lines: [
      { line: 1, endLine: 8, text: "告诉它：哪个会话、问了什么，以及「来新字 / 结束 / 出错 / 有引用」时分别干什么。" },
      { line: 10, text: "向后端发起聊天请求（POST /chat）。" },
      { line: 11, endLine: 14, text: "请求失败就报错，后面不再读。" },
      { line: 15, endLine: 17, text: "打开数据流，准备把收到的字节变成文字；buffer 用来拼不完整的一行。" },
      { line: 18, endLine: 23, text: "不断读新数据，按换行拆开；最后半行先留着，等下次拼完整。" },
      { line: 25, endLine: 27, text: "约定：一行以 data: 开头才是内容；看到 [DONE] 表示说完了。" },
      { line: 29, endLine: 33, text: "解析 JSON：有新字就显示出来；有引用来源就告诉页面挂上。" },
      { line: 38, endLine: 40, text: "正常读完或中途异常，分别通知页面「结束」或「出错」。" },
    ],
  },
  add_msg: {
    blurb: "后端的一个小入口：收到「存一条消息」的请求，转交给真正写数据库的函数。",
    lines: [
      { line: 1, endLine: 2, text: "从网址里拿到会话编号，从请求体里拿到角色和内容，然后调用 add_message 存起来。" },
    ],
  },
  chat_route: {
    blurb: "聊天接口的大门：把 AI 的回答做成「一段段推送」发给浏览器。",
    lines: [
      { line: 1, text: "收到：哪个会话、用户问了什么。" },
      { line: 2, endLine: 5, text: "把后面 rag_chat 吐出的每一小段，包成浏览器能听懂的推送格式；最后发一个结束标记。" },
      { line: 7, endLine: 11, text: "告诉浏览器：这是「边下边看」的流，不要等全部说完再显示。" },
    ],
  },
  rag_chat: {
    blurb: "大脑中枢：先查知识库，再拼提示词，再问大模型，最后把完整回答存下来。",
    lines: [
      { line: 1, text: "输入：会话编号 + 你这一句问题。（目前不会自动带上更早的聊天记录。）" },
      { line: 2, endLine: 6, text: "说明：你的话前端已经存过了；这里只负责生成 AI 的话并保存。" },
      { line: 7, text: "去知识库里找出最相关的几段资料（默认 4 段）。" },
      { line: 8, text: "把这几段资料整理成一段「参考资料」文字。" },
      { line: 9, text: "打开提示词模板，把「资料」和「问题」填进去。" },
      { line: 11, endLine: 14, text: "准备发给大模型的两句话：一句是人设（system），一句是填好的提问（user）。" },
      { line: 15, endLine: 16, text: "连上大模型，并打开「流式」：让它一个字一个字往外吐。" },
      { line: 18, endLine: 21, text: "准备好「引用来源」列表；后面用来在回答下面显示出处。" },
      { line: 22, endLine: 29, text: "模型每吐出一点字，就立刻交给前端显示；引用信息通常跟着第一包一起发。" },
      { line: 30, text: "全部说完后，把完整回答（和引用）存进数据库。" },
    ],
  },
  hybrid_retrieve: {
    blurb: "查资料用两招：一招看「意思像不像」，一招看「关键词撞没撞上」，再合并结果。",
    lines: [
      { line: 1, text: "你问的话、要几条结果、两招各占多少比重。" },
      { line: 2, text: "先按「意思相近」在向量库里多搜一些候选。" },
      { line: 3, endLine: 4, text: "如果关键词索引还没准备好，就只用意思相近的结果。" },
      { line: 5, endLine: 11, text: "再按关键词打分，也取出一批候选。" },
      { line: 12, endLine: 13, text: "两路结果合在一起，只留下最靠前的几条返回。" },
    ],
  },
  load_prompt: {
    blurb: "去 prompts 文件夹读提示词。文件改过就会重新读，一般不用重启后端。",
    lines: [
      { line: 1, text: "要读哪个文件，比如 rag_user.txt。" },
      { line: 2, endLine: 4, text: "找到文件；没有就报错。" },
      { line: 5, endLine: 8, text: "如果文件没改过，直接用内存里上次读的内容（更快）。" },
      { line: 9, endLine: 11, text: "文件改过了：重新读一遍，存起来，再返回给调用方。" },
    ],
  },
  get_llm: {
    blurb: "真正打电话给大模型的地方（火山方舟等）。",
    lines: [
      { line: 1, endLine: 6, text: "把准备好的对话内容发给模型；stream=true 表示要它边想边往回传字。" },
    ],
  },
  add_message: {
    blurb: "把一条聊天记录写进本地数据库。如果是这个会话的第一句用户话，还会自动起个标题。",
    lines: [
      { line: 1, endLine: 5, text: "要存：哪个会话、谁说的（用户/AI）、说了什么；有时还有引用来源。" },
      { line: 7, endLine: 15, text: "如果是用户说的，且标题还是默认的「新对话」，就记下：等会儿用这句话当标题。" },
      { line: 17, endLine: 25, text: "把内容（和引用）插入 messages 表，得到这条消息的编号。" },
      { line: 26, endLine: 38, text: "需要的话更新会话标题，再把刚存好的消息信息返回给前端。" },
    ],
  },
  main: {
    blurb: "命令行入库的入口：你在终端跑 ingest 脚本时，从这里开始。",
    lines: [
      { line: 2, endLine: 7, text: "看你有没有加 --reset（清空重来）；然后开始入库，并打印结果。" },
    ],
  },
  run_ingest: {
    blurb: "把课程和笔记切碎、算成向量、放进检索库，这样聊天才能搜到它们。",
    lines: [
      { line: 1, endLine: 8, text: "如果要求重置，先把旧的检索库清空。" },
      { line: 9, endLine: 11, text: "把 curriculum、knowledge 目录里的文档都读进来并切成小段。" },
      { line: 12, text: "把这些小段变成向量，写进向量库。" },
      { line: 13, text: "同时建一份「关键词索引」，方便按字词搜索。" },
      { line: 14, endLine: 16, text: "记下这次入库的版本信息，返回「存了多少条」。" },
    ],
  },
  ingest_dir: {
    blurb: "处理某一个文件夹里的全部笔记/课程文件。",
    lines: [
      { line: 1, text: "告诉它：哪个文件夹，以及这些文件算「课程」还是「笔记」。" },
    ],
  },
  chunk_markdown: {
    blurb: "按文章小标题把长文档切开，每段带着「它属于哪一节」的信息。",
    lines: [
      { line: 1, endLine: 6, text: "准备按行读文章，并记住当前读到哪个标题下面。" },
      { line: 8, endLine: 18, text: "遇到该收尾时：把攒好的文字做成一段；太长就再切细一点。" },
      { line: 20, endLine: 25, text: "看到 # 标题就先把上一段收好，再换到新标题继续攒。" },
    ],
  },
  add_chunks: {
    blurb: "把切好的小段正式写进向量库。",
    lines: [{ line: 1, text: "入库流程写到库里的最后一站之一。" }],
  },
  build_bm25: {
    blurb: "用这些小段文字建「关键词检索表」，和向量检索配合使用。",
    lines: [{ line: 1, text: "聊天搜资料时，会用到这份表。" }],
  },
  auto_ingest: {
    blurb: "后端启动时：如果发现课程/笔记有改动，就自动再入库一遍。",
    lines: [{ line: 1, text: "和你手动跑脚本，最后往往都会走到 run_ingest。" }],
  },
  App: {
    blurb: "网站外壳：顶栏菜单、浅色/暗色，以及打开哪个页面。",
    lines: [{ line: 1, text: "整个前端从这里挂起来。" }],
  },
  useSession: {
    blurb: "帮聊天页记住：有哪些对话、当前在哪个、消息列表怎么更新。",
    lines: [{ line: 1, text: "ChatPage 靠它管理会话，不用自己到处写请求。" }],
  },
  ChatPage: {
    blurb: "聊天页本身：侧栏 + 消息 + 输入框。",
    lines: [{ line: 1, text: "发送细节见「一次对话」里的同名节点讲解。" }],
  },
  streamChat2: {
    blurb: "和「一次对话」里的 streamChat 是同一个函数：接收 AI 流式文字。",
    lines: [{ line: 1, text: "详细说明请看「一次对话 → streamChat」。" }],
  },
  GuidePage: {
    blurb: "你现在看的「源码导读」页面。",
    lines: [{ line: 1, text: "左边流程图，右边源码和说明。" }],
  },
  LabPage: {
    blurb: "概念实验室：用小实验理解 Token、注意力、向量、检索。",
    lines: [{ line: 1, text: "上面几个 Tab 切换不同实验。" }],
  },
  RagDemo: {
    blurb: "实验室里的检索小实验（不是正式聊天那条链路）。",
    lines: [{ line: 1, text: "用来观察「切块」和「搜到了什么」。" }],
  },
  EmbeddingDemo: {
    blurb: "把词变成点，放进 3D 空间：意思接近的词会靠得更近。",
    lines: [{ line: 1, text: "先算向量，再降到 3 维画出来。" }],
  },
  lab_retrieve: {
    blurb: "实验室用的简化搜索，方便你看命中了哪些片段。",
    lines: [{ line: 1, text: "正式聊天用的是更完整的 hybrid_retrieve。" }],
  },
  chunk_simple: {
    blurb: "按固定字数硬切文章，用来和「按标题切」对比。",
    lines: [{ line: 1, text: "实验室里的滑块可以改每段多长、重叠多少。" }],
  },
  rag_user: {
    blurb: "给模型看的「答题说明书」模板：里面会填入资料和你的问题。",
    lines: [{ line: 1, text: "改这个文件，就能改 AI 怎么答；保存后下次对话生效。" }],
  },
  rag_system: {
    blurb: "给模型的简短人设：它是谁、答题时要注意什么。",
    lines: [{ line: 1, text: "和 rag_user 一起被读进程序。" }],
  },
  load: {
    blurb: "读取提示词文件（和「一次对话」里的 _load_prompt 相同）。",
    lines: [{ line: 1, text: "详细说明见「一次对话 → _load_prompt」。" }],
  },
  rag_chat2: {
    blurb: "把提示词交给大模型生成回答（同 rag_chat）。",
    lines: [{ line: 1, text: "详细说明见「一次对话 → rag_chat」。" }],
  },
};

export function explainsFor(nodeId: string): { blurb: string; lines: LineExplain[] } {
  return (
    NODE_EXPLAIN[nodeId] ?? {
      blurb: "点这个方块可以看说明；代码方块还可对照右侧源码。",
      lines: [],
    }
  );
}

# AI-Brain Chat 设计文档

> 状态：已对齐，待实现规划
> 日期：2026-07-06
> 范围：v1（问答 + 概念交互演示）

---

## 1. 项目定位

把个人 AI 学习笔记（AI-Brain 仓库）做成一个可分享的 **AI native chat 简历作品**。主题：和 LLM 课程对话 + 可交互的概念演示。

目标受众：面试官 / 同行（看 3-5 分钟判断项目质量）。

核心评价标准：
- 第一眼观感像认真打磨过的产品，不是"一堆 md 堆在 GitHub"
- 技术选型、架构、亮点显性化
- 有超出常规的可交互、AI 能力部分

---

## 2. 版本规划

### v1（先做，知识已具备）

课程 RAG 问答 + 概念交互演示。

- 课程知识库可对话问答
- tokenize / embedding / attention 三个概念交互演示组件
- 会话历史后端持久化

### v2（学完 Agent 后叠加，不在本 spec 范围）

Agent 学习陪伴：路径规划、出题、批改、进度追踪。

明确留 v2 的事项：
- Agent 学习陪伴
- query 改写（多轮指代解析）
- 会话重命名 / 删除
- 文件监听自动入库
- 重排模型
- 用户登录体系
- 自定义域名

---

## 3. 产品形态

**chat 为主，演示为辅。**

- 主界面是对话
- 侧边栏 / 顶部入口进入"概念实验室"做交互演示
- 不做工作台式联动（chat 提到 token 自动弹出演示），该形态留 v2

---

## 4. 视觉与前端

### 体验目标（锁定）

- 游戏感交互反馈：即时响应、微动效、状态奖励
- 视觉层次：发光、深度感，非扁平
- 每次操作引发可见状态变化

### 技术实现

**前端 vibe coding，不预设技术栈。** 具体库、组件组织、着色器写不写，实现时让 AI 现场判断。

### 各模块深度（锁定）

| 模块 | 深度 | 要求 |
|------|------|------|
| Chat | 流畅动效 | 消息进出场、流式输出反馈 |
| Tokenize | 深度交互 | 输入即切分、悬停看 ID、重复 token 高亮、中英差异对比、token 费用估算 |
| Attention | 中等 | 2D 热力图、悬停高亮、点击锁定 token 看关联、可切 head |
| Embedding | 极致打磨 | 3D 向量空间散点云、可旋转缩放、v1 压轴模块 |

---

## 5. 技术架构

```
┌─────────────────────────────────────────────────┐
│  前端（Vibe coding）                             │
│  - Chat 界面                                     │
│  - 概念交互演示（tokenize/embedding/attention）   │
│  - 会话列表侧栏                                  │
└──────────────┬──────────────────────────────────┘
               │ HTTP/REST
┌──────────────▼──────────────────────────────────┐
│  FastAPI 后端                                    │
│  - /chat        RAG 问答接口（流式）              │
│  - /tokenize    复用 examples/lesson01            │
│  - /embed       复用 examples/lesson02-03         │
│  - /attention   复用 examples/lesson04            │
│  - /sessions    会话管理（创建/追加/拉历史）       │
│  - /ingest      手动触发知识入库                  │
└──────┬───────────────┬──────────────────────────┘
       │               │
┌──────▼─────┐   ┌─────▼──────────────────────┐
│ Chroma 嵌入式│   │ LLM 调用层                  │
│ (向量库)     │   │ LLMClient 抽象              │
│ + 元数据     │   ├──────────────────────────┤
└────────────┘   │ 主力: DeepSeek-V3          │
                 │ 备选: 智谱 GLM-4           │
┌────────────┐   │ Embedding: bge-base-zh 本地│
│ SQLite     │   └──────────────────────────────┘
│ (会话历史)  │
└────────────┘
```

### 后端技术选型

- **FastAPI**：Python，和 `examples/` 同语言，可复用现有逻辑；自带 OpenAPI 文档
- **Chroma 嵌入式**：向量库，零额外服务
- **SQLite**：会话历史，单文件零运维

### 前端技术选型

vibe coding，不锁。实现时按体验目标选库。

---

## 6. RAG 设计

### 知识源

- `curriculum/`：课程文档（现有 6 篇 + 后续课程）
- `knowledge/`：每日补充的知识（由 Cursor skill 规范化生成）
- 两类都进同一个向量库，元数据 `source_type` 区分（`curriculum` / `note`）

### 入库流程

```
零散笔记 → [Cursor skill 规范化] → 结构化 md（knowledge/）
         → 手动跑 ingest.py → 切片 → embedding → 入 Chroma
```

- 触发方式：
  - 本地：`python scripts/ingest.py`（命令行）
  - 线上：`POST /ingest`（API，因为线上环境无法 SSH 跑命令）
  - 两者共用同一套核心入库逻辑（切片 + embedding + 写 Chroma）
- 脚本只处理新增 / 变更（基于文件 hash 或 mtime）
- 设计上预留 v2 接文件监听的钩子（核心逻辑不改，只换触发方式）

### 切片策略

按 markdown 结构切 + 长度兜底：

1. 优先按 `##` / `###` 标题切
2. 若某节超过阈值（约 800 token），按段落二次切
3. 每片带元数据：`{source_type, lesson, section, heading_path, created_at}`

### 检索策略

向量 + BM25 混合检索：

- 向量检索：query 算 embedding → 余弦相似度 → top-k
- BM25：关键词命中
- 两路结果加权融合，top-k = 3-5（可调）
- 重排留 v2

### 向量库

Chroma 嵌入式。持久化策略：启动时检查，无数据则从 `curriculum/` + `knowledge/` 重建（数据量小，重建快）。

---

## 7. 会话与数据管理

| 维度 | 决策 |
|------|------|
| 对话历史 | 后端 SQLite |
| Schema | `sessions(id, title, created_at)` + `messages(id, session_id, role, content, created_at)` |
| 用户体系 | v1 不做登录，浏览器生成匿名 session ID 存 localStorage |
| API | 创建会话、追加消息、拉取历史（3 个） |
| 前端范围 | 当前对话 + 会话列表侧栏（切换/回看，不做编辑/删除） |
| 多轮对话 | v1 不做 query 改写，只看当前问题 |

---

## 8. LLM 与 Prompt

### LLM

- 主力：**DeepSeek-V3**（便宜、中文好、API 兼容 OpenAI 格式）
- 备选：**智谱 GLM-4**（DeepSeek 排队 / 效果不好时切换）
- 调用层：抽象 `LLMClient`，配置指定 provider，可切换不改业务代码

### Embedding

- **BAAI/bge-base-zh 本地跑**（适配免费层内存，中文效果够用）
- 后端启动时加载一次

### Prompt 结构

```
你是一个 AI 学习助手，根据以下课程资料回答用户问题。

【资料】
[资料1 - 课程第6课"为什么需要RAG"]
{chunk_content}
[资料2 - 笔记："标题"]
{chunk_content}

【规则】
1. 只根据【资料】回答，不要编造资料里没有的内容
2. 如果资料不足以回答，明确说"现有资料中没有这个内容"
3. 回答时引用资料来源，格式：[引自：课程第X节 / 笔记：标题]
4. 用中文回答，语言清晰，适合学习者理解

【用户问题】
{query}
```

- 回答风格：讲解式，适合学习者
- top-k = 3-5

---

## 9. 部署

| 维度 | 决策 |
|------|------|
| 前端 | Vercel，免费子域名 |
| 后端 | Railway（或 Render），免费层 |
| 域名 | 平台免费子域名 |
| 密钥 | 后端环境变量，前端不碰 |
| Chroma 持久化 | 启动时检查并按需重建 |
| 环境差异 | 本地 localhost，线上分离部署 + CORS 配置 |

---

## 10. Cursor Skill

### 职责

把零散笔记整理成符合知识库规范的结构化文档。

### 输入

用户的零散笔记（一段话、几个要点、粘贴的内容）。

### 输出

结构化 md 到 `knowledge/` 目录，符合模板：
- 必有标题
- 必有概述
- 分节用 `##`
- 代码块带语言标签
- 元数据：来源、日期、标签、所属主题

### 边界

- **做**：规范化零散笔记为结构化文档
- **不做**：切片 / embedding / 入库（后端 RAG pipeline 职责）、检索问答、知识去重合并

---

## 11. 后端 API 总览

| 接口 | 方法 | 用途 | 复用 |
|------|------|------|------|
| `/chat` | POST | RAG 问答（流式） | — |
| `/tokenize` | POST | 返回 token 列表 + ID + 数量 | `examples/lesson01_tokenize.py` |
| `/embed` | POST | 返回 embedding / 相似度 | `examples/lesson02-03` |
| `/attention` | POST | 返回注意力权重 | `examples/lesson04_attention.py` |
| `/sessions` | POST | 创建会话 | — |
| `/sessions/{id}/messages` | POST | 追加消息 | — |
| `/sessions/{id}` | GET | 拉取会话历史 | — |
| `/ingest` | POST | 手动触发知识入库 | — |

---

## 12. 关键复用关系

| 现有文件 | 复用为 | 复用方式 |
|---------|--------|---------|
| `examples/lesson01_tokenize.py` | `/tokenize` 接口 | 提取核心逻辑为可调用函数 |
| `examples/lesson02_embedding.py` + `lesson03_embedding_vector.py` | `/embed` 接口 | 合并核心逻辑 |
| `examples/lesson04_attention.py` | `/attention` 接口 | 提取核心逻辑 |
| `curriculum/*.md` | 知识库内容 | 直接作为知识源切片入库 |

---

## 13. 不在本 spec 范围

- v2 的 Agent 学习陪伴
- query 改写 / 多轮指代解析
- 会话编辑 / 删除
- 自动入库（文件监听）
- 重排模型
- 用户登录体系
- 自定义域名
- 交互演示组件的具体实现细节（vibe coding 时定）
- 错误处理与降级的具体策略（实现时定）
- prompt 调参（实现时迭代）

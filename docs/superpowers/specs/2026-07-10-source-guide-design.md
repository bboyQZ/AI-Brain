# 源码导读（图文 + 前端）设计文档

> 状态：第一步已落地；第二步章节正文已写满  
> 日期：2026-07-10  
> 范围：顶栏「源码导读」+ 实验室 Architecture Tab + `docs/guide` 图文（六章齐全）

---

## 1. 目标

让学习者在**网站内**看懂本仓库代码如何串起来：

- 有**调用路线图**（方框 + 箭头）
- 有**白话讲解**与对应文件名
- 顶栏完整版 + 实验室简版（入口 C）
- 讲解文稿可维护（Markdown + Mermaid），不只是散落的 README

## 2. 非目标（第一步）

- 不改 RAG / 聊天业务逻辑  
- 不做可编辑提示词的后台  
- 不把导读混进 `knowledge/` 知识库检索语料（避免污染问答）  
- 第一步不写满所有章节正文（目录可占位）

## 3. 信息架构

### 3.1 顶栏「源码导读」`/guide`

- 左：章节目录  
- 右：当前章 Markdown 渲染（含 Mermaid 图）  
- 章节（整站覆盖，分步写满）：

| id | 标题 | 状态 |
|----|------|------|
| overview | 总览 | 完整 |
| chat-rag | 一次对话（RAG） | 完整 |
| ingest | 知识入库 | 完整 |
| frontend | 前端与主题 | 完整 |
| lab | 概念实验室 | 完整 |
| prompts | 提示词与配置 | 完整 |

### 3.2 实验室 Tab `Architecture`

- 一张总览 Mermaid  
- 短说明  
- CTA：跳转 `/guide`（可带 `?chapter=overview`）

### 3.3 文稿位置

- `docs/guide/*.md` — 导读正文（图文）  
- 现有 `app/README.md` 等 — 保留为简介，并链到对应 `docs/guide` 章  
- 根 `README.md` 学习地图指向 `/guide`（本地跑前端时）与 `docs/guide`

## 4. 技术方案

**选定：方案 1 — Markdown + Mermaid 前端渲染**

- 新增页面 `GuidePage`，路由 `/guide`  
- 顶栏 NavLink「源码导读」  
- `LabPage` 增加 `architecture` Tab  
- 依赖：在现有 markdown 能力上增加 Mermaid（如 `mermaid` + 在渲染流程中识别 ` ```mermaid ` 代码块）  
- 文稿打包：Vite 侧 `import.meta.glob` 加载 `docs/guide/*.md`，或复制到 `frontend/public/guide/` 运行时 fetch；优先 **glob 从仓库 `docs/guide` 引入**（开发体验好）。若路径不便，则 `frontend/src/guide/content/*.md` 与 `docs/guide` 同步——**单一真相：只维护 `docs/guide`，构建时由 Vite 别名指向仓库根 `docs/guide`**。

浅色/暗色：Mermaid 主题随 `data-theme` 切换，或使用中性配色保证双主题可读。

## 5. 第一步验收

1. 顶栏可进「源码导读」，三章（总览 / 一次对话 / 入库）有路线图 + 讲解 + 文件名  
2. 实验室 Architecture 有总览图并可跳转完整导读  
3. 浅/暗主题下图表与文字可读  
4. 对话、入库、实验室原有功能不受影响  

## 6. 第二步（已完成）

已写满 frontend / lab / prompts 三章图文；目录不再显示「待补全」。

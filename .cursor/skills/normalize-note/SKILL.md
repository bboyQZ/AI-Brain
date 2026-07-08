---
name: normalize-note
description: 把零散笔记整理成符合知识库规范的结构化 markdown，输出到 knowledge/ 目录供 RAG 入库。Use when the user provides loose notes, pastes content to save, asks to "记笔记" / "整理笔记" / "归档知识", or wants to add new knowledge to the AI-Brain project.
---

# 规范化笔记

把用户提供的零散笔记整理成结构化 markdown，输出到 `knowledge/` 目录。

## 输入

用户的零散笔记：一段话、几个要点、或粘贴的内容。可能附带来源（文章、视频、课程等）。

## 输出

文件路径：`knowledge/YYYY-MM-DD-主题.md`（日期取当天，主题用简短中文/英文关键词）。

使用以下模板（保留 `>` 元数据块和 `##` 分节结构，RAG 切片器依赖这些）：

```markdown
# [标题]

> 来源：[来源标注，如"课程笔记"、"文章 XXX"、"个人总结"]
> 日期：YYYY-MM-DD
> 标签：[标签1, 标签2]
> 主题：[所属主题，如"Transformer"、"RAG"]

## 概述

[2-3 句话概括本笔记核心内容]

## [第一节标题]

[内容]

## [第二节标题]

[内容]
```

## 规则

1. 必有标题、概述、元数据块（来源/日期/标签/主题）
2. 分节用 `##`，每节有清晰标题（切片器按 `##`/`###` 切片）
3. 代码块带语言标签
4. 语言中文，清晰简洁，适合学习者理解
5. 文件名格式：`YYYY-MM-DD-主题.md`，主题用短词（如 `2026-07-08-rag-检索.md`）
6. **不做**切片/embedding/入库（那是后端 `scripts/ingest.py` 的职责）
7. 输出后提示用户运行入库命令：

```powershell
python "D:\develop\AI-Brain\scripts\ingest.py"
```

## 示例

**用户输入：** "记一下：RAG 的检索阶段可以用向量检索 + BM25 混合，效果比纯向量好。来自今天的课程。"

**输出文件：** `knowledge/2026-07-08-rag-混合检索.md`

```markdown
# RAG 混合检索

> 来源：课程笔记
> 日期：2026-07-08
> 标签：[RAG, 检索, BM25]
> 主题：RAG

## 概述

RAG 的检索阶段采用向量检索与 BM25 混合策略，效果优于纯向量检索。

## 混合检索原理

向量检索捕捉语义相似性，BM25 捕捉关键词匹配，两者互补。通过加权融合（如 alpha=0.5）合并两路结果，取 top-k。
```

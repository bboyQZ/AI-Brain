---
name: normalize-note
description: 把零散笔记整理成 knowledge/ 下的结构化 markdown。完整入库（课程编号、实验室、自测）请用 add-knowledge skill。Use when the user only wants note formatting without lesson numbering or lab sync.
---

# 规范化笔记

把用户提供的零散笔记整理成结构化 markdown，输出到 `knowledge/` 目录。

> **完整流程**（正确落点 + 实验室 + RAG 入库 + **自测**）：请用 **`add-knowledge`** skill，而非仅本 skill。

## 输入

用户的零散笔记：一段话、几个要点、或粘贴的内容。可能附带来源。

## 输出

文件路径：`knowledge/YYYY-MM-DD-主题.md`

```markdown
# [标题]

> 来源：[来源标注]
> 日期：YYYY-MM-DD
> 标签：[标签1, 标签2]
> 主题：[所属主题]

## 概述

[2-3 句话概括]

## [第一节标题]

[内容]
```

## 规则

1. 必有标题、概述、元数据块
2. 分节用 `##`，每节有清晰标题
3. 代码块带语言标签；语言中文
4. 文件名：`YYYY-MM-DD-主题.md`
5. **不要**写到 `curriculum/` 或 `docs/guide/`（正式课与源码导读另有入口）

## 完成后

**必须**立即入库（Agent 亲自执行）：

```powershell
Set-Location "D:\develop\AI-Brain"
python ".\scripts\ingest.py" --reset
```

并做最低自测：确认文件存在、ingest 成功且条数增长。完整流程（含课程编号、实验室、Chat 抽检）请用 **add-knowledge**。

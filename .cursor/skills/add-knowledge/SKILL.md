---
name: add-knowledge
description: 将用户提供的知识写入 AI-Brain：整理为课程或笔记、同步概念实验室（如适用）、执行 RAG 入库并验证。Use when the user invokes add-knowledge, says「添加知识」「新课同步」「并入实验室」, or pastes knowledge content after naming this skill.
---

# 添加知识（add-knowledge）

用户在本 skill 之后附上知识正文。你的任务：**落盘 → 实验室（如适用）→ 立即 RAG 入库 → 验证 → 汇报**。

## 输入

- skill 调用后的全部正文 = 待入库知识
- 若未说明类型：有「第 N 课 / Lesson」→ 课程；否则 → 笔记

## 输出路径

| 类型 | 路径 | 命名 |
|------|------|------|
| 正式课程 | `curriculum/lesson-NN-主题.md` | NN = README 下一课次 |
| 零散笔记 | `knowledge/YYYY-MM-DD-主题.md` | 当天日期 |

课程文档：`## 本课目标`、`## 本课总结`、可选 `examples/lessonNN_*.py`。

笔记元数据块：

```markdown
# 标题

> 来源：…
> 日期：YYYY-MM-DD
> 标签：[…]
> 主题：…

## 概述
…
```

## 执行步骤

```
- [ ] 1. 写入 markdown
- [ ] 2. 更新 README.md 课程目录（课程时）
- [ ] 3. 实验室：判定并实施
- [ ] 4. 可选：examples/lessonNN_*.py
- [ ] 5. **立即入库**（不可跳过）
- [ ] 6. 验证 RAG + 实验室
- [ ] 7. 汇报
```

### 步骤 5：立即入库（必须执行）

落盘完成后**立刻**运行（Agent 必须亲自执行，不可只提示用户）：

```powershell
Set-Location "D:\develop\AI-Brain"
python ".\scripts\ingest.py" --reset
```

说明：

- 后端启动时也会通过 `auto_ingest_if_needed()` 自动检测 `curriculum/`、`knowledge/` 变更并入库
- Agent 落盘后仍须**当次**执行 ingest，确保无需重启即可在 Chat 检索到新内容

### 步骤 6：验证

- 脚本输出 `向量库现有 N 条`
- Chat 用 1 个能从正文回答的问题试检索
- 实验室 Tab 无报错

## 实验室同步判定

| 主题 | 动作 |
|------|------|
| Token / Embedding / Attention | 扩展现有 Demo |
| RAG / Chunk / Retriever | 缺则新增 `RagDemo.tsx` + 注册 `LabPage.tsx` |
| 纯背景说明 | 仅 RAG |

## 完成汇报模板

```markdown
## 已同步

- 文档：…
- 入库：已执行 ingest --reset，共 N 条
- 实验室：…

## 验证

Chat 可问：「…」
```

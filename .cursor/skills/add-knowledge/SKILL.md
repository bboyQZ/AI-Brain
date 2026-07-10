---
name: add-knowledge
description: 将用户提供的知识写入 AI-Brain：整理为课程或笔记、同步到项目正确落点、同步概念实验室（如适用）、执行 RAG 入库并自测检查。Use when the user invokes add-knowledge, says「添加知识」「新课同步」「并入实验室」「新课程」「新知识入库」, or pastes knowledge content after naming this skill.
---

# 添加知识（add-knowledge）

用户在本 skill 之后附上知识正文。你的任务：**落到正确位置 → 实验室（如适用）→ 立即 RAG 入库 → 自测检查通过 → 汇报**。

**硬规则：**

1. 落盘后必须亲自跑入库与自测，不可只提示用户「请自行 ingest」。
2. 自测未通过不得宣称完成。
3. Windows PowerShell：用 `Set-Location` / 绝对路径，禁止 `cd /d ... &&`。

## 输入

- skill 调用后的全部正文 = 待入库知识
- 若未说明类型：有「第 N 课 / Lesson」→ 课程；否则 → 笔记
- 若类型仍不确定：先问一句再落盘

## 项目落点地图（必须放到该放的地方）

| 内容 | 路径 | 何时 |
|------|------|------|
| 正式课程 | `curriculum/lesson-NN-主题.md` | 成体系的一课 |
| 零散笔记 | `knowledge/YYYY-MM-DD-主题.md` | 碎片、摘录、日记式 |
| 课程目录 | 根目录 `README.md`「课程目录」表 | **每新增一课必改** |
| 可运行示例 | `examples/lessonNN_*.py` | 课内有值得跑的代码时 |
| 概念实验室 | `frontend/src/components/lab/*` + `LabPage.tsx` 注册 Tab | 主题可交互演示时 |
| RAG 向量库 | 跑 `scripts/ingest.py --reset` | **每次落盘后必做** |

**不要**把课程/笔记写进：`docs/guide/`（源码导读）、`prompts/`、前端硬编码长文。

课次号 `NN`：看 `README.md` 已有最大课次 + 1（当前若到 07，下一课为 `08`）。

### 课程文档骨架

```markdown
# Lesson N：标题

## 本课目标
…

## 核心概念
…

## 本课总结
…
```

### 笔记元数据骨架

```markdown
# 标题

> 来源：…
> 日期：YYYY-MM-DD
> 标签：[…]
> 主题：…

## 概述
…
```

## 执行清单

```
- [ ] 1. 判定类型（课程 / 笔记）
- [ ] 2. 写入对应 markdown（路径符合上表）
- [ ] 3. 课程：更新 README.md 课程目录
- [ ] 4. 实验室：按判定表实施或明确跳过
- [ ] 5. 可选：examples/lessonNN_*.py
- [ ] 6. 立即入库（不可跳过）
- [ ] 7. 自测检查（不可跳过）
- [ ] 8. 按模板汇报
```

### 步骤 4：实验室同步判定

| 主题 | 动作 |
|------|------|
| Token / Embedding / Attention | 扩展现有 Demo（`TokenizeDemo` / `EmbeddingDemo` / `AttentionDemo`） |
| RAG / Chunk / Retriever | 扩展 `RagDemo.tsx`；缺 Tab 则在 `LabPage.tsx` 注册 |
| 纯背景说明、无交互价值 | 仅 RAG，汇报写明「实验室：跳过」 |

### 步骤 6：立即入库

```powershell
Set-Location "D:\develop\AI-Brain"
python ".\scripts\ingest.py" --reset
```

- 后端启动时也会 `auto_ingest_if_needed()`，但 Agent **当次仍须**执行，保证不用重启就能检索到
- 成功标志：输出含类似 `向量库现有 N 条`（N 应大于入库前）

### 步骤 7：自测检查（全部做完再汇报）

至少完成下列检查，失败则修复后重跑：

1. **文件存在**：确认新 md 路径正确；课程时确认 `README.md` 已有对应行。
2. **入库成功**：ingest 退出码 0，且条数合理增长。
3. **知识库 API（后端已启动时）**：

```powershell
# 列表里应能看到新文档 id/标题相关项
Invoke-RestMethod -Uri "http://127.0.0.1:8000/knowledge/docs"
```

4. **检索抽检**：用正文里一个独特短语/概念，走 Chat 或检索相关接口，确认能命中新内容（至少提出 1 个「验证时可问」的问题，并在后端可用时实际试一次）。
5. **实验室**：若改了 Demo / Tab，确认前端无报错、Tab 能打开。

后端未启动时：步骤 3～4 在汇报里写明「后端未启动，已完成文件+ingest；请启动后用下列问题验证」，并给出可复制的验证问句——**不可省略 ingest**。

## 完成汇报模板

```markdown
## 已同步

- 类型：课程 / 笔记
- 文档：`路径`
- README：已更新 / 不适用
- 实验室：… / 跳过（原因）
- 入库：已执行 `ingest.py --reset`，共 N 条

## 自测

- [x] 文件与目录
- [x] ingest
- [x] 知识库列表 / 检索（或注明后端未启）
- [x] 实验室（或跳过）

Chat 可问：「…」
```

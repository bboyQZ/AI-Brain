# Guide 视口 + A+C 源码面板 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `/guide` 默认 fitView 看整图；右侧源码仅上下滚动，注释在代码段上方，顶部固定当前说明（A+C）。

**Architecture:** 改 `GuidePage` 视口策略；重写 `AnnotatedCode` 为「顶栏 + 段上注释 + 换行代码」；CSS 去掉 brace 列与横滚。

**Tech Stack:** React、`@xyflow/react`、现有 `GuidePage.css`

**Spec:** `docs/superpowers/specs/2026-07-10-guide-code-panel-viewport-design.md`

---

### Task 1: AnnotatedCode 改为 A+C

**Files:**
- Modify: `frontend/src/guide/AnnotatedCode.tsx`
- Modify: `frontend/src/pages/GuidePage.css`（annotated-* 段）

- [ ] **Step 1: 重写 AnnotatedCode**

保留 `buildBlocks`。渲染结构：

1. 顶部固定 `.annotated-focus`（C）：显示 `activeText`；无讲解时 muted 占位。
2. 滚动区 `.annotated-code-scroll`：`overflow-x: hidden; overflow-y: auto`。
3. 对每个 `group`：先渲染上方 `.annotated-note-card`（A），再渲染该组行（仅 lineno + src，无 brace 列）。
4. `plain` 行同理两列。
5. 代码 `white-space: pre-wrap; word-break: break-word`。
6. 切换 `code`/`explains` 时重置 `activeKey` 为第一段（`useEffect`）。

- [ ] **Step 2: 更新 CSS**

- 删除 `.annotated-brace-cell`、`.brace-*`、底部 focus 依赖横滚的布局。
- `.annotated-focus` 放在滚动区之上，`flex-shrink: 0`。
- 新增 `.annotated-note-card`（段上白话）。
- `.annotated-src` 改为 `pre-wrap` + `word-break: break-word`；表格 `table-layout: fixed; width: 100%`。

- [ ] **Step 3: 浏览器手测**

打开 `/guide`，点 `chat()`：无左右滚动条；注释在代码上方；顶栏随点击切换。

---

### Task 2: 默认 fitView 看整体

**Files:**
- Modify: `frontend/src/pages/GuidePage.tsx`

- [ ] **Step 1: 视口行为**

- `useReactFlow` 使用 `fitView`（可保留 `getNode`/`setCenter` 仅给 jump）。
- 切换 `flowId` 后 `setTimeout` → `fitView({ padding: 0.15, duration: 200 })`。
- `onNodeClick`：只 `onSelect`，**不** `focusNode(..., 1)`。
- `onJump`：可选 `fitView` 后短暂 `setCenter` 到目标，或仅 `onSelect` + `setCenter` 不强制 zoom=1；推荐 jump 时 `setCenter` 且 zoom 取当前 zoom（`getZoom()`）以免打断比例。更简单：jump 时 `setCenter` + `zoom: getZoom()`。
- ReactFlow：`fitView` 初始属性可保留；`minZoom={0.25}`；去掉进页 `focusNode(firstId, 1)`。
- 更新侧栏 hint：可拖拽/缩放，默认看整体。

- [ ] **Step 2: 手测**

进 `/guide` 应看到整图概览；点方块右侧出源码且画布不突然拉到 zoom=1。

---

### Task 3: 验收对照 spec §4

- [ ] 默认概览、无横滚、段上注释、顶栏同步、暗色可读。

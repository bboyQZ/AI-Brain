# Light Sky-Blue Theme Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 整站默认浅色（侧栏天空蓝 + 主区白底天蓝强调），支持切换深蓝夜空暗色并持久化。

**Architecture:** 在 `index.css` 用 `:root` / `[data-theme="dark"]` 双套语义 CSS 变量；`App.tsx` 读写 `localStorage`（`ai-brain-theme`）并设置 `document.documentElement.dataset.theme`；各组件 CSS 去掉紫/黑硬编码，改用变量；`EmbeddingDemo` / `AttentionDemo` 画布色随主题更新。

**Tech Stack:** React + Vite、纯 CSS 变量、localStorage、Three.js（仅背景色）

**Spec:** `docs/superpowers/specs/2026-07-10-light-theme-sky-blue-design.md`

---

## File map

| File | Responsibility |
|------|----------------|
| `frontend/src/index.css` | 浅/暗 token、顶栏、主题按钮样式 |
| `frontend/src/App.tsx` | 主题状态、切换、启动时应用 |
| `frontend/src/components/chat/SessionSidebar.css` | 侧栏用 `--sidebar-*` |
| `frontend/src/components/chat/MessageList.css` | 气泡/芯片/引用去紫黑硬编码 |
| `frontend/src/components/chat/MessageInput.css` | 输入壳浅色友好 |
| `frontend/src/pages/KnowledgePage.css` | 知识库页变量化 |
| `frontend/src/components/lab/*.css` | 实验室面板变量化 |
| `frontend/src/components/lab/EmbeddingDemo.tsx` | Three.js 背景随主题 |
| `frontend/src/components/lab/AttentionDemo.tsx` | canvas 强调色改天蓝/读 CSS |

---

### Task 1: 全局 Token + 主题切换

**Files:**
- Modify: `frontend/src/index.css`
- Modify: `frontend/src/App.tsx`

- [ ] **Step 1: 重写 `index.css` 变量与顶栏**

`:root` 为浅色默认；`[data-theme="dark"]` 为深蓝夜空。新增至少：`--sidebar-bg`、`--sidebar-border`、`--accent-soft`、`--accent-border`、`--accent-strong`、`--surface`、`--surface-hover`、`--input-shell-bg`、`--input-card-bg`、`--input-shadow`、`--badge-fg`、`--danger`、`--danger-bg`。品牌文字改为实色 `var(--accent)`（去掉紫渐变）。`.nav-link` hover/active 用 `--surface-hover` / `--accent-soft`。增加 `.theme-toggle` 样式。

- [ ] **Step 2: 在 `App.tsx` 接入主题**

```tsx
type Theme = "light" | "dark";
const THEME_KEY = "ai-brain-theme";

function readTheme(): Theme {
  try {
    const v = localStorage.getItem(THEME_KEY);
    return v === "dark" ? "dark" : "light";
  } catch {
    return "light";
  }
}

function applyTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme;
  document.documentElement.style.colorScheme = theme;
}
```

启动 `useState(readTheme)` + `useEffect` 调用 `applyTheme`；顶栏右侧按钮切换并 `localStorage.setItem`。`aria-label` 为「切换为暗色」/「切换为浅色」。

- [ ] **Step 3: 浏览器目测**

Run: `Set-Location "D:\develop\AI-Brain\frontend"; npm run dev`  
Expected: 默认白底；点切换变深蓝；刷新保持。

- [ ] **Step 4: Commit**

```bash
git add frontend/src/index.css frontend/src/App.tsx
git commit -m "feat: add light/dark sky theme tokens and toggle"
```

---

### Task 2: 对话页 CSS

**Files:**
- Modify: `frontend/src/components/chat/SessionSidebar.css`
- Modify: `frontend/src/components/chat/MessageList.css`
- Modify: `frontend/src/components/chat/MessageInput.css`

- [ ] **Step 1: SessionSidebar** — `background: var(--sidebar-bg)`；`border-right: 1px solid var(--sidebar-border)`；hover/active/new-btn 用 `--surface-hover` / `--accent-soft` / `--accent-border`；删除按钮用 `--danger` / `--danger-bg`。

- [ ] **Step 2: MessageList** — 所有 `rgba(124,108,255,*)` / 白半透明硬编码改为 `--accent-*` / `--surface*`；用户气泡用 `--user-bubble` + `--accent-border`；badge 文字用 `--badge-fg`。

- [ ] **Step 3: MessageInput** — shell 渐变用 `--input-shell-bg`（浅色近透明白，暗色近 `--bg`）；卡片用 `--input-card-bg`、`--border`、`--input-shadow`；send hover 用 `--accent-strong`。

- [ ] **Step 4: 目测对话页浅/暗** — 侧栏淡蓝、主区白、气泡天蓝。

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/chat/*.css
git commit -m "feat: restyle chat surfaces for sky light/dark theme"
```

---

### Task 3: 知识库 + 实验室

**Files:**
- Modify: `frontend/src/pages/KnowledgePage.css`
- Modify: `frontend/src/components/lab/TokenizeDemo.css`
- Modify: `frontend/src/components/lab/EmbeddingDemo.css`
- Modify: `frontend/src/components/lab/AttentionDemo.css`（若有紫硬编码）
- Modify: `frontend/src/components/lab/RagDemo.css`（保留语义橙/绿状态色即可）
- Modify: `frontend/src/components/lab/EmbeddingDemo.tsx`
- Modify: `frontend/src/components/lab/AttentionDemo.tsx`

- [ ] **Step 1: KnowledgePage.css** — 同对话页，紫/白半透明 → 语义变量。

- [ ] **Step 2: Lab CSS** — 面板/chip 用 `--bg-input`、`--accent-soft` 等。

- [ ] **Step 3: EmbeddingDemo** — 读 `getComputedStyle(document.documentElement).getPropertyValue('--bg')` 设 `scene.background`；监听 `data-theme`（`MutationObserver` 或自定义事件）更新。标签文字色用 `--text`。

- [ ] **Step 4: AttentionDemo** — `#7c6cff` → `#0ea5e9`（或读 `--accent`）；dim 用 `--text-dim` 对应色。

- [ ] **Step 5: 目测三页无大块旧紫黑残留。**

- [ ] **Step 6: Commit**

```bash
git add frontend/src/pages/KnowledgePage.css frontend/src/components/lab/
git commit -m "feat: apply sky theme to knowledge and lab pages"
```

---

### Task 4: 验收

- [ ] **Step 1:** 无 localStorage 时默认浅色  
- [ ] **Step 2:** 切换暗色为深蓝夜空 + 天蓝强调  
- [ ] **Step 3:** 刷新保持  
- [ ] **Step 4:** `/` `/lab` `/knowledge` 均无大块黑底白字残留  
- [ ] **Step 5:** 发消息/导航功能正常  

---

## Spec coverage

| Spec 项 | Task |
|---------|------|
| 默认浅色 + token | 1 |
| 暗色深蓝夜空 | 1 |
| 顶栏切换 + localStorage | 1 |
| 侧栏 A + 主区 B | 2 |
| 知识库 / 实验室 | 3 |
| Three.js 背景 | 3 |
| 验收清单 | 4 |

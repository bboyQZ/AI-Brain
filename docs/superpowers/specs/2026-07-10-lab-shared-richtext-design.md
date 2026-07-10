# 概念实验室：共用富文本 + Tab 示例（布局 A）

> 状态：已对齐，待实现规划  
> 日期：2026-07-10  
> 范围：`/lab` 概念实验室页面；默认富文本稿 + 页内编辑 + localStorage；左右分栏

---

## 1. 目标

1. 实验室有**一份全 Tab 共用**的富文本说明区，作者可在仓库放默认稿，也可在页面上随意改。  
2. 页面修改只存在**浏览器 localStorage**；清缓存或点「恢复默认」后回到仓库默认稿。  
3. 顶栏 Tab 只切换**右侧示例 Demo**（Tokenize / Attention / Embedding / RAG / Architecture），不切换说明内容。  
4. 富文本硬上限 **10000 字符**，超出截断。

### 非目标

- 不按 Tab 分多份说明  
- 不写后端、不入 RAG / `knowledge/`  
- 不引入 TipTap / Quill 等重型编辑器  
- 不改各 Demo 内部业务逻辑（仅嵌入右侧）

---

## 2. 已确认决策

| 点 | 结论 |
|----|------|
| 说明与 Tab | 全 Tab **共用**一份富文本 |
| 布局 | **A**：左说明 · 右当前示例；窄屏上下叠 |
| 编辑方式 | 页内简易富文本（`contentEditable` + 小工具栏） |
| 默认稿 | 仓库文件 `frontend/src/lab-notes/default.html` |
| 草稿 | `localStorage` 键 `ai-brain-lab-richtext` |
| 字数 | 最大 10000，截断并显示计数 |
| 恢复 | 「恢复默认」清除草稿并重载默认稿 |

---

## 3. UI 结构

```
┌─ lab-tabs: Tokenize | Attention | Embedding | RAG | Architecture ─┐
├────────────────────────────┬──────────────────────────────────────┤
│ 工具栏 + 字数 + 恢复默认     │  lab-header（当前 Tab 标题/简述）      │
│ 共用富文本编辑区             │  当前 Demo / Architecture 入口        │
│ （切 Tab 内容不变）          │  （随 Tab 切换）                        │
└────────────────────────────┴──────────────────────────────────────┘
```

- 左栏约 40%～45%，右栏弹性占满；`min-width` 以下改为说明在上、示例在下。  
- 视觉：沿用现有 `--sidebar-bg` / `--accent` 浅色体系；左栏为说明工作区，右栏为示例主区。

---

## 4. 数据流

1. 挂载：若 localStorage 有草稿 → 用草稿；否则 `import` / fetch 默认 `default.html`。  
2. 输入/粘贴：规范化后若 `length > 10000` 则 `slice(0, 10000)`，写回编辑器并保存草稿。  
3. 防抖写入 localStorage（如 300ms），避免每个按键都同步。  
4. 「恢复默认」：`removeItem`，重新载入默认 HTML。

存储内容：HTML 字符串（与 `contentEditable.innerHTML` 一致）。

---

## 5. 组件边界

| 文件 | 职责 |
|------|------|
| `frontend/src/lab-notes/default.html` | 仓库默认说明（可手改） |
| `frontend/src/components/lab/LabRichText.tsx` | 工具栏、编辑、截断、localStorage、恢复 |
| `frontend/src/pages/LabPage.tsx` | 左右布局；左挂 RichText，右挂现有 Demo |
| `frontend/src/pages/LabPage.css` | 分栏与响应式 |

工具栏最小集：粗体、斜体、无序/有序列表（`document.execCommand` 或等价）；不做复杂表格/图片上传。

---

## 6. 验收

1. 首次进入：左栏显示默认稿内容。  
2. 编辑后刷新：仍为修改后内容（localStorage）。  
3. 清除站点数据或点「恢复默认」：回到默认稿。  
4. 粘贴超长文本：最终不超过 10000 字符，计数正确。  
5. 切换 Tab：左栏文字不变，右栏 Demo 切换正确。  
6. 窄屏：说明在上、示例在下，仍可滚动使用。

---

## 7. 风险

- `contentEditable` 在各浏览器 HTML 略有差异——可接受；默认稿保持简单 HTML。  
- 默认稿若用 `?raw` import，改文件后需 Vite 热更；部署后随前端静态资源发布。

# 概念实验室：共用富文本 + Tab 示例（布局 A）

> 状态：已对齐，待实现规划  
> 日期：2026-07-10  
> 范围：`/lab` 概念实验室页面结构与富文本草稿行为

---

## 1. 目标

在概念实验室提供：

1. **全 Tab 共用**的一份富文本说明区（页内可编辑）  
2. 各 Tab **只切换右侧示例 Demo**（Tokenize / Attention / Embedding / RAG / Architecture）  
3. 仓库有**默认富文本**；页内修改仅存浏览器；清缓存或点「恢复默认」回到仓库稿  
4. 富文本 **最多 10000 字符**，超出截断  

### 非目标

- 不按 Tab 分多份说明  
- 不写后端、不入 RAG / `knowledge/`  
- 不引入 TipTap / Quill 等重型编辑器  
- 不改各 Demo 内部业务逻辑（仅改页面壳布局）

---

## 2. 已确认决策

| 点 | 结论 |
|----|------|
| 说明与 Tab 关系 | 共用一份说明；Tab 只换示例 |
| 布局 | A：左说明 · 右示例；窄屏上下叠 |
| 编辑方式 | 简易 `contentEditable` + 小工具栏（方案 1） |
| 默认稿 | 仓库文件 `frontend/src/lab-notes/default.html` |
| 草稿 | `localStorage` 键 `ai-brain-lab-richtext` |
| 字数 | 硬上限 10000，截断并显示计数 |
| 还原 | 「恢复默认」清除草稿并重载默认稿 |

---

## 3. UI 结构

```
┌─ Lab Tabs (现有) ─────────────────────────────────────┐
│ Tokenize | Attention | Embedding | RAG | Architecture │
├─────────────────────┬─────────────────────────────────┤
│ 左：共用富文本       │ 右：当前 Tab 示例                │
│ · 工具栏             │ · tokenize → TokenizeDemo       │
│ · contentEditable    │ · …                             │
│ · 字数 n/10000       │ · architecture → 导读入口       │
│ · 恢复默认           │                                 │
└─────────────────────┴─────────────────────────────────┘
```

视觉：沿用现有天蓝浅色 token；左栏为说明工作区，右栏为示例主区；避免多余卡片堆叠。

---

## 4. 数据流

1. 进入 `/lab`：若 localStorage 有草稿 → 用草稿；否则 `import` / fetch 默认 `default.html`  
2. 编辑：`input`/`paste` 后量字符，`> 10000` 则截断再写回编辑器与 localStorage  
3. 「恢复默认」：`removeItem`，重新填入默认 HTML  
4. 切 Tab：不碰左侧内容，只切换右侧组件  

字符计数：对编辑器当前 HTML 字符串长度计数（与截断同一度量）。

---

## 5. 组件边界

| 文件 | 职责 |
|------|------|
| `frontend/src/lab-notes/default.html` | 出厂说明（可手改） |
| `frontend/src/components/lab/LabRichText.tsx` | 工具栏、编辑、字数、恢复、localStorage |
| `frontend/src/pages/LabPage.tsx` | 左右布局；Tab → 右侧 Demo |
| `frontend/src/pages/LabPage.css` | 分栏与窄屏响应 |

工具栏最低集：粗体、斜体、无序/有序列表、清除格式（`document.execCommand` 或等价）；不做复杂表格/图片上传。

---

## 6. 验收

1. 左说明在 Tokenize↔RAG 切换时内容不变（除非用户在编辑）  
2. 右示例随 Tab 正确切换  
3. 改说明后刷新仍在；清站点数据或点「恢复默认」回到 `default.html`  
4. 粘贴超长文本后长度 ≤ 10000，计数正确  
5. 窄屏可上下阅读，不出现横向撑破  

---

## 7. 风险

- `contentEditable` + HTML 长度含标签，可见字可能少于 10000——已接受（按 HTML 字符串计）  
- XSS：仅本人本机草稿 + 自有默认稿；不做服务端渲染他人 HTML  

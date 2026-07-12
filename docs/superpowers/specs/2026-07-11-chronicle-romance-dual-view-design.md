# Chronicle 双视图（公司图 + 恋爱线）设计

> PRIVATE：扩展 `frontend/src/chronicle/`，与 AI 课程 / 源码导读（`guide/`）无关。

## 背景

现有 Chronicle 以「公司人物图」呈现：部门分组框 + 汇报边 + 占位 `story`。叙事设定为：**主角是老板乔志，全员与老板存在恋爱关系**，但种类、形式、发生时间各不相同。

公司图的层级空间语义与恋爱故事的 hub-and-spoke 情感语义冲突。本设计在**同一人物数据集**上提供两套视图，默认以恋爱线为主阅读体验，公司图作设定索引保留。

## 目标

1. 双视图切换：「公司图」与「恋爱线」共用节点数据，边与布局按视图分离。
2. 恋爱线以乔志为中心，员工环绕；边上承载 **种类**、**形式** 元数据；**时间** 写在侧栏长文。
3. 焦点降密：默认只显示当前选中人物与乔志的一条边；可切换「全部关系」并支持种类/形式筛选。
4. 侧栏分区展示：公司身份 + 与乔志的恋爱叙事。
5. 继续满足原 Chronicle 验收（隐藏入口、无路由、与 `guide/` 零引用）。

## 非目标（本期不做）

- 图上时间轴 / 阶段 Tab 切换（时间仅在 `narrative` 文字中体现，后续可单独立项）。
- 后端 API 或持久化；数据仍编辑 `flows.ts`。
- 头像批量上线（`image` 字段机制不变）。
- 将 Chronicle 并入源码导读。

---

## 决策摘要

| 项 | 选择 |
| --- | --- |
| 视图 | 顶栏 Segmented：`恋爱线`（默认） / `公司图` |
| 主角 | `protagonistId: "qiaozhi"`，恋爱视图居中放大 |
| 边模型 | 单边数组 + `kind: "reportsTo" \| "romance"`；按视图过滤 |
| 恋爱边 | 乔志 → 每名员工一条；元数据 `RomanceMeta` |
| 降密 | 默认「焦点」：仅高亮选中员工对应边；可切「全部关系」 |
| 筛选 | 恋爱视图：按 `kind`（种类）、`form`（形式）多选 chips |
| 布局 | 公司图沿用现有坐标；恋爱图运行时径向布局（按部门象限） |
| 故事字段 | `bio`（公司）+ `romance`（标签）+ `narrative`（与乔志长文，含时间线） |
| 视觉 | 恋爱线：曲线边、种类配色、形式线型；公司图保持现状 |

---

## 数据模型

### 扩展类型（`flows.ts`）

```typescript
/** 恋爱关系标签（图上可见）；时间写在 narrative 正文 */
export type RomanceMeta = {
  /** 种类：暗恋、暧昧、交往、复杂关系… */
  kind: string;
  /** 形式：秘密、公开、单向、不对等… */
  form: string;
};

export type ChronicleNodeDef = {
  id: string;
  label: string;
  image?: string;
  subtitle?: string;       // 公司身份，两视图均显示
  bio?: string;              // 公司侧简介（部門職責、日常）
  romance?: RomanceMeta;     // 恋爱标签；未填则恋爱视图仍显示节点、边无标签样式
  narrative?: string;      // 与乔志的恋爱故事（含发生时间、经过）
  /** @deprecated 迁移期兼容；优先读 bio / narrative */
  story?: string;
  parentId?: string;
  position: { x: number; y: number }; // 仅公司图使用
};

export type ChronicleEdgeDef = {
  id: string;
  source: string;
  target: string;
  kind: "reportsTo" | "romance";
  label?: string;
  romance?: RomanceMeta;     // kind=romance 时与节点可冗余，以边为准用于筛选/样式
};

export type ChronicleFlow = {
  title: string;
  protagonistId: string;
  defaultView: "romance" | "org";
  groups: ChronicleGroupDef[];
  nodes: ChronicleNodeDef[];
  edges: ChronicleEdgeDef[];
};
```

### 迁移约定

1. 现有 `story` 占位句：拆为 `bio`（一句职位描述）+ 空 `narrative`（待写作填充）。
2. 现有 6 条汇报边加 `kind: "reportsTo"`。
3. 新增恋爱边：对 `nodes` 中除 `qiaozhi` 外每人 `{ source: "qiaozhi", target: id, kind: "romance", romance: node.romance }`；可用 `buildRomanceEdges(nodes, protagonistId)` 辅助生成，避免手写 40+ 条。
4. `title`：恋爱视图显示「恋爱线」或 flow 级 `romanceTitle`；公司视图显示「公司人物图」。

### 写作模板（侧栏）

作者填每名员工：

```typescript
{
  id: "hansiying",
  label: "韩思莹",
  subtitle: "十秘",
  bio: "乔志的秘书之一，负责日程与文书。",
  romance: { kind: "暗恋", form: "秘密" },
  narrative: "时间：入职第三个月起…\n\n（正文）",
}
```

---

## 架构与数据流

```
flows.ts (CHRONICLE_FLOW)
  │
  ├─ viewMode: "romance" | "org"     ← Overlay 顶栏切换
  ├─ edgeDisplay: "focus" | "all"    ← 恋爱视图降密
  ├─ filters: { kinds[], forms[] }   ← 恋爱视图筛选
  │
  ├─ org 路径：
  │    groups + nodes(原坐标) + edges(kind=reportsTo)
  │
  └─ romance 路径：
       layoutRomance(nodes, groups, protagonistId) → 径向坐标
       edges(kind=romance) + 焦点/筛选裁剪
       protagonist 节点样式放大
```

新增文件建议：

| 文件 | 职责 |
| --- | --- |
| `frontend/src/chronicle/romanceLayout.ts` | 按 `parentId` 部门象限计算恋爱视图坐标；返回无 `parentId` 的扁平 nodes |
| `frontend/src/chronicle/romanceEdges.ts` | `buildRomanceEdges`、筛选、焦点边集合 |
| `frontend/src/chronicle/types.ts` | 共享类型（可选，避免 `flows.ts` 过重） |

`ChronicleOverlay.tsx` 负责视图状态；`FlowCanvas` 接收 `viewMode` 等 props，用 `useMemo` 派生 `nodes` / `edges`。

---

## 恋爱视图布局

### 原则

- 乔志固定在画布中心 `(cx, cy)`。
- 员工按所属部门（`parentId` → 四部门 + 无部门）分入四个扇区/象限，同一部门内等角距排列。
- 恋爱视图**不渲染** `chronicleGroup` 部门框（或渲染为极淡象限背景，pointer-events: none）；避免与公司图网格重复。

### 算法草图

```
输入：nodes, groups, protagonistId, canvasCenter
输出：Node[]（无 parentId，绝对坐标）

1. 主角节点：中心，data.isProtagonist = true
2. 将员工按 parentId 分桶（dept-secret / manage / service / clean / other）
3. 每个桶占 90° 扇区，半径 R0（内圈）~ R1（外圈）按人数分层
4. 每人角度 θᵢ = sectorStart + (i + 0.5) * sectorWidth / count
5. position = (cx + r * cos θ, cy + r * sin θ)
6. 根据 θ 设置 sourcePosition / targetPosition 使边指向中心
```

`fitView` 在切换视图后重新触发（已有 80ms timeout 模式可复用）。

---

## 边与交互

### 公司图

- 行为与现版一致：仅 `reportsTo` 边，`smoothstep`，部门框可见。
- 点击节点：侧栏展示 `bio`（无则回退 `story`）。

### 恋爱线

| 模式 | 可见边 |
| --- | --- |
| 焦点（默认） | 仅 `selectedId` 对应的一条乔志↔员工边；未选中或非员工节点时不显示边 |
| 全部关系 | 所有 `romance` 边，默认 opacity ~0.2；hover 单条高亮；选中端点相关边中等亮度 |

筛选：勾选 `kind` / `form` chips 后，隐藏不匹配的边；节点保持可见（避免图突然缺人），仅边淡出。

点击乔志：侧栏显示主角导语（静态文案或 `flows` 中 `protagonistIntro` 字段）；焦点模式下不绘制全员边。

### 边样式映射

| 维度 | 表现 |
| --- | --- |
| 种类 `kind` | 描边色相（如暗恋=玫瑰、暧昧=琥珀、交往=深红、复杂=紫；具体色值用 CSS 变量） |
| 形式 `form` | 线型：秘密=虚线、公开=实线、单向=点线；其余默认实线 |
| 边类型 | `bezier` 曲线指向中心，箭头在员工端 |

---

## 侧栏信息架构

```
┌─────────────────────────┐
│ 韩思莹                  │
│ 十秘                    │  ← subtitle
├─────────────────────────┤
│ [图]                    │  ← image 可选
├─────────────────────────┤
│ 公司                    │
│ bio 段落                │
├─────────────────────────┤
│ 与乔志                  │  ← 恋爱视图或两视图均显示 narrative 区
│ [暗恋] [秘密]           │  ← romance pills
│ narrative 长文          │  ← 时间线写在这里
└─────────────────────────┘
```

- 选中乔志：隐藏「与乔志」节，改显示 `protagonistIntro`。
- `narrative` 为空：显示「故事待续」占位，不报错。
- `romance` 未填：不显示 pills；边上使用默认中性样式。

---

## UI 结构

### 顶栏（`chronicle-topbar`）

```
[ 恋爱线 | 公司图 ]     chronicle-view-switch
标题（随视图变化）                    [关闭]
```

### 恋爱视图工具条（顶栏下方，仅 romance）

```
[ 焦点 | 全部关系 ]    种类：□暗恋 □暧昧 …    形式：□秘密 □公开 …
```

- 筛选 chips 从当前 `nodes[].romance` 去重生成，无硬编码枚举。
- 公司图隐藏工具条。

### 组件改动范围

| 文件 | 改动 |
| --- | --- |
| `flows.ts` | 类型扩展、迁移数据、`buildRomanceEdges` 调用 |
| `romanceLayout.ts` | 新建，径向布局 |
| `romanceEdges.ts` | 新建，边过滤辅助 |
| `ChronicleOverlay.tsx` | 视图状态、工具条、侧栏分区、派生 nodes/edges |
| `ChronicleNode.tsx` | `isProtagonist` 样式；恋爱视图动态 Handle 方位 |
| `ChronicleOverlay.css` | 视图切换、chips、恋爱边样式、pills、主角放大 |

---

## 视觉方向（frontend-design）

**主题**：同一 Overlay 内两种阅读心情——公司图是「冷档案」，恋爱线是「热辐射」。

| Token / 元素 | 公司图 | 恋爱线 |
| --- | --- | --- |
| 背景 | 现有 `--bg` | 同主题，中心极淡暖晕（radial gradient，低 opacity） |
| 主角节点 | 与普通一致 | 略大（约 1.15×），字重加粗，细描边光晕 |
| 边 | 青色 `smoothstep` | 曲线 + 种类色相 |
| 部门 | 实线分组框 | 象限淡色底或无框 |
| 工具条 | 无 | 紧凑 chips，不抢画布 |

**签名元素**：从中心乔志放射出的曲线情感边——「全员皆有关系」的视觉隐喻。

**克制**：不做动画边流动、不加心跳特效；`prefers-reduced-motion` 下禁用视图切换过渡。

---

## 错误与边界

- 缺少 `protagonistId`：恋爱视图回退公司图并 console warn（开发期）。
- 员工无 `romance`：仍出现在径向布局，边为默认灰色实线。
- 筛选结果 0 条边：画布仅节点，顶栏提示「当前筛选无关系线」。
- 窄屏：工具条可折行；故事区仍在底部 40%。

---

## 验收标准

1. 打开 Overlay 默认「恋爱线」，乔志居中，员工环绕。
2. 切换「公司图」恢复现有部门框 + 6 条汇报边 + 原坐标。
3. 焦点模式：点员工只亮一条乔志↔该员工边；切「全部关系」显示全员边且可 hover 高亮。
4. 种类/形式筛选仅影响边可见性，节点不消失。
5. 侧栏分区：`bio` + `与乔志`（pills + `narrative`）；时间为 narrative 正文内容。
6. 乔志节点在恋爱视图明显大于他人。
7. 原验收项仍满足：长按入口、关闭、无 URL、主题跟随、与 `guide/` 零引用。
8. 未配置 `image` 时不显示图、无占位。

---

## 实施顺序建议

1. 类型与数据迁移（`flows.ts` + 生成 romance 边）。
2. `romanceLayout.ts` + 视图切换派生 nodes。
3. 边过滤（焦点 / 全部 / chips）。
4. 侧栏分区与写作占位。
5. CSS：主角节点、恋爱边、工具条。
6. 逐人填充 `romance` + `narrative`（内容工作，可增量）。

---

## 与既有设计的关系

- 基于 `2026-07-10-character-chronicle-design.md` 扩展，不替换隐藏入口与隔离原则。
- 冲突命名统一：对外标题「恋爱线」/「公司人物图」；代码注释可用「Chronicle 双视图」。

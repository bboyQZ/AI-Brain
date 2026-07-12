# Chronicle 公司大楼 · 开罗风像素重构

**日期**: 2026-07-11  
**状态**: 已实现  
**取代**: [2026-07-11-chronicle-org-building-design.md](./2026-07-11-chronicle-org-building-design.md)（2.5D 翼楼方案已废弃）

## 目标

将 Chronicle「公司大楼」从 3D/草地像素 demo 升级为**开罗游戏式像素美术**的公司办公园区：俯瞰六翼环廊 + 部门室内双景别，保留六部门、52 人、侧栏、右侧档案等信息架构。

## 已确认决策

### 内容与边界

| 项 | 决策 |
|----|------|
| 叙事 | **公司大楼**（部门、员工、档案），非餐饮/经营/Agent 养殖隐喻 |
| 编制 | 不改 `flows.ts` / `orgMemberOrder.ts` |
| 3D | 公司大楼**彻底移除** R3F；恋爱线 3D 星图保留 |
| 导读 | 纯前端视觉，不更新 `flows.ts` / `explains.ts` |

### 双景别

| 景别 | 画面 | 规则 |
|------|------|------|
| `campus` 俯瞰 | 六翼环廊园区 | **零员工、零名牌** |
| `wing` 室内 | 工位格 + 像素员工 | 每部门独立 `officeLayout`，非 campus 块缩放 |

### 视觉 token

- `ink` `#2a2018` · `paper` `#f8edd0` · `paperDeep` `#e8dcc0`
- `walkway` `#c9b080` · `wood` `#b88850` · `highlight` `#ffd840`
- 部门色沿用 `orgBuildingPalette.ts`
- UI 字体：DotGothic16（org 模式）；档案正文系统无衬线

### 画布

- 逻辑尺寸 **320×200**，显示缩放 **×4**
- 签名元素：俯瞰中央**连廊枢纽**（六翼环廊俯视图）

### 部门室内标志道具（每部门最多 1 个）

| wingId | 道具 |
|--------|------|
| boss | 大办公桌 |
| dept-secret | 文件柜 |
| dept-manage | 档案架 |
| dept-service | 接待台 |
| dept-art | 灯架 |
| dept-clean | 双区工位隔断 |

### 动效

- 景别切换：200ms 横向像素擦除；`prefers-reduced-motion` 瞬时切换
- 选中员工：头顶「!」+ 描边高亮

## 模块结构

```
frontend/src/chronicle/
  ChronicleOrgScenePixel.tsx    # 入口（原 ChronicleOrgScene3D）
  orgPixel/
    kairoPalette.ts · campusLayout.ts · officeLayout.ts
    tiles.ts · sprites.ts · drawCampus.ts · drawOffice.ts · transition.ts
    OrgPixelChrome.tsx · useOrgStaffData.ts
```

## 开发直达

`http://localhost:<vite端口>/?chronicle=org`

## 验收

1. 俯瞰六翼环廊可识别，无草地绿
2. 室内 52 人点击档案正确
3. 全页 org 一套 token，侧栏含 subtitle
4. 浏览器自验通过；`.cursor/verify-*.png` 检查后删除

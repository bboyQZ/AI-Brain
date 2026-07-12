# Chronicle 公司大楼 · 像素资源说明

公司大楼已改为**开罗风 2D 像素 Canvas**（非 3D、非 GLTF）。

## 入口

- 组件：`ChronicleOrgScenePixel.tsx`
- 绘制层：`orgPixel/drawCampus.ts`、`orgPixel/drawOffice.ts`
- 开发直达：`/?chronicle=org`

## 景别

- **俯瞰**（`campus`）：六翼环廊，零员工
- **室内**（`wing`）：每部门独立 `officeLayout`

## 资产

当前为全程序化 Canvas 绘制（`tiles.ts` / `sprites.ts`），无外部精灵表依赖。

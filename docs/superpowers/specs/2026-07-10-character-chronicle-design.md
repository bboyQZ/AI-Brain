# 人物纪事（隐藏入口）设计

> PRIVATE：与 AI 课程 / 源码导读无关的独立功能。实现代码在 `frontend/src/chronicle/`。

## 目标

在主题切换按钮左侧提供完全隐形的长按热区，打开全屏「人物故事流程图」Overlay。无独立路由、不进导航。

## 决策摘要

| 项 | 选择 |
| --- | --- |
| 入口 | 主题按钮左侧透明热区，长按 ≥800ms |
| 页面 | 无路由全屏 Overlay，明显「关闭」按钮 |
| 交互 | React Flow 画布 + 右侧故事文案（可含图） |
| 图片 | 静态资源 `frontend/public/chronicle/portraits/`；无 `image` 则不渲染图、无占位 |
| 隔离 | 独立 `chronicle/` 目录 + 文件头标识；可用 `@xyflow/react`；不引用 `guide/` |
| 方案 | App 内 Overlay + 独立模块（方案 1） |

## 结构

- `App.tsx`：热区 + `chronicleOpen` + 条件渲染
- `frontend/src/chronicle/`：Overlay、节点、flows、样式
- `frontend/public/chronicle/portraits/`：人物图投放目录

## 验收

1. 长按热区打开；单击无反应  
2. 关闭后回到原页，URL 不变  
3. 点节点出故事；有图显示，无图无占位  
4. 主题跟随；窄屏故事区在底部  
5. 与 `guide/` 零互相引用  

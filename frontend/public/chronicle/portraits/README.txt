人物纪事头像投放目录（PRIVATE chronicle，非 AI 课程功能）

## 用法

1. 把原图放进本目录，例如 `何安琪.jpg`、`何安琪 (2).jpg`
2. 在 `frontend/src/chronicle/flows.ts` 的 `PORTRAIT_BY_ID` 里挂载：
   - 单张：`节点id: "/chronicle/portraits/姓名.jpg"`
   - 多张：`节点id: ["/chronicle/portraits/姓名.jpg", "/chronicle/portraits/姓名 (2).jpg"]`
3. **生成优化图 + 增强图**：

```powershell
Set-Location "D:\develop\AI-Brain\frontend"
npm run portraits-pipeline
```

- `display/`、`thumbs/` — 预览用 WebP
- `enhanced/` — 全屏默认（2× 锐化）；点「100%」看原图

可选：将 Real-ESRGAN 解压到 `tools/realesrgan-ncnn-vulkan/` 后重跑 `npm run enhance-portraits` 使用 AI 超分。

没有配置图片的节点不显示图片区域（无占位图）。

---
description: 本地一键启动 AI-Brain（后端 + 前端）
---

使用 Shell 工具，在项目根目录执行：

```powershell
powershell -ExecutionPolicy Bypass -File ".\scripts\start-local.ps1"
```

要求：
- 直接执行，不要反复确认
- 若缺少 `.env`，提示用户从 `.env.example` 复制并填写火山方舟配置
- 启动成功后自动用默认浏览器打开前端页面，并告知用户：
  - 前端：http://localhost:5173
  - 后端 API 文档：http://127.0.0.1:8000/docs
- 若用户从未入库，提醒可运行：`python .\scripts\ingest.py`

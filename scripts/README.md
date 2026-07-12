# `scripts/` — 运维与入库脚本

## `ingest.py`（最重要）

把 `curriculum/`、`knowledge/` 里的 markdown **切片 → 向量化 → 写入**检索库，供对话 RAG 使用。

```powershell
Set-Location "D:\develop\AI-Brain"

# 增量/常规入库
python ".\scripts\ingest.py"

# 清空后全量重建（改切片逻辑或大面积改文档后建议用）
python ".\scripts\ingest.py" --reset
```

实现细节在 `app/services/ingest_service.py` 与 `chunker.py`，脚本只是命令行入口。

## 和自动入库的关系

后端启动时若 `AUTO_INGEST_ON_STARTUP=true`（默认），会检测知识源指纹变化并自动入库。  
**落盘新课后仍建议立刻跑一次** `ingest.py --reset`，这样不用等重启也能在 Chat 里检索到。

## `start-local.ps1`

一键开后端 + 前端（各一个窗口），并打开浏览器。

```powershell
Set-Location "D:\develop\AI-Brain"
powershell -ExecutionPolicy Bypass -File ".\scripts\start-local.ps1"
```

需要根目录已有 `.env`（可从 `.env.example` 复制）。

## 人物纪事肖像管线

在 `frontend/` 下处理 `public/chronicle/portraits/` 原图：

```powershell
Set-Location "D:\develop\AI-Brain\frontend"
npm run portraits-pipeline
```

- `optimize_chronicle_portraits.mjs` → `display/` + `thumbs/`
- `enhance_chronicle_portraits.mjs` → `enhanced/`（2× 锐化；有 Real-ESRGAN 时优先 AI）

详见 `.cursor/rules/chronicle-portrait-pipeline.mdc`。

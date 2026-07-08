# 本地一键启动：后端 + 前端（各开一个 PowerShell 窗口）
# 用法：
#   Set-Location "D:\develop\AI-Brain"
#   powershell -ExecutionPolicy Bypass -File ".\scripts\start-local.ps1"

$Root = Split-Path -Parent $PSScriptRoot
Set-Location $Root

if (-not (Test-Path "$Root\.env")) {
    Write-Host "错误：未找到 .env，请先复制 .env.example 并填写 API Key。" -ForegroundColor Red
    exit 1
}

Write-Host "启动后端 http://127.0.0.1:8000 ..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList @(
    "-NoExit",
    "-Command",
    "Set-Location '$Root'; Write-Host 'AI-Brain 后端' -ForegroundColor Green; uvicorn app.main:app --reload --host 127.0.0.1 --port 8000"
)

Start-Sleep -Seconds 2

Write-Host "启动前端 http://localhost:5173 ..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList @(
    "-NoExit",
    "-Command",
    "Set-Location '$Root\frontend'; Write-Host 'AI-Brain 前端' -ForegroundColor Green; if (-not (Test-Path node_modules)) { npm install }; npm run dev"
)

Start-Sleep -Seconds 3
Start-Process "http://localhost:5173"

Write-Host ""
Write-Host "已打开两个服务窗口，并在浏览器中打开前端。" -ForegroundColor Green
Write-Host "  前端: http://localhost:5173"
Write-Host "  后端: http://127.0.0.1:8000/docs"
Write-Host ""
Write-Host "首次使用请先入库: python .\scripts\ingest.py" -ForegroundColor Yellow

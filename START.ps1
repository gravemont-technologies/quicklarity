# PowerShell startup script for Strategic Clarity Engine (Windows)
Write-Host "🚀 Starting Strategic Clarity Engine..." -ForegroundColor Cyan
Write-Host ""

# Run preflight check
Write-Host "📋 Running preflight checks..." -ForegroundColor Yellow
node preflight-check.js

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "❌ Preflight checks failed. Fix errors above." -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "✅ Preflight checks passed!" -ForegroundColor Green
Write-Host ""

# Open 3 terminal windows
Write-Host "Opening 3 terminal windows..." -ForegroundColor Cyan

# Backend
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD'; Write-Host '🔧 Backend API' -ForegroundColor Blue; npm run start"

# Worker
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD'; Write-Host '⚙️ Worker' -ForegroundColor Green; npm run worker"

# Frontend
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD\frontend'; Write-Host '🎨 Frontend' -ForegroundColor Magenta; npm run dev"

Write-Host ""
Write-Host "✅ All services started!" -ForegroundColor Green
Write-Host ""
Write-Host "Access points:" -ForegroundColor Cyan
Write-Host "  Frontend: http://localhost:3000"
Write-Host "  Backend:  http://localhost:8000"
Write-Host "  Health:   http://localhost:8000/health"
Write-Host ""


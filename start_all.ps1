# Start all GenLab development servers
# Run with: powershell -ExecutionPolicy Bypass -File start_all.ps1

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Starting GenLab Development Servers" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if we're in the right directory
if (-not (Test-Path "backend\main.py")) {
    Write-Host "ERROR: Please run this script from the GenLab directory" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

# Start Backend
Write-Host "Starting Backend (FastAPI on port 8000)..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD\backend'; python -m uvicorn main:app --reload --port 8000"

Start-Sleep -Seconds 2

# Start Frontend
Write-Host "Starting Frontend (Vite on port 3000)..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD\frontend'; npm run dev"

Start-Sleep -Seconds 2

# Start ElevenLabs Server
Write-Host "Starting ElevenLabs Server (Node.js on port 3002)..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD'; npm start"

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "All servers starting!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Backend:    http://localhost:8000" -ForegroundColor Yellow
Write-Host "Frontend:   http://localhost:3000" -ForegroundColor Yellow
Write-Host "ElevenLabs: http://localhost:3002" -ForegroundColor Yellow
Write-Host ""
Write-Host "API Docs:   http://localhost:8000/docs" -ForegroundColor Yellow
Write-Host ""
Write-Host "Servers are running in separate windows." -ForegroundColor Green
Write-Host "Close those windows to stop the servers." -ForegroundColor Green
Write-Host ""


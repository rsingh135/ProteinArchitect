@echo off
REM Start all servers for GenLab
REM This script starts backend, frontend, and ElevenLabs server

echo ========================================
echo Starting GenLab Development Servers
echo ========================================
echo.

REM Check if we're in the right directory
if not exist "backend\main.py" (
    echo ERROR: Please run this script from the GenLab directory
    pause
    exit /b 1
)

echo Starting Backend (FastAPI on port 8000)...
start "GenLab Backend" cmd /k "cd backend && python -m uvicorn main:app --reload --port 8000"

timeout /t 2 /nobreak >nul

echo Starting Frontend (Vite on port 3000)...
start "GenLab Frontend" cmd /k "cd frontend && npm run dev"

timeout /t 2 /nobreak >nul

echo Starting ElevenLabs Server (Node.js on port 3002)...
start "GenLab ElevenLabs Server" cmd /k "npm start"

echo.
echo ========================================
echo All servers starting!
echo ========================================
echo.
echo Backend:    http://localhost:8000
echo Frontend:   http://localhost:3000
echo ElevenLabs: http://localhost:3002
echo.
echo API Docs:   http://localhost:8000/docs
echo.
echo Press any key to exit (servers will keep running)...
pause >nul


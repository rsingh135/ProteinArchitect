@echo off
echo ============================================
echo Starting Protein Architect Backend Server
echo ============================================
echo.
echo IMPORTANT: Keep this window open while using the app!
echo.

REM Navigate to script directory
cd /d "%~dp0"

REM Check if main.py exists
if not exist "main.py" (
    echo ERROR: main.py not found!
    echo Make sure you're running this from the backend directory.
    pause
    exit /b 1
)

REM Check if virtual environment exists
if exist "venv\Scripts\activate.bat" (
    echo Activating virtual environment...
    call venv\Scripts\activate.bat
) else (
    echo No virtual environment found. Using system Python.
    echo.
)

REM Check if uvicorn is installed
python -c "import uvicorn" 2>nul
if errorlevel 1 (
    echo Installing uvicorn...
    pip install uvicorn[standard] fastapi
)

REM Check if port 8000 is in use
netstat -ano | findstr :8000 >nul
if %errorlevel% == 0 (
    echo WARNING: Port 8000 is already in use!
    echo.
    echo Please close the other application using port 8000, or
    echo press Ctrl+C and restart with a different port:
    echo   uvicorn main:app --reload --port 8001
    echo.
    pause
    exit /b 1
)

REM Start the server
echo.
echo ============================================
echo Starting FastAPI server...
echo ============================================
echo.
echo Server URL: http://localhost:8000
echo API Docs:   http://localhost:8000/docs
echo Health:     http://localhost:8000/health
echo.
echo Press Ctrl+C to stop the server
echo ============================================
echo.

uvicorn main:app --reload --port 8000 --host 127.0.0.1

pause


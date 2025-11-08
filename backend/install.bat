@echo off
echo 🧬 Protein Architect - Backend Installation (Windows)
echo ===========================================
echo.

REM Check Python
python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Python not found! Please install Python 3.9+
    echo.
    echo Try using 'py' instead:
    py --version
    pause
    exit /b 1
)

echo ✓ Python found
python --version
echo.

REM Check if Python 3.11 is available (better compatibility)
py -3.11 --version >nul 2>&1
if not errorlevel 1 (
    echo ✓ Python 3.11 found - using for better compatibility
    set PYTHON_CMD=py -3.11
) else (
    set PYTHON_CMD=python
)

REM Remove old venv
if exist venv (
    echo Removing old virtual environment...
    rmdir /s /q venv
)

REM Create virtual environment
echo.
echo Creating virtual environment...
%PYTHON_CMD% -m venv venv
if errorlevel 1 (
    echo ❌ Failed to create virtual environment
    pause
    exit /b 1
)

REM Activate and install
echo.
echo Activating virtual environment...
call venv\Scripts\activate.bat

echo.
echo Upgrading pip...
python -m pip install --upgrade pip setuptools wheel

echo.
echo Installing dependencies (this may take a few minutes)...
pip install -r requirements.txt
if errorlevel 1 (
    echo.
    echo ❌ Installation failed. Please check the errors above.
    echo.
    echo Troubleshooting:
    echo   1. Try using Python 3.11: py -3.11 -m venv venv
    echo   2. Install packages individually to identify issues
    echo   3. Check INSTALL_FIX.md for more solutions
    pause
    exit /b 1
)

REM Verify installation
echo.
echo Verifying installation...
python -c "import fastapi; import numpy; import openai; print('✓ All core packages imported successfully!')" 2>nul
if errorlevel 1 (
    echo ⚠ Some packages may not be installed correctly
) else (
    echo.
    echo ✅ Installation successful!
)

echo.
echo ===========================================
echo To start the server:
echo   1. venv\Scripts\activate.bat
echo   2. uvicorn main:app --reload --port 8000
echo.
pause


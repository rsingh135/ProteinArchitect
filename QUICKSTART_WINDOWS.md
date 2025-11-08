# ⚡ Quick Start Guide - Windows Edition

## 🎯 Get Running in 5 Minutes on Windows

### Prerequisites Check
- ✅ Python 3.9+ installed (check with `python --version`)
- ✅ Node.js 18+ installed (check with `node --version`)
- ✅ PowerShell or Command Prompt ready

### Step 1: Backend Setup (2 minutes)

#### Option A: Using PowerShell (Recommended)

```powershell
# Open PowerShell in the GenLab directory
cd "D:\My Projects\HackPrinceton2025\GenLab\backend"

# Check Python version
python --version

# Create virtual environment
python -m venv venv

# Activate virtual environment
.\venv\Scripts\Activate.ps1

# If you get an execution policy error, run this first:
# Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser

# Upgrade pip
python -m pip install --upgrade pip setuptools wheel

# Install dependencies
pip install -r requirements.txt

# Start server
uvicorn main:app --reload --port 8000
```

#### Option B: Using Command Prompt (CMD)

```cmd
REM Open Command Prompt in the GenLab directory
cd "D:\My Projects\HackPrinceton2025\GenLab\backend"

REM Check Python version
python --version

REM Create virtual environment
python -m venv venv

REM Activate virtual environment
venv\Scripts\activate.bat

REM Upgrade pip
python -m pip install --upgrade pip setuptools wheel

REM Install dependencies
pip install -r requirements.txt

REM Start server
uvicorn main:app --reload --port 8000
```

**If you get errors:** Try Python 3.11 instead:
```powershell
# Check if Python 3.11 is installed
py -3.11 --version

# Use specific Python version
py -3.11 -m venv venv
.\venv\Scripts\Activate.ps1
pip install --upgrade pip setuptools wheel
pip install -r requirements.txt
```

✅ Backend running at http://localhost:8000

### Step 2: Frontend Setup (2 minutes)

```powershell
# Open a NEW PowerShell window
cd "D:\My Projects\HackPrinceton2025\GenLab\frontend"

# Install dependencies
npm install

# Start development server
npm run dev
```

✅ Frontend running at http://localhost:3000

### Step 3: Test It!

1. Open http://localhost:3000 in your browser
2. Fill in the form:
   - Target Name: `Test Protein`
   - Max Length: `150`
   - Max Cysteines: `5`
3. Click **"Generate Protein"**
4. Explore the 3D visualization and manufacturing tabs!

## 🎨 Demo Flow

1. **Design Tab**: Generate a protein
2. **3D Structure Tab**: View the interactive protein structure
3. **Manufacturing Tab**: See production protocol and cost estimates
4. **Refine Design**: Click "Refine Design" to use LLM-powered refinement

## 🚨 Common Windows Issues

### PowerShell Execution Policy Error

If you see: `cannot be loaded because running scripts is disabled on this system`

**Solution:**
```powershell
# Run PowerShell as Administrator, then:
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser

# Or use Command Prompt instead (CMD)
```

### Python Not Found

**Solution:**
```powershell
# Try using 'py' instead of 'python'
py --version

# Or use full path
C:\Python39\python.exe --version
```

### Port Already in Use

**Solution:**
```powershell
# Find what's using port 8000
netstat -ano | findstr :8000

# Kill the process (replace PID with actual process ID)
taskkill /PID <PID> /F

# Or use a different port
uvicorn main:app --reload --port 8001
```

### Virtual Environment Activation Fails

**Solution:**
```powershell
# Make sure you're in the backend directory
cd backend

# Try full path
.\venv\Scripts\python.exe -m pip install -r requirements.txt

# Or recreate venv
Remove-Item -Recurse -Force venv
python -m venv venv
.\venv\Scripts\Activate.ps1
```

### Node.js Not Found

**Solution:**
```powershell
# Check if Node.js is installed
node --version

# If not found, download from: https://nodejs.org/
# Make sure to add to PATH during installation
```

## 💡 Windows-Specific Tips

- **Use PowerShell ISE or VS Code** for better terminal experience
- **Keep two terminal windows open**: One for backend, one for frontend
- **Use `Ctrl+C`** to stop servers (not `Ctrl+Z`)
- **Check Windows Firewall** if localhost connections fail
- **Use `Get-Command python`** in PowerShell to find Python location

## 🎯 Quick Commands Reference

### Backend (PowerShell)
```powershell
cd backend
.\venv\Scripts\Activate.ps1
uvicorn main:app --reload --port 8000
```

### Backend (CMD)
```cmd
cd backend
venv\Scripts\activate.bat
uvicorn main:app --reload --port 8000
```

### Frontend
```powershell
cd frontend
npm install
npm run dev
```

### Deactivate Virtual Environment
```powershell
# PowerShell or CMD
deactivate
```

## 🎯 Hackathon Demo Script

1. **Introduction** (30s): "Protein Architect solves the expressibility cliff problem"
2. **Generate Protein** (1min): Show the design form and generate a sequence
3. **3D Visualization** (1min): Rotate and zoom the protein structure
4. **Manufacturing View** (1min): Show cost optimization and protocol generation
5. **LLM Refinement** (1min): Demonstrate natural language refinement
6. **AWS Integration** (30s): Show SageMaker prediction source in API response

**Total: ~5 minutes demo**

---

## 🔧 Alternative: Create install.bat Script

Create a file `backend\install.bat`:

```batch
@echo off
echo 🧬 Protein Architect - Backend Installation (Windows)
echo ===========================================
echo.

REM Check Python
python --version
if errorlevel 1 (
    echo ❌ Python not found! Please install Python 3.9+
    pause
    exit /b 1
)

REM Remove old venv
if exist venv (
    echo Removing old virtual environment...
    rmdir /s /q venv
)

REM Create virtual environment
echo Creating virtual environment...
python -m venv venv

REM Activate and install
echo Activating virtual environment...
call venv\Scripts\activate.bat

echo Upgrading pip...
python -m pip install --upgrade pip setuptools wheel

echo Installing dependencies...
pip install -r requirements.txt

echo.
echo ✅ Installation complete!
echo.
echo To start the server:
echo   venv\Scripts\activate.bat
echo   uvicorn main:app --reload --port 8000
echo.
pause
```

Then run:
```cmd
cd backend
install.bat
```

---

Ready to build? Let's go! 🚀


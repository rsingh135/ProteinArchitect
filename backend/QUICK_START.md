# Quick Start Guide - Backend Server

## ⚠️ IMPORTANT: Backend Must Run Separately

The backend server **MUST** be running as a separate process for the frontend to work. The frontend cannot connect if the backend isn't running.

## Step-by-Step: Start the Backend

### Step 1: Open a New Terminal/PowerShell Window

**Keep this window open** - the server needs to keep running.

### Step 2: Navigate to Backend Directory

```powershell
cd "D:\My Projects\HackPrinceton2025\GenLab\backend"
```

### Step 3: Activate Virtual Environment (if you have one)

```powershell
.\venv\Scripts\Activate.ps1
```

If that gives an error, try:
```powershell
venv\Scripts\activate.bat
```

Or if you don't have a venv, skip this step.

### Step 4: Install Dependencies (if needed)

```powershell
pip install -r requirements.txt
```

### Step 5: Start the Server

```powershell
uvicorn main:app --reload --port 8000
```

### Step 6: Verify It's Running

You should see output like:
```
INFO:     Uvicorn running on http://127.0.0.1:8000 (Press CTRL+C to quit)
INFO:     Started reloader process
INFO:     Started server process
INFO:     Waiting for application startup.
INFO:     Application startup complete.
```

### Step 7: Test the Connection

Open your browser and go to:
- **Health check**: http://localhost:8000/health
- **API docs**: http://localhost:8000/docs

If you see the API documentation page, the server is running correctly!

## Common Issues

### Issue 1: "Port 8000 already in use"
**Solution**: Another process is using port 8000
- Find what's using it: `netstat -ano | findstr :8000`
- Close that process, OR
- Use a different port: `uvicorn main:app --reload --port 8001`
- Update frontend `API_URL` in `ResearchOverview.jsx` to use port 8001

### Issue 2: "Module not found: uvicorn"
**Solution**: Install uvicorn
```powershell
pip install uvicorn[standard]
```

### Issue 3: "Module not found: fastapi"
**Solution**: Install all dependencies
```powershell
pip install -r requirements.txt
```

### Issue 4: "DEDALUS_API_KEY not found"
**Solution**: This is OK - the server will start but research won't work
- Get API key from https://dedaluslabs.ai
- Add to `.env` file in backend directory:
  ```
  DEDALUS_API_KEY=your_key_here
  ```

## Running Both Frontend and Backend

You need **TWO terminal windows**:

**Terminal 1 - Backend:**
```powershell
cd "D:\My Projects\HackPrinceton2025\GenLab\backend"
uvicorn main:app --reload --port 8000
```

**Terminal 2 - Frontend:**
```powershell
cd "D:\My Projects\HackPrinceton2025\GenLab\frontend"
npm run dev
# or
npm start
```

Both must be running simultaneously!

## Quick Test

Once the backend is running, test it:
```powershell
curl http://localhost:8000/health
```

Or open in browser: http://localhost:8000/health

Should return: `{"status":"healthy"}`




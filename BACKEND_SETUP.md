# Backend Setup - Quick Guide

## ⚠️ CRITICAL: Backend Must Run Separately

**YES, you MUST run the backend as a separate process!** 

The frontend (React/Vite) and backend (FastAPI) are **two separate applications** that communicate over HTTP. Both must be running simultaneously.

## How It Works

```
┌─────────────────┐         HTTP Requests         ┌─────────────────┐
│   Frontend      │  ───────────────────────────>  │   Backend       │
│   (Port 5173)  │  <───────────────────────────  │   (Port 8000)   │
│   React/Vite    │         JSON Responses          │   FastAPI       │
└─────────────────┘                                 └─────────────────┘
```

## Step-by-Step: Start Backend

### Option 1: Double-Click Script (Easiest)

1. Go to: `GenLab/backend/`
2. Double-click: `start_backend.bat`
3. A terminal window will open and start the server
4. **Keep this window open!**

### Option 2: Manual Start (PowerShell)

1. **Open a NEW PowerShell window** (keep it open!)

2. **Run these commands:**
   ```powershell
   cd "D:\My Projects\HackPrinceton2025\GenLab\backend"
   uvicorn main:app --reload --port 8000
   ```

3. **You should see:**
   ```
   INFO:     Uvicorn running on http://127.0.0.1:8000
   INFO:     Application startup complete.
   ```

4. **Keep this window open!** (Don't close it)

## Verify Backend is Running

### Test 1: Browser
Open: http://localhost:8000/health
- Should show: `{"status":"healthy"}`

### Test 2: API Docs
Open: http://localhost:8000/docs
- Should show FastAPI documentation page

### Test 3: PowerShell
```powershell
Invoke-WebRequest -Uri http://localhost:8000/health
```
- Should return status 200

## Running Both Frontend and Backend

You need **TWO separate terminal windows**:

### Terminal 1: Backend (Port 8000)
```powershell
cd "D:\My Projects\HackPrinceton2025\GenLab\backend"
uvicorn main:app --reload --port 8000
```
**Keep this running!**

### Terminal 2: Frontend (Port 5173 or 3000)
```powershell
cd "D:\My Projects\HackPrinceton2025\GenLab\frontend"
npm run dev
```
**Keep this running too!**

## Troubleshooting

### "Port 8000 already in use"
**Solution**: Something else is using port 8000
- Find it: `netstat -ano | findstr :8000`
- Kill it, OR use port 8001:
  ```powershell
  uvicorn main:app --reload --port 8001
  ```
- Update frontend `API_URL` to `http://localhost:8001`

### "ModuleNotFoundError: No module named 'uvicorn'"
**Solution**: Install dependencies
```powershell
cd "D:\My Projects\HackPrinceton2025\GenLab\backend"
pip install -r requirements.txt
```

### "Cannot connect" error persists
**Checklist:**
1. ✅ Backend terminal is open and running
2. ✅ You see "Uvicorn running on http://127.0.0.1:8000"
3. ✅ http://localhost:8000/health works in browser
4. ✅ No firewall blocking port 8000
5. ✅ Frontend is using correct API_URL

## Quick Test Command

Test if backend is running:
```powershell
curl http://localhost:8000/health
```

Or in PowerShell:
```powershell
Invoke-WebRequest -Uri http://localhost:8000/health
```

If this fails, the backend is NOT running!




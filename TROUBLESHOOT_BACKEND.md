# Troubleshooting: "Cannot connect to backend server"

## Quick Fix

The error means your backend server is **not running**. Here's how to fix it:

## Step 1: Check if Backend is Running

Open a terminal and run:

```bash
# Windows PowerShell
netstat -ano | findstr :8000

# Mac/Linux
lsof -i :8000
```

**If nothing shows up**, the backend is not running. Continue to Step 2.

**If something shows up**, another process is using port 8000. Close it or use a different port.

## Step 2: Start the Backend

### Option A: Using npm (Recommended)

From the **root directory** (`GenLab/`):

```bash
npm start
```

This starts both frontend and backend together.

### Option B: Start Backend Only

**From the backend directory** (`GenLab/backend/`):

```bash
# Windows
python run_backend_simple.py

# Mac/Linux
python3 run_backend_simple.py
```

### Option C: Using the batch file (Windows)

Double-click `GenLab/backend/start_backend.bat`

## Step 3: Verify Backend is Running

After starting, you should see:

```
Starting server on http://localhost:8000
INFO:     Uvicorn running on http://127.0.0.1:8000
```

Then test it:

```bash
# In a browser or new terminal
curl http://localhost:8000/health
```

Or open: http://localhost:8000/docs

## Step 4: Check for Common Issues

### Issue 1: Python not found

**Error:** `'python' is not recognized`

**Fix:**
- Make sure Python is installed
- Try `py` instead of `python` on Windows
- Or use full path: `C:\Python\python.exe`

### Issue 2: Dependencies not installed

**Error:** `ModuleNotFoundError: No module named 'fastapi'`

**Fix:**
```bash
cd backend
pip install -r requirements.txt
```

### Issue 3: Port 8000 already in use

**Error:** `Address already in use`

**Fix:**
- Close the other application using port 8000
- Or change the port in `main.py` and `SearchBar.jsx`

### Issue 4: Backend starts but frontend can't connect

**Check:**
1. Backend is running on `127.0.0.1:8000` (not `0.0.0.0`)
2. Frontend is trying to connect to `http://localhost:8000`
3. CORS is configured correctly (should be in `main.py`)

## Step 5: Run Health Check Script

From `GenLab/backend/`:

```bash
python check_backend.py
```

This will verify:
- ✅ All dependencies are installed
- ✅ Port 8000 is available
- ✅ Configuration is correct

## Quick Test

1. **Start backend:**
   ```bash
   cd GenLab/backend
   python run_backend_simple.py
   ```

2. **In another terminal, test connection:**
   ```bash
   curl http://localhost:8000/health
   ```

3. **If that works, start frontend:**
   ```bash
   cd GenLab/frontend
   npm run dev
   ```

## Still Not Working?

1. **Check the backend terminal** for error messages
2. **Check browser console** (F12) for detailed error messages
3. **Verify both are running:**
   - Backend: http://localhost:8000/docs
   - Frontend: http://localhost:5173

## Expected Behavior

When everything is working:

1. Backend terminal shows:
   ```
   INFO:     Uvicorn running on http://127.0.0.1:8000
   INFO:     Application startup complete.
   ```

2. Frontend can make requests to:
   - `http://localhost:8000/health` ✅
   - `http://localhost:8000/research_protein` ✅

3. No "Cannot connect" errors in the browser

## Need More Help?

Check the backend logs for specific error messages. Common issues:
- Missing API keys (DEDALUS_API_KEY)
- Python version incompatibility
- Firewall blocking port 8000
- Virtual environment not activated


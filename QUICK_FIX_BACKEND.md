# 🚨 Quick Fix: Backend Connection Error

## The Problem
You're seeing: **"Cannot connect to backend server. Please make sure the backend is running on http://localhost:8000"**

## The Solution (3 Steps)

### Step 1: Open a Terminal

Open PowerShell or Command Prompt.

### Step 2: Navigate to Backend Directory

```bash
cd "D:\My Projects\HackPrinceton2025\GenLab\backend"
```

### Step 3: Start the Backend

```bash
python run_backend_simple.py
```

**You should see:**
```
Starting server on http://localhost:8000
INFO:     Uvicorn running on http://127.0.0.1:8000
```

**✅ Keep this terminal window open!** The backend must stay running.

### Step 4: Test It Works

Open a new browser tab and go to:
- http://localhost:8000/health

You should see: `{"status":"healthy"}`

### Step 5: Use Your Frontend

Now your frontend should work! The error will disappear.

---

## Alternative: Use npm (Easier!)

From the **root directory** (`GenLab/`):

```bash
npm start
```

This starts **both** frontend and backend together! 🎉

---

## Still Not Working?

### Check 1: Is Python installed?
```bash
python --version
```

If not, install Python from python.org

### Check 2: Are dependencies installed?
```bash
cd backend
pip install -r requirements.txt
```

### Check 3: Is port 8000 free?
```bash
# Windows
netstat -ano | findstr :8000

# If something shows up, close that application
```

### Check 4: Run the health check
```bash
cd backend
python check_backend.py
```

This will tell you exactly what's wrong.

---

## Common Issues

| Error | Fix |
|-------|-----|
| `python not found` | Use `py` instead, or install Python |
| `ModuleNotFoundError` | Run `pip install -r requirements.txt` |
| `Address already in use` | Close the app using port 8000 |
| `Cannot connect` | Make sure backend is running! |

---

## Remember

**The backend MUST be running** for the frontend to work. It's like a server - it needs to stay on!

You can:
- ✅ Keep the terminal open
- ✅ Minimize it (it still runs)
- ✅ Use `npm start` to run both together


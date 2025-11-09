# 🚀 Start Backend NOW - Simple Instructions

## The Problem
You're getting: **"Cannot connect to backend server"**

This means the backend is **not running**. Let's fix it!

## Solution: 3 Simple Steps

### Step 1: Open PowerShell/Terminal

Press `Win + X` and select "Windows PowerShell" or "Terminal"

### Step 2: Navigate to Backend

Copy and paste this:

```powershell
cd "D:\My Projects\HackPrinceton2025\GenLab\backend"
```

### Step 3: Install Dependencies (First Time Only)

```powershell
pip install -r requirements.txt
```

**Wait for this to finish!** It may take a few minutes.

### Step 4: Start the Backend

```powershell
python run_backend_simple.py
```

**You should see:**
```
Starting server on http://localhost:8000
INFO:     Uvicorn running on http://127.0.0.1:8000
```

**✅ SUCCESS!** The backend is now running.

### Step 5: Keep It Running

**DO NOT CLOSE THIS WINDOW!** Minimize it if you want, but keep it running.

### Step 6: Test It

Open your browser and go to:
- http://localhost:8000/health

You should see: `{"status":"healthy"}`

### Step 7: Use Your Frontend

Now go back to your frontend - the error should be gone! 🎉

---

## Alternative: Use npm (Easier!)

From the **root directory** (`GenLab/`):

```powershell
cd "D:\My Projects\HackPrinceton2025\GenLab"
npm start
```

This starts **both** frontend and backend together!

---

## Troubleshooting

### "python not found"
Try: `py run_backend_simple.py` instead

### "ModuleNotFoundError"
Run: `pip install -r requirements.txt`

### "Port 8000 already in use"
Close the other application using port 8000

### Still not working?
Run the health check:
```powershell
cd backend
python check_backend.py
```

---

## Remember

**The backend MUST stay running** for your frontend to work!

You can:
- ✅ Minimize the terminal (it still runs)
- ✅ Use `npm start` to run both together
- ✅ Keep the terminal open in the background

---

## Quick Test

After starting, test in a new terminal:

```powershell
curl http://localhost:8000/health
```

Or open in browser: http://localhost:8000/docs


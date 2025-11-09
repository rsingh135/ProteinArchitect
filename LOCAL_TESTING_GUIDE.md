# 🧪 Local Testing Guide - Button Animation

## Quick Answer: Test Button Animation (Frontend Only)

**For testing the button animation, you only need the frontend!** The button animation is pure frontend and doesn't require the backend.

### Steps:

```bash
# 1. Navigate to frontend directory
cd frontend

# 2. Install dependencies (if not already done)
npm install

# 3. Start frontend dev server
npm run dev
```

**That's it!** Open http://localhost:5173 (or the port shown in terminal) and test the button animation.

---

## Complete Setup (Frontend + Backend)

If you want to test the full app with backend features:

### Terminal 1: Backend (Python)

```bash
# 1. Navigate to backend directory
cd backend

# 2. Activate virtual environment (if it exists)
source venv/bin/activate

# 3. If venv doesn't exist or numpy error, create it:
python3 -m venv venv
source venv/bin/activate

# 4. Install dependencies
pip install --upgrade pip setuptools wheel
pip install -r requirements.txt

# 5. Start backend server
uvicorn main:app --reload --port 8000
```

**Backend will run at:** http://localhost:8000

### Terminal 2: Frontend (Node.js)

```bash
# 1. Navigate to frontend directory (in a NEW terminal)
cd frontend

# 2. Install dependencies (if not already done)
npm install

# 3. Start frontend dev server
npm run dev
```

**Frontend will run at:** http://localhost:5173 (or similar)

---

## Common Issues & Fixes

### Issue: "module numpy not found"

**Problem:** You're trying to run the backend through npm, but the backend is Python.

**Solution:**
```bash
# Don't use: npm run backend
# Instead, use Python directly:

cd backend
source venv/bin/activate  # Activate virtual environment
pip install -r requirements.txt  # Install dependencies
uvicorn main:app --reload --port 8000  # Start server
```

### Issue: "npm run backend" doesn't work

**Problem:** The `npm run backend` command in the root `package.json` runs a Node.js script (`start_backend.cjs`), not the Python backend.

**Solution:** Run the Python backend directly (see above).

### Issue: Virtual environment not activated

**Problem:** Python packages (like numpy) are installed in the virtual environment, but it's not activated.

**Solution:**
```bash
cd backend
source venv/bin/activate  # macOS/Linux
# OR
venv\Scripts\activate  # Windows

# Then install and run:
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

### Issue: Python version compatibility

**Problem:** Python 3.13 might have compatibility issues.

**Solution:** Use Python 3.11 or 3.12:
```bash
# Check available Python versions
python3.11 --version
python3.12 --version

# Create venv with specific version
python3.11 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

---

## Testing Button Animation (Frontend Only)

Since the button animation is pure frontend, you can test it without the backend:

```bash
# Terminal 1: Frontend only
cd frontend
npm install
npm run dev
```

Then:
1. Open http://localhost:5173 in your browser
2. Look for the "AI Assistant" button in the bottom right
3. Hover over it to see the cursor burst animation
4. Click it to toggle the animation on/off

**No backend needed for this!**

---

## Quick Command Reference

### Frontend Only (for button animation):
```bash
cd frontend
npm install
npm run dev
```

### Backend Only:
```bash
cd backend
source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

### Both (in separate terminals):
```bash
# Terminal 1
cd backend && source venv/bin/activate && uvicorn main:app --reload --port 8000

# Terminal 2
cd frontend && npm run dev
```

---

## What You Need

### For Frontend (Button Animation):
- ✅ Node.js 18+
- ✅ npm installed
- ✅ That's it!

### For Backend (Full App):
- ✅ Python 3.11 or 3.12
- ✅ pip installed
- ✅ Virtual environment (created automatically)

---

## Verify It's Working

### Frontend:
- ✅ Open http://localhost:5173
- ✅ See the app loading
- ✅ Hover over "AI Assistant" button → see cursor animation
- ✅ No errors in browser console

### Backend:
- ✅ Open http://localhost:8000/docs
- ✅ See FastAPI documentation
- ✅ No errors in terminal

---

## TL;DR

**Just testing button animation?**
```bash
cd frontend
npm install
npm run dev
```

**That's it!** No backend needed for the button animation.


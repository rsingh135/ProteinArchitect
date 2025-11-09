# ⚡ Quick Test Guide - Researcher Service

## 🚀 Fastest Way to Test

### Step 1: Check Setup (30 seconds)
```powershell
cd "D:\My Projects\HackPrinceton2025\GenLab\backend"
python test_researcher_simple.py
```

**Expected:** ✅ All checks pass

### Step 2: Test Full Research (5-10 minutes)
```powershell
python test_researcher.py
```

**Expected:** Research completes with results

### Step 3: Test via API (Optional)
```powershell
# Terminal 1: Start backend
python -m uvicorn main:app --reload --port 8000

# Terminal 2: Open API docs
# Browser: http://localhost:8000/docs
# Find /research_protein endpoint and test it
```

## 📋 Prerequisites Checklist

- [ ] `DEDALUS_API_KEY` set in `.env` file
- [ ] `pip install -r requirements.txt` completed
- [ ] Running from `backend` directory

## 🎯 Test Commands Summary

| Command | Purpose | Time |
|---------|---------|------|
| `python test_researcher_simple.py` | Quick setup check | < 1 sec |
| `python test_researcher_quick.py` | Basic validation | < 5 sec |
| `python test_researcher.py` | Full research test | 5-10 min |

## 🔗 API Testing

**Easiest method:** Use the interactive API docs
1. Start backend: `python -m uvicorn main:app --reload --port 8000`
2. Open: http://localhost:8000/docs
3. Find `/research_protein` endpoint
4. Click "Try it out" → Fill form → Execute

**Request body example:**
```json
{
  "protein_id": "P01308",
  "model": "gemini-1.5-flash",
  "include_novel": false,
  "months_recent": 6
}
```

## ❓ Need More Details?

See `TEST_RESEARCHER.md` for complete documentation.


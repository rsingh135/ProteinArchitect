# 🧪 How to Execute Test Files for AgenticResearch.py

## 📍 Step 1: Navigate to Backend Directory

```powershell
cd "D:\My Projects\HackPrinceton2025\GenLab\backend"
```

## 🚀 Step 2: Run the Test Files

### Option 1: Quick Test (Recommended First)
Tests basic setup and initialization without making API calls.

```powershell
python test_researcher_quick.py
```

**What it does:**
- Checks Python version
- Verifies directory
- Checks for DEDALUS_API_KEY
- Tests import
- Tests model formatting
- Tests service initialization

**Time:** < 5 seconds

### Option 2: Simple Test
Basic initialization test.

```powershell
python test_researcher_simple.py
```

**What it does:**
- Checks API key
- Tests import
- Tests initialization
- Tests model formatting

**Time:** < 1 second

### Option 3: Full Test (Complete Research)
Tests the complete research functionality with a real protein.

```powershell
python test_researcher.py
```

**What it does:**
- Full research pipeline
- Researches protein P01308 (Human insulin)
- Gathers citations
- Generates summary
- Tests all research sections

**Time:** 5-10 minutes (makes actual API calls)

### Option 4: Step-by-Step Test
Detailed test with step-by-step output.

```powershell
python test_researcher_step_by_step.py
```

**What it does:**
- Detailed logging at each step
- Full research process
- More verbose output

**Time:** 5-10 minutes

## 📋 Prerequisites

Before running tests, make sure:

1. **API Key is set:**
   - Create or edit `.env` file in `backend` directory
   - Add: `DEDALUS_API_KEY=your_api_key_here`

2. **Dependencies installed:**
   ```powershell
   pip install -r requirements.txt
   ```

3. **You're in the correct directory:**
   ```powershell
   cd "D:\My Projects\HackPrinceton2025\GenLab\backend"
   ```

## 🎯 Recommended Testing Order

1. **Start with Quick Test:**
   ```powershell
   python test_researcher_quick.py
   ```
   This verifies your setup is correct.

2. **Then Simple Test:**
   ```powershell
   python test_researcher_simple.py
   ```
   Confirms basic functionality.

3. **Finally Full Test:**
   ```powershell
   python test_researcher.py
   ```
   Tests complete research functionality.

## 💻 Complete Command Examples

### Windows PowerShell:
```powershell
# Navigate to backend
cd "D:\My Projects\HackPrinceton2025\GenLab\backend"

# Quick test
python test_researcher_quick.py

# Simple test
python test_researcher_simple.py

# Full test (takes time)
python test_researcher.py
```

### Using Python Module Syntax:
```powershell
# From backend directory
python -m test_researcher_quick
python -m test_researcher_simple
python -m test_researcher
```

### Direct Path (from anywhere):
```powershell
python "D:\My Projects\HackPrinceton2025\GenLab\backend\test_researcher_quick.py"
```

## ✅ Expected Output

### Quick Test Success:
```
STARTING TEST...
======================================================================

[1/6] Python check...
Python version: 3.x.x

[2/6] Directory check...
Current dir: D:\My Projects\HackPrinceton2025\GenLab\backend

[3/6] Environment check...
✅ DEDALUS_API_KEY found: abc123...

[4/6] Import test...
✅ Import successful

[5/6] Model formatting test...
  ✅ 'google/gemini-1.5-flash' -> 'gemini-1.5-flash'

[6/6] Service initialization...
✅ Service initialized successfully!

======================================================================
✅ ALL TESTS PASSED!
======================================================================
```

## ❌ Common Errors and Solutions

### Error: "DEDALUS_API_KEY not found"
**Solution:** Add API key to `.env` file:
```
DEDALUS_API_KEY=your_key_here
```

### Error: "ModuleNotFoundError: No module named 'services'"
**Solution:** Make sure you're running from the `backend` directory:
```powershell
cd "D:\My Projects\HackPrinceton2025\GenLab\backend"
python test_researcher_quick.py
```

### Error: "ImportError: cannot import 'dedalus_labs'"
**Solution:** Install dependencies:
```powershell
pip install -r requirements.txt
```

### Error: "NameError: name 'python' is not recognized"
**Solution:** Use `python3` or `py` instead:
```powershell
python3 test_researcher_quick.py
# OR
py test_researcher_quick.py
```

## 🔍 Understanding Test Results

- **✅ Green checkmarks** = Test passed
- **❌ Red X** = Test failed (check error message)
- **⚠️ Warning** = Non-critical issue (may still work)

## 📝 Test File Comparison

| File | Speed | API Calls | Best For |
|------|-------|-----------|----------|
| `test_researcher_quick.py` | Fast (< 5s) | No | Quick validation |
| `test_researcher_simple.py` | Very Fast (< 1s) | No | Basic setup check |
| `test_researcher.py` | Slow (5-10 min) | Yes | Full functionality |
| `test_researcher_step_by_step.py` | Slow (5-10 min) | Yes | Debugging |

## 🎉 Success!

If all tests pass, your AgenticResearch service is working correctly! You can now use it in your application.


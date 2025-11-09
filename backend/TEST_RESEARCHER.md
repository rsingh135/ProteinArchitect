# 🧪 How to Test AgenticResearch Service

## 🚀 Simple Test - Just Run This

```powershell
cd "D:\My Projects\HackPrinceton2025\GenLab\backend"
python test_researcher.py
```

That's it! The test will ask you:
- **Option 1 (default)**: Quick test - checks setup, no API calls (< 5 seconds)
- **Option 2**: Full test - does actual research (5-10 minutes)

## 📋 Prerequisites

1. **Set API Key:**
   - Create or edit `.env` file in `backend` directory
   - Add: `DEDALUS_API_KEY=your_api_key_here`
   - Get key from: https://dedaluslabs.ai

2. **Install Dependencies:**
   ```powershell
   pip install -r requirements.txt
   ```

## ✅ What the Test Does

### Quick Test (Option 1):
- ✅ Checks if API key is set
- ✅ Tests service import
- ✅ Tests service initialization
- ✅ Tests model formatting
- **Time:** < 5 seconds

### Full Test (Option 2):
- ✅ All quick test checks
- ✅ Runs actual protein research
- ✅ Tests citation gathering
- ✅ Tests summary generation
- **Time:** 5-10 minutes

## 🎯 Example Usage

```powershell
# Navigate to backend
cd "D:\My Projects\HackPrinceton2025\GenLab\backend"

# Run test (will prompt for quick or full)
python test_researcher.py

# Or run quick test directly (press Enter when prompted)
python test_researcher.py
# Then type: 1

# Or run full test directly
python test_researcher.py
# Then type: 2
```

## ✅ Expected Output

### Quick Test:
```
🧪 AgenticResearch Service Test

Choose test type:
  1. Quick test (fast, no API calls) - Recommended
  2. Full test (slow, makes API calls, takes 5-10 min)

Enter choice (1 or 2, default=1): 1

======================================================================
Quick Test - Checking Setup
======================================================================

✅ DEDALUS_API_KEY found: abc123...
✅ Service initialized successfully
✅ Quick test passed! Setup is correct.
```

### Full Test:
```
🧪 AgenticResearch Service Test

Choose test type:
  1. Quick test (fast, no API calls) - Recommended
  2. Full test (slow, makes API calls, takes 5-10 min)

Enter choice (1 or 2, default=1): 2

======================================================================
Full Test - Running Research
======================================================================

✅ DEDALUS_API_KEY found: abc123...
✅ Service initialized successfully
Testing research for protein: P01308
Using model: gemini-1.5-flash

⚠️  This will take 5-10 minutes...

======================================================================
✅ Research completed successfully!
======================================================================

Results summary:
  - Protein ID: P01308
  - Citations: 15 found
  - Papers section: Found
  - Use cases section: Found
  - Summary: Found
```

## ❌ Troubleshooting

### "DEDALUS_API_KEY not found"
- Add `DEDALUS_API_KEY=your_key` to `.env` file in `backend` directory

### "ImportError: cannot import 'dedalus_labs'"
- Run: `pip install -r requirements.txt`

### "ModuleNotFoundError: No module named 'services'"
- Make sure you're running from the `backend` directory

## 💡 Tips

- **Start with Quick Test** - It's fast and verifies your setup
- **Use Full Test** - Only when you want to test complete functionality
- **Check API docs** - Test via API at http://localhost:8000/docs (when backend is running)

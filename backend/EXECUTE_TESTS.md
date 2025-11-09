# ⚡ Quick Guide: How to Test AgenticResearch

## 🎯 Simple - Just Run This

```powershell
cd "D:\My Projects\HackPrinceton2025\GenLab\backend"
python test_researcher.py
```

The test will ask you to choose:
- **Option 1 (default)**: Quick test - fast, no API calls
- **Option 2**: Full test - complete research (takes 5-10 min)

## 📝 What the Test Does

| Option | What It Tests | Time |
|--------|---------------|------|
| **1 (Quick)** | Setup, imports, initialization | < 5 sec |
| **2 (Full)** | Complete research with API calls | 5-10 min |

## ✅ Before Running

Make sure you have:
1. **API Key** in `.env` file: `DEDALUS_API_KEY=your_key`
2. **Dependencies installed**: `pip install -r requirements.txt`
3. **Correct directory**: You're in the `backend` folder

## 🔍 Verify It's Working

After running a test, you should see:
- ✅ Checkmarks for passed tests
- Output showing what was tested
- No error messages

If you see errors, check:
- Is `DEDALUS_API_KEY` set in `.env`?
- Are you in the `backend` directory?
- Are dependencies installed?

## 💡 Pro Tip

Start with `test_researcher_quick.py` - it's the fastest and will tell you if your setup is correct!


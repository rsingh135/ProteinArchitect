# ⚡ Quick Start Guide

## 🚀 Start Everything at Once (Windows)

### Option 1: Use the Batch Script (Easiest)
```powershell
cd "D:\My Projects\HackPrinceton2025\GenLab"
.\start_all.bat
```

This will open 3 separate terminal windows:
- Backend (port 8000)
- Frontend (port 3000)  
- ElevenLabs Server (port 3002)

### Option 2: Use PowerShell Script
```powershell
cd "D:\My Projects\HackPrinceton2025\GenLab"
powershell -ExecutionPolicy Bypass -File start_all.ps1
```

## 🎯 Manual Start (Recommended for Development)

### Terminal 1: Backend
```powershell
cd "D:\My Projects\HackPrinceton2025\GenLab\backend"
python -m uvicorn main:app --reload --port 8000
```

**Verify:** Open http://localhost:8000/docs

### Terminal 2: Frontend
```powershell
cd "D:\My Projects\HackPrinceton2025\GenLab\frontend"
npm run dev
```

**Verify:** Open http://localhost:3000

### Terminal 3: ElevenLabs Server (Optional - only if using voice features)
```powershell
cd "D:\My Projects\HackPrinceton2025\GenLab"
npm start
```

## ✅ Verify Everything Works

1. **Backend API Docs:** http://localhost:8000/docs
2. **Frontend App:** http://localhost:3000
3. **Test Connection:** Open browser DevTools (F12) → Network tab → Use the app → Check API calls

## 🔧 Troubleshooting

### Port Already in Use?
```powershell
# Check what's using port 8000
netstat -ano | findstr :8000

# Check what's using port 3000
netstat -ano | findstr :3000
```

### Backend Won't Start?
```powershell
cd GenLab\backend
pip install -r requirements.txt
```

### Frontend Won't Start?
```powershell
cd GenLab\frontend
npm install
```

## 📚 More Details

See `START_BOTH_SERVERS.md` for complete documentation.


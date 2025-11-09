# 🚀 How to Run Backend and Frontend Together

This guide shows you how to start both the backend (Python FastAPI) and frontend (React/Vite) so they work together.

## 📋 Prerequisites

1. **Backend dependencies installed:**
   ```bash
   cd GenLab/backend
   pip install -r requirements.txt
   ```

2. **Frontend dependencies installed:**
   ```bash
   cd GenLab/frontend
   npm install
   ```

## 🎯 Quick Start (Windows)

### Option 1: Use Separate Terminals (Recommended)

**Terminal 1 - Backend:**
```powershell
cd "D:\My Projects\HackPrinceton2025\GenLab\backend"
python -m uvicorn main:app --reload --port 8000
```

**Terminal 2 - Frontend:**
```powershell
cd "D:\My Projects\HackPrinceton2025\GenLab\frontend"
npm run dev
```

**Terminal 3 - ElevenLabs Server (Optional):**
```powershell
cd "D:\My Projects\HackPrinceton2025\GenLab"
npm start
```

### Option 2: Use the Batch Scripts

**Terminal 1 - Backend:**
```powershell
cd "D:\My Projects\HackPrinceton2025\GenLab\backend"
.\start_backend.bat
```

**Terminal 2 - Frontend:**
```powershell
cd "D:\My Projects\HackPrinceton2025\GenLab\frontend"
npm run dev
```

## 🎯 Quick Start (Mac/Linux)

**Terminal 1 - Backend:**
```bash
cd GenLab/backend
python3 -m uvicorn main:app --reload --port 8000
# OR use the script:
# bash run.sh
```

**Terminal 2 - Frontend:**
```bash
cd GenLab/frontend
npm run dev
```

## ✅ Verify Everything is Working

### 1. Check Backend (Port 8000)
Open in browser: **http://localhost:8000/docs**

You should see the FastAPI Swagger documentation page.

### 2. Check Frontend (Port 3000)
Open in browser: **http://localhost:3000**

You should see the React application.

### 3. Test API Connection
The frontend is configured to proxy `/api` requests to the backend. You can test this by:
- Opening browser DevTools (F12)
- Going to Network tab
- Making a request in the frontend
- Checking that API calls go to `http://localhost:8000`

## 🔧 Configuration

### Backend Configuration
- **Port:** 8000
- **CORS:** Configured to allow requests from:
  - http://localhost:3000
  - http://localhost:5173 (Vite default)
  - http://localhost:5174
  - http://localhost:8080

### Frontend Configuration
- **Port:** 3000
- **Proxy:** `/api` requests are proxied to `http://localhost:8000`
- **Direct API calls:** Some components call `http://localhost:8000` directly

### ElevenLabs Server (Optional)
- **Port:** 3002
- **Purpose:** Handles ElevenLabs voice assistant API
- **Required:** Only if using voice features

## 🐛 Troubleshooting

### Backend won't start
1. Check if port 8000 is already in use:
   ```powershell
   netstat -ano | findstr :8000
   ```
2. Make sure all dependencies are installed:
   ```bash
   pip install -r requirements.txt
   ```

### Frontend won't start
1. Check if port 3000 is already in use:
   ```powershell
   netstat -ano | findstr :3000
   ```
2. Make sure node_modules are installed:
   ```bash
   npm install
   ```

### Frontend can't connect to backend
1. Verify backend is running on port 8000
2. Check browser console for CORS errors
3. Verify CORS settings in `backend/main.py` include your frontend port
4. Check that the proxy is configured correctly in `frontend/vite.config.js`

### API calls return 404
- Make sure you're using the correct endpoint paths
- Check the backend API docs at http://localhost:8000/docs
- Verify the proxy rewrite rule in `vite.config.js` is correct

## 📝 Expected Output

### Backend Terminal:
```
INFO:     Uvicorn running on http://127.0.0.1:8000 (Press CTRL+C to quit)
INFO:     Started reloader process
INFO:     Started server process
INFO:     Waiting for application startup.
INFO:     Application startup complete.
```

### Frontend Terminal:
```
  VITE v5.0.8  ready in 500 ms

  ➜  Local:   http://localhost:3000/
  ➜  Network: use --host to expose
  ➜  press h + enter to show help
```

## 🎉 You're All Set!

Once both servers are running:
- **Backend API:** http://localhost:8000/docs
- **Frontend App:** http://localhost:3000
- **ElevenLabs Server:** http://localhost:3002 (if running)

The frontend will automatically connect to the backend API!


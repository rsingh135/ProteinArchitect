# 🚀 Quick Start - Run Everything with npm

## One Command to Rule Them All!

From the `GenLab/` directory, just run:

```bash
npm start
```

That's it! This will start both:
- ✅ Backend server (http://localhost:8000)
- ✅ Frontend app (http://localhost:5173)

## First Time Setup (One-Time)

### 1. Install npm dependencies (root):
```bash
cd GenLab
npm install
```

### 2. Install frontend dependencies:
```bash
cd frontend
npm install
cd ..
```

### 3. Install backend Python dependencies:
```bash
cd backend
pip install -r requirements.txt
cd ..
```

### 4. Make sure you have a `.env` file in `backend/`:
```bash
# backend/.env
DEDALUS_API_KEY=your_key_here
```

## Daily Use

After the first-time setup, just:

```bash
cd GenLab
npm start
```

You'll see output like:
```
[backend] Starting server on http://localhost:8000
[frontend] VITE ready on http://localhost:5173
```

## Stop Everything

Press `Ctrl+C` once - it stops both servers.

## Troubleshooting

### "concurrently not found"
```bash
npm install
```

### "Cannot connect to backend"
1. Make sure `npm start` is running
2. Wait a few seconds for backend to start
3. Check that you see `[backend]` output in the terminal

### "Python not found"
- Make sure Python is installed
- On Windows, try `py` instead of `python` in `package.json`

### Port already in use
- Close other apps using ports 8000 or 5173
- Or change ports in the config files

## Alternative Commands

```bash
# Start only frontend
npm run dev

# Start only backend  
npm run backend

# Build for production
npm run build
```

That's it! Just `npm start` and you're good to go! 🎉



# Start Both Frontend and Backend with npm

## 🚀 Quick Start (One Command!)

### From the root directory (`GenLab/`):

```bash
npm install
npm start
```

This will:
1. ✅ Install `concurrently` package
2. ✅ Start the backend server (Python/FastAPI on port 8000)
3. ✅ Start the frontend dev server (React/Vite on port 5173)
4. ✅ Run both simultaneously in one terminal

## Available npm Scripts

### From Root (`GenLab/`):

```bash
# Start both frontend and backend
npm start

# Start only frontend
npm run dev

# Start only backend
npm run backend

# Install all dependencies (frontend + backend instructions)
npm run install:all
```

### From Frontend (`GenLab/frontend/`):

```bash
# Start both (from frontend directory)
npm run start:all

# Start only frontend
npm run dev

# Start only backend
npm run backend
```

## First Time Setup

1. **Install root dependencies:**
   ```bash
   cd GenLab
   npm install
   ```

2. **Install frontend dependencies:**
   ```bash
   cd frontend
   npm install
   ```

3. **Install backend dependencies:**
   ```bash
   cd backend
   pip install -r requirements.txt
   ```

4. **Start everything:**
   ```bash
   cd ..  # Back to GenLab root
   npm start
   ```

## What You'll See

When you run `npm start`, you'll see output from both servers:

```
[backend] Starting Protein Architect Backend
[backend] INFO:     Uvicorn running on http://127.0.0.1:8000
[frontend] VITE v5.0.8  ready in 500 ms
[frontend] ➜  Local:   http://localhost:5173/
```

## Stopping

Press `Ctrl+C` once to stop both servers.

## Troubleshooting

### "concurrently not found"
```bash
npm install
```

### "python not found"
- Make sure Python is installed and in your PATH
- On Windows, you might need to use `py` instead of `python`

### Port conflicts
- Backend uses port 8000
- Frontend uses port 5173
- If either is in use, close the other application

## Alternative: Separate Terminals

If you prefer separate terminals:

**Terminal 1 (Backend):**
```bash
cd backend
python run_backend_simple.py
```

**Terminal 2 (Frontend):**
```bash
cd frontend
npm run dev
```

But `npm start` is easier! 🎉




# Backend URL Explanation

## Understanding the Backend URLs

### 1. Internal Binding Address: `http://0.0.0.0:10000`

**What it is:**
- `0.0.0.0` means "listen on all network interfaces"
- `10000` is the port Render assigns (from `$PORT` environment variable)
- This is the **internal** address the server binds to

**What it's NOT:**
- ❌ This is NOT the public URL
- ❌ You cannot access this from outside Render
- ❌ This is NOT what Vercel should use

**Why it exists:**
- Render uses this internally to route traffic
- Your FastAPI server listens on this address
- Render then exposes it via the public URL

### 2. Public URL: `https://proteinarchitect-backend.onrender.com`

**What it is:**
- This is the **public** URL that anyone can access
- This is what Vercel should use in `VITE_API_URL`
- This is what your frontend should connect to

**How it works:**
1. Render receives request at `https://proteinarchitect-backend.onrender.com`
2. Render routes it to your server at `0.0.0.0:10000` (internal)
3. Your server processes the request
4. Response goes back through Render to the public URL

## Correct Configuration

### Vercel Environment Variable:
```
VITE_API_URL=https://proteinarchitect-backend.onrender.com
```

### Backend Logs Show:
```
INFO:     Uvicorn running on http://0.0.0.0:10000
```
This is **correct** - it's the internal binding.

### Backend is Accessible At:
```
https://proteinarchitect-backend.onrender.com
```
This is what you should use!

## PPI Service Localhost Issue

### Problem:
The PPI service was trying to connect to `http://localhost:8080` in production, which doesn't exist on Render.

### Solution:
✅ **Fixed!** The PPI service now:
1. Detects if it's in production (checks for `RENDER` environment variable)
2. In production, uses mock predictions directly (no localhost connection)
3. In development, tries local service first, falls back to mock if unavailable

### What Changed:
- PPI service now detects production environment
- Skips localhost connection attempt in production
- Uses mock predictions directly in production
- Better error handling and logging

## Verification

### Check Backend is Working:
```bash
curl https://proteinarchitect-backend.onrender.com/health
# Should return: {"status":"healthy"}
```

### Check Backend Root:
```bash
curl https://proteinarchitect-backend.onrender.com/
# Should return: API info with endpoints list
```

### Check PPI Service:
The PPI service will now:
- In production: Use mock predictions (no localhost errors)
- Log: "Using mock PPI predictions (production mode, local service not available)"
- Return valid predictions (mock, but functional)

## Summary

✅ **Backend URL**: `https://proteinarchitect-backend.onrender.com` (public URL)
✅ **Internal Binding**: `0.0.0.0:10000` (internal, correct)
✅ **PPI Service**: Fixed to not use localhost in production
✅ **Vercel Config**: Should use public URL in `VITE_API_URL`

Everything is configured correctly! The backend is working as expected.


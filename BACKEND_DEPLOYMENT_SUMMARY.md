# ✅ Backend Deployment - Complete Solution

## What We Fixed

✅ **Backend CORS** - Now accepts requests from Vercel (allows all origins in production)
✅ **Frontend API URL** - Uses `VITE_API_URL` environment variable
✅ **Centralized API Config** - Created `frontend/src/config/api.js`
✅ **Updated Components** - SearchBar and PPIPrediction use API config
✅ **Better Error Messages** - Dynamic based on environment

## Quick Deployment (15 minutes)

### Step 1: Deploy Backend to Render

1. Go to https://render.com
2. Sign up/login with GitHub
3. "New +" → "Web Service"
4. Connect your repo
5. Configure:
   - **Name**: `genlab-backend`
   - **Environment**: `Python 3`
   - **Build Command**: `cd backend && pip install -r requirements.txt`
   - **Start Command**: `cd backend && uvicorn main:app --host 0.0.0.0 --port $PORT`
6. Add environment variables:
   - `GEMINI_API_KEY`
   - `DEDALUS_API_KEY`
   - `OPENAI_API_KEY` (optional)
   - `FRONTEND_URL` = `https://your-vercel-app.vercel.app`
   - `ENVIRONMENT` = `production`
   - `USE_LOCAL_PPI` = `true`
7. Deploy and get URL: `https://genlab-backend.onrender.com`

### Step 2: Update Vercel

1. Vercel Dashboard → Settings → Environment Variables
2. Add: `VITE_API_URL` = `https://genlab-backend.onrender.com`
3. Redeploy frontend

### Step 3: Test

Visit your Vercel site and try the research feature!

## Important: Render Timeout Issue

⚠️ **Render free tier has 30-second timeout**
- Research takes 2-5 minutes
- Will timeout on Render free tier

### Solution: Use Railway Instead

**Railway has no timeout limits:**

1. Go to https://railway.app
2. Sign up with GitHub
3. "New Project" → "Deploy from GitHub repo"
4. Set start command: `cd backend && uvicorn main:app --host 0.0.0.0 --port $PORT`
5. Add environment variables
6. Get URL and update Vercel

**Railway is better for long-running requests like research!**

## Files Changed

- ✅ `backend/main.py` - Updated CORS (allows all origins in production)
- ✅ `frontend/src/config/api.js` - New centralized API config
- ✅ `frontend/src/components/layout/SearchBar.jsx` - Uses API config
- ✅ `frontend/src/components/PPIPrediction.jsx` - Uses API config
- ✅ `render.yaml` - Render configuration (optional)

## Environment Variables

### Render/Railway (Backend):
- `GEMINI_API_KEY`
- `DEDALUS_API_KEY`
- `OPENAI_API_KEY` (optional)
- `FRONTEND_URL` (your Vercel URL)
- `ENVIRONMENT` = `production`
- `USE_LOCAL_PPI` = `true`

### Vercel (Frontend):
- `VITE_API_URL` = `https://your-backend.onrender.com`

## Testing Checklist

- [ ] Backend deployed and running
- [ ] Environment variables set
- [ ] Frontend `VITE_API_URL` set
- [ ] Research feature works
- [ ] No CORS errors
- [ ] PPI prediction works

## Cost

- **Render**: Free (750 hours/month) - ⚠️ 30s timeout
- **Railway**: Free ($5 credit/month) - ✅ No timeout
- **Total**: $0/month

## Recommendation

**Use Railway for backend** - No timeout limits, perfect for research feature that takes 2-5 minutes!

Good luck! 🚀


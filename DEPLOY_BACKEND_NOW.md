# 🚀 Deploy Backend NOW (Quick Guide)

## What We Fixed

✅ **Backend CORS** - Now accepts requests from Vercel domains
✅ **Frontend API URL** - Uses environment variable (`VITE_API_URL`)
✅ **Centralized API config** - All API calls use shared config
✅ **Better error messages** - Dynamic error messages based on environment

## Quick Deployment Steps

### Option 1: Render (Easiest - 15 minutes)

1. **Go to Render:**
   - https://render.com
   - Sign up/login with GitHub

2. **Create Web Service:**
   - Click "New +" → "Web Service"
   - Connect your GitHub repo
   - Select your repo

3. **Configure:**
   - **Name**: `genlab-backend`
   - **Environment**: `Python 3`
   - **Build Command**: `cd backend && pip install -r requirements.txt`
   - **Start Command**: `cd backend && uvicorn main:app --host 0.0.0.0 --port $PORT`
   - **Root Directory**: Leave empty

4. **Add Environment Variables:**
   - `GEMINI_API_KEY` = (your key)
   - `DEDALUS_API_KEY` = (your key)
   - `OPENAI_API_KEY` = (your key, optional)
   - `FRONTEND_URL` = `https://your-vercel-app.vercel.app`
   - `ENVIRONMENT` = `production`
   - `USE_LOCAL_PPI` = `true`

5. **Deploy:**
   - Click "Create Web Service"
   - Wait 5-10 minutes
   - Get your URL: `https://genlab-backend.onrender.com`

6. **Update Vercel:**
   - Go to Vercel Dashboard → Your Project → Settings → Environment Variables
   - Add: `VITE_API_URL` = `https://genlab-backend.onrender.com`
   - Redeploy frontend

### Option 2: Railway (Even Faster - 10 minutes)

1. **Go to Railway:**
   - https://railway.app
   - Sign up with GitHub

2. **Deploy:**
   - "New Project" → "Deploy from GitHub repo"
   - Select your repo
   - Railway auto-detects Python

3. **Configure:**
   - Set start command: `cd backend && uvicorn main:app --host 0.0.0.0 --port $PORT`
   - Add environment variables (same as above)
   - Get your URL: `https://your-app.railway.app`

4. **Update Vercel:**
   - Set `VITE_API_URL` = your Railway URL
   - Redeploy frontend

## What Changed in Code

### Backend (`backend/main.py`)
- ✅ Updated CORS to accept Vercel domains
- ✅ Reads `FRONTEND_URL` from environment
- ✅ Allows all `*.vercel.app` domains in production

### Frontend
- ✅ Created `frontend/src/config/api.js` - Centralized API config
- ✅ Updated `SearchBar.jsx` - Uses environment variable
- ✅ Updated `PPIPrediction.jsx` - Uses environment variable
- ✅ Better error messages

## Environment Variables Needed

### Render/Railway (Backend):
- `GEMINI_API_KEY`
- `DEDALUS_API_KEY`
- `OPENAI_API_KEY` (optional)
- `FRONTEND_URL` (your Vercel URL)
- `ENVIRONMENT` = `production`
- `USE_LOCAL_PPI` = `true`

### Vercel (Frontend):
- `VITE_API_URL` = `https://your-backend.onrender.com` (or Railway URL)

## Testing

After deployment:
1. Visit your Vercel site
2. Try research feature
3. Should work! ✅

## Troubleshooting

### CORS errors?
- Check that `FRONTEND_URL` is set in backend
- Verify your Vercel URL is correct
- Check browser console for actual error

### Backend not responding?
- Check Render/Railway logs
- Verify environment variables are set
- Check start command is correct

### Research times out?
- Render free tier has 30-second timeout for requests
- Research takes 2-5 minutes
- Consider Railway (no timeout) or upgrade Render

## Files Changed

- ✅ `backend/main.py` - Updated CORS
- ✅ `frontend/src/config/api.js` - New API config file
- ✅ `frontend/src/components/layout/SearchBar.jsx` - Uses API config
- ✅ `frontend/src/components/PPIPrediction.jsx` - Uses API config
- ✅ `render.yaml` - Render configuration (optional)

## Next Steps

1. **Deploy backend** (Render or Railway)
2. **Set environment variables** in backend
3. **Get backend URL**
4. **Set `VITE_API_URL` in Vercel**
5. **Redeploy frontend**
6. **Test research feature**

Good luck! 🚀


# 🚀 Simple Backend Deployment for Vercel

## The Problem

Your frontend is on Vercel, but the backend (FastAPI) can't run on Vercel. You need to deploy it separately.

## Solution: Deploy Backend to Render (15 minutes)

### Step 1: Deploy Backend to Render

1. **Go to Render:**
   - https://render.com
   - Sign up/login with GitHub

2. **Create Web Service:**
   - Click "New +" → "Web Service"
   - Connect your GitHub repo
   - Select your repo

3. **Settings:**
   - **Name**: `genlab-backend`
   - **Environment**: `Python 3`
   - **Build Command**: `cd backend && pip install -r requirements.txt`
   - **Start Command**: `cd backend && uvicorn main:app --host 0.0.0.0 --port $PORT`
   - **Root Directory**: Leave empty

4. **Environment Variables:**
   Add these in Render:
   - `GEMINI_API_KEY` = (your key)
   - `DEDALUS_API_KEY` = (your key)
   - `OPENAI_API_KEY` = (your key, optional)
   - `FRONTEND_URL` = `https://your-vercel-app.vercel.app` (your actual Vercel URL)
   - `ENVIRONMENT` = `production`
   - `USE_LOCAL_PPI` = `true`

5. **Deploy:**
   - Click "Create Web Service"
   - Wait 5-10 minutes
   - Get your backend URL: `https://genlab-backend.onrender.com`

### Step 2: Update Vercel

1. **Go to Vercel Dashboard:**
   - Your project → Settings → Environment Variables

2. **Add:**
   - **Key**: `VITE_API_URL`
   - **Value**: `https://genlab-backend.onrender.com` (your Render URL)
   - **Environment**: Production, Preview, Development (all)

3. **Redeploy:**
   - Go to Deployments
   - Click "Redeploy" on latest deployment

### Step 3: Test

1. Visit your Vercel site
2. Try research feature
3. Should work! ✅

## What We Fixed

✅ **Backend CORS** - Accepts requests from Vercel
✅ **Frontend API URL** - Uses environment variable
✅ **Centralized config** - All API calls use shared config
✅ **Better errors** - Dynamic error messages

## Important Notes

### Render Free Tier Limitations:
- ✅ 750 hours/month (enough for hackathon)
- ⚠️ 30-second timeout for requests (research takes 2-5 minutes)
- **Solution**: Use Railway instead (no timeout) or upgrade Render

### Railway Alternative (No Timeout):

1. Go to https://railway.app
2. Sign up with GitHub
3. "New Project" → "Deploy from GitHub repo"
4. Set start command: `cd backend && uvicorn main:app --host 0.0.0.0 --port $PORT`
5. Add environment variables
6. Get URL and update Vercel

## Troubleshooting

### CORS errors?
- Make sure `FRONTEND_URL` is set in Render
- Check your Vercel URL is correct
- Backend allows all origins in production (for flexibility)

### Research times out?
- Render free tier has 30-second timeout
- Research takes 2-5 minutes
- **Use Railway instead** (no timeout) or upgrade Render

### Backend not responding?
- Check Render logs
- Verify environment variables
- Check start command

## Quick Checklist

- [ ] Deploy backend to Render/Railway
- [ ] Set environment variables
- [ ] Get backend URL
- [ ] Set `VITE_API_URL` in Vercel
- [ ] Redeploy frontend
- [ ] Test research feature

## Cost

- **Render**: Free (750 hours/month)
- **Railway**: Free ($5 credit/month)
- **Total**: $0/month ✅

Good luck! 🚀


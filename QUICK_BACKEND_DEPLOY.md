# 🚀 Quick Backend Deployment Guide

## Problem
Your frontend is on Vercel, but backend calls `localhost:8000` which doesn't work in production.

## Solution: Deploy Backend to Render (15 minutes)

### Step 1: Update Backend CORS ✅
Already done! The backend now accepts requests from Vercel domains.

### Step 2: Update Frontend API URL ✅
Already done! Frontend now uses `VITE_API_URL` environment variable.

### Step 3: Deploy Backend to Render

1. **Go to Render:**
   - Visit: https://render.com
   - Sign up/login with GitHub

2. **Create New Web Service:**
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Select your repo

3. **Configure Service:**
   - **Name**: `genlab-backend`
   - **Region**: `Oregon` (or closest to you)
   - **Branch**: `main`
   - **Root Directory**: Leave empty (or `backend/` if that doesn't work)
   - **Environment**: `Python 3`
   - **Build Command**: `cd backend && pip install -r requirements.txt`
   - **Start Command**: `cd backend && uvicorn main:app --host 0.0.0.0 --port $PORT`

4. **Add Environment Variables:**
   Click "Advanced" → "Add Environment Variable":
   - `GEMINI_API_KEY` = (your key)
   - `DEDALUS_API_KEY` = (your key)
   - `OPENAI_API_KEY` = (your key, optional)
   - `FRONTEND_URL` = `https://your-vercel-app.vercel.app` (your Vercel URL)
   - `USE_LOCAL_PPI` = `true`
   - `ENVIRONMENT` = `production`
   - Add any other keys from your `.env` file

5. **Deploy:**
   - Click "Create Web Service"
   - Wait for deployment (5-10 minutes)
   - Get your backend URL: `https://genlab-backend.onrender.com`

### Step 4: Update Vercel Environment Variables

1. **Go to Vercel Dashboard:**
   - Select your project
   - Go to "Settings" → "Environment Variables"

2. **Add Environment Variable:**
   - **Key**: `VITE_API_URL`
   - **Value**: `https://genlab-backend.onrender.com` (your Render URL)
   - **Environment**: Production, Preview, Development (select all)

3. **Redeploy Frontend:**
   - Go to "Deployments"
   - Click "Redeploy" on latest deployment
   - Or push a new commit to trigger deployment

### Step 5: Test

1. Visit your Vercel site
2. Try the research feature
3. Should now work! ✅

---

## Alternative: Railway (Even Easier)

1. Go to https://railway.app
2. Sign up with GitHub
3. "New Project" → "Deploy from GitHub repo"
4. Select your repo
5. Railway auto-detects Python
6. Set start command: `cd backend && uvicorn main:app --host 0.0.0.0 --port $PORT`
7. Add environment variables
8. Get URL and update Vercel

---

## Troubleshooting

### Backend not responding?
- Check Render logs
- Verify environment variables are set
- Check that start command is correct

### CORS errors?
- Verify `FRONTEND_URL` is set in Render
- Check that your Vercel URL is in allowed origins
- Check browser console for actual error

### Research feature times out?
- Render free tier has timeout limits
- Research may take 2-5 minutes
- Consider upgrading to paid tier or using Railway

---

## Cost

- **Render Free Tier**: 750 hours/month (enough for hackathon)
- **Railway Free Tier**: $5 credit/month (enough for hackathon)
- **Total**: $0/month ✅

---

## Quick Checklist

- [ ] Deploy backend to Render/Railway
- [ ] Set environment variables in Render
- [ ] Get backend URL
- [ ] Set `VITE_API_URL` in Vercel
- [ ] Redeploy frontend
- [ ] Test research feature

Good luck! 🚀


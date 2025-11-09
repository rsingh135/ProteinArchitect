# 🚀 Quick Render Deployment (Free Backend)

Since Railway credits ran out, use **Render** - it's FREE and works the same way!

## ⚡ 5-Minute Setup

### Step 1: Deploy to Render

1. **Go to**: https://render.com
2. **Sign up** with GitHub (free)
3. **Click "New +" → "Web Service"**
4. **Connect your GitHub repo**
5. **Configure**:
   - **Name**: `genlab-backend` (or whatever you want)
   - **Environment**: `Python 3`
   - **Build Command**: `cd backend && pip install -r requirements.txt`
   - **Start Command**: `cd backend && uvicorn main:app --host 0.0.0.0 --port $PORT`
   - **Root Directory**: Leave empty
6. **Click "Create Web Service"**

### Step 2: Add Environment Variables

In Render dashboard, go to **Environment** tab and add:

```
GEMINI_API_KEY=your_key_here
OPENAI_API_KEY=your_key_here
DEDALUS_API_KEY=your_key_here
FRONTEND_URL=https://your-vercel-app.vercel.app
```

(Add all variables from your `.env` file)

### Step 3: Deploy

1. **Click "Save Changes"**
2. **Render will automatically deploy**
3. **Wait 2-3 minutes** for deployment
4. **Get your URL**: `https://genlab-backend.onrender.com` (or similar)

### Step 4: Update Frontend

1. **Go to Vercel Dashboard**
2. **Your project** → **Settings** → **Environment Variables**
3. **Add**: `VITE_API_URL` = `https://genlab-backend.onrender.com`
4. **Redeploy** your frontend

### Step 5: Update Backend CORS (if needed)

Make sure `backend/main.py` allows your Vercel domain. It should already be configured to allow all origins in production, but verify:

```python
# Check that this is in main.py:
FRONTEND_URL = os.getenv("FRONTEND_URL")
VERCEL_URL = os.getenv("VERCEL_URL")

if FRONTEND_URL:
    allowed_origins = [FRONTEND_URL]
elif VERCEL_URL:
    allowed_origins = [f"https://{VERCEL_URL}"]
else:
    # Production: allow all origins
    allowed_origins = ["*"]
```

## ✅ Done!

Your backend is now live on Render (FREE!)

**Test it**:
- Backend: `https://genlab-backend.onrender.com/health`
- Frontend: Should now work with research feature!

## ⚠️ Important Notes

### Render Free Tier Limitations:
- **Apps sleep after 15 minutes** of inactivity
- **First request after sleep takes ~30 seconds** (cold start)
- **Solution**: Use a ping service to keep it awake:
  - https://cron-job.org (free)
  - Set it to ping your app every 14 minutes

### Or Upgrade (Optional):
- **$7/month** = Always-on (no sleeping)
- Only if you need 24/7 availability

## 🐛 Troubleshooting

### App won't start:
- Check **Logs** in Render dashboard
- Verify **Build Command** is correct
- Make sure `requirements.txt` is in `backend/` directory

### CORS errors:
- Verify `FRONTEND_URL` is set in Render
- Check backend logs for CORS errors
- Make sure Vercel `VITE_API_URL` matches Render URL

### Environment variables not working:
- Make sure you **saved** them in Render dashboard
- **Redeploy** after adding variables
- Check variable names match your code

## 📊 Comparison: Render vs Railway

| Feature | Render | Railway |
|---------|--------|---------|
| **Free Tier** | 750 hrs/month | $5 credit/month |
| **Credit Card** | Not required | Not required |
| **Setup** | Easy | Easy |
| **Sleep** | After 15 min | No sleep |
| **Best For** | Free tier | Paid tier |

**Render is perfect for free deployment!** 🎉

---

## 🎯 Quick Checklist

- [ ] Deploy backend to Render
- [ ] Add environment variables
- [ ] Get Render URL
- [ ] Update Vercel `VITE_API_URL`
- [ ] Test research feature
- [ ] Set up ping service (optional, to prevent sleeping)

**That's it!** Your backend is now free on Render! 🚀


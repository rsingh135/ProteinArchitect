# Free Backend Deployment Alternatives

Since you ran out of Railway credits, here are the **best FREE alternatives** for deploying your FastAPI backend:

## 🥇 Option 1: Render (RECOMMENDED - Easiest)

**Why Render:**
- ✅ **Free tier**: 750 hours/month (enough for 24/7)
- ✅ **Similar to Railway**: Easy setup, auto-deploy from GitHub
- ✅ **No credit card required** (for free tier)
- ✅ **Automatic HTTPS**
- ✅ **Handles long-running requests** (research feature works)

**Steps:**

1. **Go to Render**: https://render.com
2. **Sign up** with GitHub (free)
3. **Click "New +" → "Web Service"**
4. **Connect your GitHub repo**
5. **Configure**:
   - **Name**: `genlab-backend`
   - **Environment**: `Python 3`
   - **Build Command**: `cd backend && pip install -r requirements.txt`
   - **Start Command**: `cd backend && uvicorn main:app --host 0.0.0.0 --port $PORT`
   - **Root Directory**: Leave empty
6. **Add Environment Variables**:
   - `GEMINI_API_KEY`
   - `OPENAI_API_KEY`
   - `DEDALUS_API_KEY`
   - `FRONTEND_URL` = `https://your-vercel-app.vercel.app`
   - Any others from your `.env`
7. **Deploy!**

**Get your URL**: `https://genlab-backend.onrender.com` (or similar)

**Update Frontend**: Set `VITE_API_URL` in Vercel to your Render URL

**Time**: 10-15 minutes  
**Cost**: **FREE** (750 hours/month)

---

## 🥈 Option 2: Fly.io (Good Performance)

**Why Fly.io:**
- ✅ **Free tier**: 3 shared VMs, 160GB outbound data
- ✅ **Global edge deployment** (fast worldwide)
- ✅ **Good performance**
- ⚠️ **Requires credit card** (but free tier is truly free)

**Steps:**

1. **Install Fly CLI**:
   ```bash
   curl -L https://fly.io/install.sh | sh
   ```

2. **Login**:
   ```bash
   fly auth login
   ```

3. **Create `fly.toml`** in your `backend/` directory:
   ```toml
   app = "genlab-backend"
   primary_region = "iad"

   [build]

   [http_service]
     internal_port = 8000
     force_https = true
     auto_stop_machines = true
     auto_start_machines = true
     min_machines_running = 0
     processes = ["app"]

   [[services]]
     protocol = "tcp"
     internal_port = 8000
     processes = ["app"]

     [[services.ports]]
       port = 80
       handlers = ["http"]
       force_https = true

     [[services.ports]]
       port = 443
       handlers = ["tls", "http"]
   ```

4. **Create `Dockerfile`** in `backend/`:
   ```dockerfile
   FROM python:3.11-slim

   WORKDIR /app

   COPY requirements.txt .
   RUN pip install --no-cache-dir -r requirements.txt

   COPY . .

   CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
   ```

5. **Deploy**:
   ```bash
   cd backend
   fly launch
   # Follow prompts
   fly deploy
   ```

6. **Set environment variables**:
   ```bash
   fly secrets set GEMINI_API_KEY=your_key
   fly secrets set OPENAI_API_KEY=your_key
   # etc.
   ```

**Time**: 20-30 minutes  
**Cost**: **FREE** (with limits)

---

## 🥉 Option 3: PythonAnywhere (Simplest, But Limited)

**Why PythonAnywhere:**
- ✅ **Free tier available**
- ✅ **No credit card required**
- ✅ **Very simple setup**
- ⚠️ **Limited**: Can't install all packages, slower
- ⚠️ **Not ideal for production**

**Steps:**

1. **Go to**: https://www.pythonanywhere.com
2. **Sign up** (free account)
3. **Upload your backend code**
4. **Install dependencies** (limited on free tier)
5. **Configure web app**
6. **Set environment variables**

**Time**: 30-45 minutes  
**Cost**: **FREE** (very limited)

---

## 🏅 Option 4: Koyeb (New, Good Free Tier)

**Why Koyeb:**
- ✅ **Free tier**: Always-on apps
- ✅ **No credit card required**
- ✅ **Auto-deploy from GitHub**
- ✅ **Good performance**

**Steps:**

1. **Go to**: https://www.koyeb.com
2. **Sign up** with GitHub
3. **Click "Create App"**
4. **Connect GitHub repo**
5. **Configure**:
   - **Build**: `cd backend && pip install -r requirements.txt`
   - **Run**: `cd backend && uvicorn main:app --host 0.0.0.0 --port 8000`
6. **Add environment variables**
7. **Deploy**

**Time**: 15-20 minutes  
**Cost**: **FREE**

---

## 🏅 Option 5: Google Cloud Run (Very Reliable)

**Why Cloud Run:**
- ✅ **Free tier**: 2 million requests/month
- ✅ **Very reliable**
- ✅ **Scales to zero** (only pay when in use)
- ⚠️ **Requires credit card** (but free tier is generous)

**Steps:**

1. **Install Google Cloud SDK**
2. **Create project** in Google Cloud Console
3. **Create `Dockerfile`** (same as Fly.io)
4. **Build and deploy**:
   ```bash
   gcloud builds submit --tag gcr.io/YOUR_PROJECT/genlab-backend
   gcloud run deploy --image gcr.io/YOUR_PROJECT/genlab-backend
   ```
5. **Set environment variables** in Cloud Console

**Time**: 30-40 minutes  
**Cost**: **FREE** (2M requests/month)

---

## 🎯 Recommended: Render (Option 1)

**Why Render is best:**
1. ✅ **Easiest setup** (similar to Railway)
2. ✅ **No credit card required**
3. ✅ **750 hours/month free** (enough for 24/7)
4. ✅ **Auto-deploy from GitHub**
5. ✅ **Handles long requests** (research feature)

---

## Quick Render Setup (5 Minutes)

### Step 1: Create `render.yaml` (Optional)

Create `render.yaml` in your **root directory**:

```yaml
services:
  - type: web
    name: genlab-backend
    env: python
    buildCommand: cd backend && pip install -r requirements.txt
    startCommand: cd backend && uvicorn main:app --host 0.0.0.0 --port $PORT
    envVars:
      - key: GEMINI_API_KEY
        sync: false
      - key: OPENAI_API_KEY
        sync: false
      - key: DEDALUS_API_KEY
        sync: false
      - key: FRONTEND_URL
        value: https://your-vercel-app.vercel.app
```

### Step 2: Deploy on Render

1. Go to https://render.com
2. Sign up with GitHub
3. "New +" → "Web Service"
4. Connect repo
5. Render will auto-detect `render.yaml` OR manually set:
   - **Build**: `cd backend && pip install -r requirements.txt`
   - **Start**: `cd backend && uvicorn main:app --host 0.0.0.0 --port $PORT`
6. Add environment variables
7. Deploy!

### Step 3: Update Frontend

In **Vercel Dashboard**:
1. Go to your project
2. **Settings** → **Environment Variables**
3. Add: `VITE_API_URL` = `https://your-app.onrender.com`
4. **Redeploy**

### Step 4: Update Backend CORS

Make sure `backend/main.py` allows your Vercel domain:

```python
# In main.py CORS configuration
allow_origins=[
    "http://localhost:3000",
    "http://localhost:5173",
    os.getenv("FRONTEND_URL", ""),
    "https://your-vercel-app.vercel.app",  # Your actual Vercel URL
]
```

---

## Comparison Table

| Service | Free Tier | Credit Card | Setup Time | Best For |
|---------|-----------|-------------|------------|----------|
| **Render** | 750 hrs/month | ❌ No | 10 min | **Easiest** |
| **Fly.io** | 3 VMs, 160GB | ✅ Yes | 20 min | Performance |
| **Koyeb** | Always-on | ❌ No | 15 min | Simplicity |
| **Cloud Run** | 2M requests | ✅ Yes | 30 min | Scale |
| **PythonAnywhere** | Limited | ❌ No | 30 min | Learning |

---

## Troubleshooting

### Render: App sleeping
- **Free tier apps sleep after 15 min of inactivity**
- **Solution**: Use a service like https://cron-job.org to ping your app every 14 minutes
- **Or**: Upgrade to paid plan ($7/month)

### Fly.io: Deployment errors
- Check your `Dockerfile` is correct
- Make sure `fly.toml` has correct port (8000)
- Check logs: `fly logs`

### CORS errors
- Make sure backend CORS allows your Vercel domain
- Check `FRONTEND_URL` environment variable is set
- Verify `VITE_API_URL` in Vercel matches your backend URL

---

## Next Steps

1. **Choose Render** (easiest)
2. **Deploy backend** (10 minutes)
3. **Update frontend** with Render URL
4. **Test research feature**
5. **Done!** 🎉

Good luck! 🚀


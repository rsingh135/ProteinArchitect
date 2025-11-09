# Backend Deployment Options for Vercel Frontend

## Problem
- ✅ Frontend is on Vercel
- ❌ Backend (FastAPI) is hardcoded to `localhost:8000`
- ❌ Vercel can't run long-running Python backends
- ❌ Research feature fails because backend isn't accessible

## Solution Options (Ranked by Ease)

### Option 1: Deploy Backend to Render (EASIEST - Recommended)

**Why Render:**
- ✅ Free tier available
- ✅ Easy Python/FastAPI deployment
- ✅ Automatic HTTPS
- ✅ Environment variable management
- ✅ Auto-deploys from GitHub

**Steps:**

1. **Prepare Backend:**
   - Make sure `requirements.txt` is up to date
   - Add `render.yaml` or use web interface
   - Update CORS in `main.py` to allow Vercel domain

2. **Deploy to Render:**
   - Go to https://render.com
   - Sign up/login with GitHub
   - Click "New +" → "Web Service"
   - Connect your GitHub repo
   - Settings:
     - **Name**: `genlab-backend`
     - **Environment**: `Python 3`
     - **Build Command**: `cd backend && pip install -r requirements.txt`
     - **Start Command**: `cd backend && uvicorn main:app --host 0.0.0.0 --port $PORT`
     - **Root Directory**: Leave empty (or `backend/` if that doesn't work)

3. **Environment Variables on Render:**
   - Add all your `.env` variables:
     - `GEMINI_API_KEY`
     - `DEDALUS_API_KEY`
     - `OPENAI_API_KEY`
     - `AWS_ACCESS_KEY_ID` (if needed)
     - `AWS_SECRET_ACCESS_KEY` (if needed)
     - etc.

4. **Update Frontend:**
   - Use environment variable for API URL
   - Update `SearchBar.jsx` to use `import.meta.env.VITE_API_URL`
   - Set `VITE_API_URL` in Vercel environment variables

5. **Update Backend CORS:**
   - Add your Vercel domain to allowed origins

**Time**: 15-30 minutes
**Cost**: Free (on free tier)

---

### Option 2: Deploy Backend to Railway (Also Easy)

**Why Railway:**
- ✅ Very simple deployment
- ✅ Free $5 credit monthly
- ✅ Great for hackathons

**Steps:**

1. Go to https://railway.app
2. Sign up with GitHub
3. "New Project" → "Deploy from GitHub repo"
4. Select your repo
5. Railway auto-detects Python
6. Set start command: `cd backend && uvicorn main:app --host 0.0.0.0 --port $PORT`
7. Add environment variables
8. Get your Railway URL (e.g., `https://your-app.railway.app`)
9. Update frontend to use this URL

**Time**: 10-20 minutes
**Cost**: Free ($5 credit/month)

---

### Option 3: Deploy Backend to Fly.io (Good for Production)

**Why Fly.io:**
- ✅ Global edge deployment
- ✅ Free tier available
- ✅ Good performance

**Steps:**

1. Install Fly CLI: `curl -L https://fly.io/install.sh | sh`
2. Create `fly.toml` in backend directory
3. Run `fly launch`
4. Deploy: `fly deploy`
5. Get URL and update frontend

**Time**: 20-30 minutes
**Cost**: Free (limited)

---

### Option 4: Convert to Vercel Serverless Functions (Complex)

**Why This:**
- ✅ Everything on Vercel
- ✅ No separate backend service

**Why Not:**
- ❌ Complex - need to rewrite FastAPI endpoints
- ❌ Research endpoint may timeout (serverless has time limits)
- ❌ Need to manage Python dependencies differently

**If You Want This:**
- Create `api/` directory in root
- Convert each endpoint to serverless function
- Research endpoint may need to be async/background job
- More complex error handling

**Time**: 2-4 hours
**Cost**: Free (with limits)

---

### Option 5: Use Vercel Serverless Proxy (Hybrid)

**Why This:**
- ✅ Keep backend separate
- ✅ Hide backend URL from frontend
- ✅ Add caching/rate limiting

**How:**
- Create Vercel serverless function that proxies to backend
- Frontend calls Vercel function
- Vercel function calls your backend
- Good for hiding backend URL

**Time**: 30-60 minutes
**Cost**: Free

---

## Recommended: Option 1 (Render)

**Why:**
1. ✅ Easiest to set up
2. ✅ Free tier
3. ✅ No code changes needed (just config)
4. ✅ Auto-deploys from GitHub
5. ✅ Handles long-running requests (research takes 2-5 min)

**Steps to Implement:**

### Step 1: Update Backend CORS

Update `backend/main.py`:

```python
# Get Vercel URL from environment
VERCEL_URL = os.getenv("VERCEL_URL", "http://localhost:3000")
FRONTEND_URL = os.getenv("FRONTEND_URL", VERCEL_URL)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:5173",
        FRONTEND_URL,  # Your Vercel domain
        "https://your-vercel-app.vercel.app",  # Replace with actual URL
        # Add your Vercel preview URLs if needed
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### Step 2: Create Render Configuration

Create `render.yaml` in root:

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
      - key: DEDALUS_API_KEY
        sync: false
      - key: OPENAI_API_KEY
        sync: false
      - key: FRONTEND_URL
        value: https://your-vercel-app.vercel.app
```

### Step 3: Update Frontend API URL

Update `frontend/src/components/layout/SearchBar.jsx`:

```javascript
// Change from:
const API_URL = 'http://localhost:8000';

// To:
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
```

### Step 4: Set Vercel Environment Variable

In Vercel dashboard:
1. Go to your project
2. Settings → Environment Variables
3. Add: `VITE_API_URL` = `https://your-render-backend.onrender.com`
4. Redeploy

### Step 5: Deploy to Render

1. Go to https://render.com
2. Sign up/login
3. "New +" → "Web Service"
4. Connect GitHub repo
5. Configure:
   - Name: `genlab-backend`
   - Environment: `Python 3`
   - Build Command: `cd backend && pip install -r requirements.txt`
   - Start Command: `cd backend && uvicorn main:app --host 0.0.0.0 --port $PORT`
6. Add environment variables
7. Deploy!

---

## Quick Setup Checklist

- [ ] Update backend CORS to allow Vercel domain
- [ ] Create `render.yaml` (optional, can use web UI)
- [ ] Update frontend to use `import.meta.env.VITE_API_URL`
- [ ] Set `VITE_API_URL` in Vercel environment variables
- [ ] Deploy backend to Render
- [ ] Test research feature
- [ ] Update CORS with actual Render URL

---

## Testing

After deployment:
1. Frontend on Vercel → calls Render backend
2. Research feature should work
3. All other endpoints should work

---

## Cost Estimate

- **Render**: Free tier (750 hours/month)
- **Railway**: Free ($5 credit/month)
- **Fly.io**: Free (limited)
- **Vercel**: Free (for frontend)

**Total**: $0/month (on free tiers)

---

## Fallback: Mock Research for Demo

If deployment is taking too long, you can:
1. Create mock research responses
2. Return mock data when backend unavailable
3. Show "Demo Mode" in UI
4. Deploy backend later

Good luck! 🚀


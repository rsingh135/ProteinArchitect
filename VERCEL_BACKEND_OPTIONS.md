# Can You Deploy Backend on Vercel?

## Short Answer

**Yes, but with limitations:**
- ✅ Vercel supports Python serverless functions
- ❌ Research endpoint takes 2-5 minutes (Vercel free tier: 10 seconds, Pro: 60 seconds)
- ⚠️ Need to convert FastAPI to serverless functions
- ⚠️ More complex setup

## Vercel Limitations

### Execution Time Limits:
- **Free Tier**: 10 seconds max
- **Pro Tier**: 60 seconds max
- **Enterprise**: 300 seconds (5 minutes) max

### Your Research Endpoint:
- Takes **2-5 minutes** to complete
- Will **timeout** on free and Pro tiers
- Needs Enterprise tier ($$$) for 5-minute requests

## Options

### Option 1: Deploy Backend to Vercel (Complex, Has Limitations)

**Pros:**
- ✅ Everything on Vercel
- ✅ No separate service needed
- ✅ Easy deployment

**Cons:**
- ❌ Research will timeout (2-5 min > 10-60 sec limit)
- ❌ Need to convert FastAPI to serverless functions
- ❌ More complex code structure
- ❌ Enterprise tier needed for long requests (expensive)

**How to Do It:**
1. Create `api/` directory in root
2. Convert each endpoint to serverless function
3. Research endpoint needs background job or async processing
4. More complex error handling

**Verdict:** ⚠️ **Not recommended** - Research will timeout

---

### Option 2: Use Railway/Render (Recommended)

**Pros:**
- ✅ No timeout limits (Railway)
- ✅ Simple deployment
- ✅ No code changes needed
- ✅ Free tier available
- ✅ Research works (2-5 minutes)

**Cons:**
- ⚠️ Separate service (but free)

**Verdict:** ✅ **Recommended** - Works out of the box

---

### Option 3: Hybrid - Vercel Serverless + Background Job

**How It Works:**
1. Research endpoint starts job, returns immediately
2. Job runs in background (Railway/Render or queue service)
3. Frontend polls for results

**Pros:**
- ✅ Fast response (no timeout)
- ✅ Can use Vercel for some endpoints
- ✅ Research runs in background

**Cons:**
- ❌ More complex (need job queue)
- ❌ Need separate service anyway
- ❌ Frontend needs polling logic

**Verdict:** ⚠️ **Overkill** for hackathon

---

## Recommendation

**Use Railway for Backend** because:

1. ✅ **No timeout limits** - Research takes 2-5 minutes
2. ✅ **Simple deployment** - Just connect GitHub repo
3. ✅ **Free tier** - $5 credit/month (enough for hackathon)
4. ✅ **No code changes** - Your FastAPI code works as-is
5. ✅ **Fast setup** - 10 minutes to deploy

**Vercel is great for:**
- ✅ Frontend (you're already using it)
- ✅ Serverless functions (< 10 seconds)
- ✅ Static sites
- ❌ **Not good for long-running requests** (research)

---

## If You Really Want Vercel

You can deploy to Vercel, but you need to:

1. **Convert to serverless functions:**
   - Create `api/research_protein.py` (serverless function)
   - Research will timeout (need Enterprise tier)

2. **Or use background jobs:**
   - Research endpoint starts job
   - Job runs elsewhere (Railway/Render)
   - Frontend polls for results

3. **Or mock research for demo:**
   - Return pre-computed results
   - Skip actual research API call

---

## Quick Comparison

| Feature | Vercel | Railway | Render |
|---------|--------|---------|--------|
| **Free Tier** | ✅ Yes | ✅ Yes | ✅ Yes |
| **Timeout Limit** | 10s (free), 60s (pro) | ❌ None | 30s (free) |
| **Research Support** | ❌ Times out | ✅ Works | ❌ Times out |
| **Setup Complexity** | Medium | Easy | Easy |
| **Cost** | Free (limited) | Free ($5 credit) | Free (limited) |

**Winner: Railway** - No timeout, free, easy setup

---

## My Recommendation

**Deploy backend to Railway** (10 minutes):
1. Go to railway.app
2. Connect GitHub repo
3. Set start command: `cd backend && uvicorn main:app --host 0.0.0.0 --port $PORT`
4. Add environment variables
5. Get URL
6. Set `VITE_API_URL` in Vercel
7. Done! ✅

**Keep frontend on Vercel** (already done):
- Frontend works great on Vercel
- No changes needed

**Result:**
- ✅ Frontend on Vercel (fast, free)
- ✅ Backend on Railway (no timeout, free)
- ✅ Research feature works (2-5 minutes)
- ✅ Everything works! 🚀

---

## Bottom Line

**Yes, you CAN use Vercel for backend, but:**
- Research will timeout (2-5 min > 10-60 sec limit)
- Need Enterprise tier (expensive) for 5-minute requests
- More complex setup

**Better to use Railway:**
- No timeout limits
- Free tier
- Simple setup
- Research works perfectly

**Best of both worlds:**
- Frontend on Vercel ✅
- Backend on Railway ✅
- Everything works! ✅

Good luck! 🚀


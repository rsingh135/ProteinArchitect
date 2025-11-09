# 🔍 Debug & Fix Backend Connection Issue

## Problem Summary
The frontend (hosted on Vercel at `proteinarchi.tech`) is trying to connect to `localhost:8000` instead of the Render backend URL. This causes the error: "Cannot connect to backend server. Please make sure the backend is running on http://localhost:8000".

## Root Causes Identified
1. **Missing Environment Variable**: `VITE_API_URL` not set in Vercel
2. **Hardcoded URLs**: Two endpoints in `PPIPrediction.jsx` use hardcoded `http://localhost:8000`
3. **Missing API Endpoints**: `predict_ppi_from_sequences` and `generate_ppi_video` not in API config

---

## 📋 Multi-Step Fix Plan

### Step 1: Verify Render Backend Deployment
**Goal**: Confirm backend is deployed and get the URL

**Actions**:
1. Go to Render dashboard: https://dashboard.render.com
2. Find your backend service (likely named `genlab-backend` or similar)
3. Check deployment status:
   - ✅ Should show "Live" status
   - ✅ Should have a URL like `https://genlab-backend-xxxx.onrender.com`
4. Test the backend health endpoint:
   - Open: `https://your-backend-url.onrender.com/health`
   - Should return: `{"status": "healthy"}`
5. **Record your backend URL** for next steps

**If backend is not deployed**:
- Follow `RENDER_QUICK_SETUP.md` to deploy
- Make sure all environment variables are set in Render dashboard
- Wait for deployment to complete (usually 2-5 minutes)

---

### Step 2: Fix Hardcoded URLs in Frontend
**Goal**: Replace hardcoded `localhost:8000` with config-based URLs

**Files to Fix**:
- `frontend/src/components/PPIPrediction.jsx` (2 locations)

**Changes Needed**:
1. Add missing endpoints to `frontend/src/config/api.js`
2. Update `PPIPrediction.jsx` to use `API_ENDPOINTS` instead of hardcoded URLs

---

### Step 3: Set VITE_API_URL in Vercel
**Goal**: Configure frontend to use Render backend URL

**Actions**:
1. Go to Vercel dashboard: https://vercel.com/dashboard
2. Select your project (likely `proteinarchitect` or similar)
3. Go to **Settings** → **Environment Variables**
4. Add new variable:
   - **Key**: `VITE_API_URL`
   - **Value**: `https://your-backend-url.onrender.com` (from Step 1)
   - **Environment**: Select all (Production, Preview, Development)
5. Click **Save**
6. **Redeploy** your frontend:
   - Go to **Deployments** tab
   - Click **⋯** (three dots) on latest deployment
   - Click **Redeploy**
   - Or push a new commit to trigger redeploy

**⚠️ Important**: 
- Vercel environment variables starting with `VITE_` are exposed to the browser
- Make sure your backend URL is correct (HTTPS, not HTTP)
- After adding the variable, you MUST redeploy for changes to take effect

---

### Step 4: Verify Backend CORS Configuration
**Goal**: Ensure backend allows requests from Vercel frontend

**Check Backend Code** (`backend/main.py`):
- Lines 85-89: In production, CORS should allow all origins (`["*"]`)
- This is already configured correctly! ✅

**Verify in Render**:
1. Check Render logs for CORS errors
2. If you see CORS errors, verify:
   - `ENVIRONMENT=production` is set in Render environment variables
   - `FRONTEND_URL` is set (optional, but recommended)
   - Backend is detecting production mode correctly

---

### Step 5: Test the Connection
**Goal**: Verify frontend can connect to backend

**Testing Steps**:
1. **After redeploying Vercel**, open your website: `https://proteinarchi.tech`
2. **Open browser console** (F12 → Console tab)
3. **Check API configuration log**:
   - Should see: `🔧 API Configuration: { VITE_API_URL: 'https://...', API_URL: 'https://...', ... }`
   - If `VITE_API_URL` shows `NOT SET`, the environment variable wasn't set correctly
4. **Try the research feature**:
   - Go to Research tab
   - Enter a protein ID (e.g., `P01308`)
   - Check console for network requests
   - Should see requests to `https://your-backend-url.onrender.com/research_protein`
5. **Check for errors**:
   - If you see CORS errors → Check Step 4
   - If you see 404 errors → Check backend URL is correct
   - If you see connection timeout → Check Render backend is running

---

### Step 6: Debugging Common Issues

#### Issue: "VITE_API_URL is NOT SET" in console
**Solution**:
- Verify environment variable is set in Vercel
- Make sure variable name is exactly `VITE_API_URL` (case-sensitive)
- Redeploy after adding the variable
- Check Vercel deployment logs to confirm variable is included

#### Issue: CORS errors in browser console
**Solution**:
- Verify `ENVIRONMENT=production` in Render
- Check Render logs for CORS middleware initialization
- Backend should log: `🌐 Production mode: Allowing all origins for CORS`

#### Issue: Backend returns 404
**Solution**:
- Verify backend URL is correct (check Render dashboard)
- Test backend health endpoint directly in browser
- Check backend logs in Render for route registration

#### Issue: Backend is sleeping (Render free tier)
**Solution**:
- First request after 15 min inactivity takes ~30 seconds
- This is normal for Render free tier
- Consider using a ping service (e.g., cron-job.org) to keep it awake
- Or upgrade to paid tier for always-on service

#### Issue: "Cannot connect to backend server" error persists
**Solution**:
- Check browser network tab for actual request URL
- Verify the request is going to Render URL, not localhost
- Clear browser cache and hard refresh (Ctrl+Shift+R / Cmd+Shift+R)
- Check if backend is actually running in Render dashboard

---

## ✅ Verification Checklist

After completing all steps, verify:

- [ ] Render backend is deployed and shows "Live" status
- [ ] Backend health endpoint works: `https://your-backend.onrender.com/health`
- [ ] `VITE_API_URL` is set in Vercel environment variables
- [ ] Vercel frontend has been redeployed after adding environment variable
- [ ] Browser console shows correct `VITE_API_URL` (not `NOT SET`)
- [ ] No hardcoded `localhost:8000` URLs in frontend code
- [ ] Research feature works when entering a protein ID
- [ ] Network requests in browser show requests to Render URL (not localhost)
- [ ] No CORS errors in browser console
- [ ] Backend logs in Render show successful requests

---

## 🚀 Quick Fix Summary

If you just want to fix it quickly:

1. **Get your Render backend URL** from Render dashboard
2. **Add to Vercel**: Settings → Environment Variables → `VITE_API_URL` = `https://your-backend.onrender.com`
3. **Redeploy Vercel frontend**
4. **Fix hardcoded URLs** in `PPIPrediction.jsx` (see Step 2)
5. **Test** the research feature

---

## 📝 Next Steps After Fix

1. **Monitor Render logs** for any backend errors
2. **Set up ping service** (optional) to keep Render backend awake
3. **Consider upgrading** Render to paid tier if you need always-on service
4. **Add error monitoring** (e.g., Sentry) to catch issues early
5. **Document** your backend URL for future reference

---

## 🔗 Related Files

- `frontend/src/config/api.js` - API configuration
- `frontend/src/components/PPIPrediction.jsx` - Needs URL fixes
- `frontend/src/components/layout/SearchBar.jsx` - Uses API_ENDPOINTS correctly
- `backend/main.py` - Backend CORS configuration
- `RENDER_QUICK_SETUP.md` - Render deployment guide

---

## 💡 Additional Notes

- **Development vs Production**: 
  - Development: Uses `localhost:8000` (from vite.config.js proxy)
  - Production: Uses `VITE_API_URL` environment variable
- **Environment Variables**:
  - Vite only exposes variables prefixed with `VITE_` to the browser
  - Must redeploy after adding/changing environment variables
- **Render Free Tier**:
  - Apps sleep after 15 minutes of inactivity
  - First request after sleep takes ~30 seconds (cold start)
  - Consider upgrading if you need faster response times


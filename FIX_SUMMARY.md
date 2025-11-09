# ✅ Backend Connection Fix - Summary

## What Was Fixed

### 1. ✅ Added Missing API Endpoints
**File**: `frontend/src/config/api.js`
- Added `predictPPIFromSequences: ${API_URL}/predict_ppi_from_sequences`
- Added `generatePPIVideo: ${API_URL}/generate_ppi_video`

### 2. ✅ Fixed Hardcoded URLs
**File**: `frontend/src/components/PPIPrediction.jsx`
- Replaced `'http://localhost:8000/predict_ppi_from_sequences'` with `API_ENDPOINTS.predictPPIFromSequences`
- Replaced `'http://localhost:8000/generate_ppi_video'` with `API_ENDPOINTS.generatePPIVideo`

## What You Need to Do Next

### Step 1: Get Your Render Backend URL
1. Go to https://dashboard.render.com
2. Find your backend service
3. Copy the URL (e.g., `https://genlab-backend-xxxx.onrender.com`)
4. Test it: `https://your-backend-url.onrender.com/health` should return `{"status": "healthy"}`

### Step 2: Set VITE_API_URL in Vercel
1. Go to https://vercel.com/dashboard
2. Select your project
3. Go to **Settings** → **Environment Variables**
4. Add:
   - **Key**: `VITE_API_URL`
   - **Value**: `https://your-backend-url.onrender.com` (from Step 1)
   - **Environment**: All (Production, Preview, Development)
5. Click **Save**
6. **Redeploy** your frontend (Deployments → ... → Redeploy)

### Step 3: Verify Backend is Running
1. Check Render dashboard - backend should show "Live" status
2. Verify `ENVIRONMENT=production` is set in Render environment variables
3. Check Render logs for any errors

### Step 4: Test the Fix
1. After Vercel redeploy completes, visit your website
2. Open browser console (F12)
3. Check for: `🔧 API Configuration: { VITE_API_URL: 'https://...', ... }`
4. Go to Research tab
5. Enter a protein ID (e.g., `P01308`)
6. Should work without "Cannot connect to backend" error

## Files Changed

1. `frontend/src/config/api.js` - Added missing endpoints
2. `frontend/src/components/PPIPrediction.jsx` - Fixed hardcoded URLs

## Important Notes

- ⚠️ **You MUST redeploy Vercel after adding the environment variable**
- ⚠️ **Make sure Render backend is running and accessible**
- ⚠️ **Check browser console for the API configuration log to verify VITE_API_URL is set**

## If It Still Doesn't Work

1. **Check browser console** for errors
2. **Check Vercel deployment logs** to verify environment variable is included
3. **Check Render logs** for backend errors
4. **Verify backend URL** is correct and accessible
5. **Clear browser cache** and hard refresh (Ctrl+Shift+R)

## Documentation

See `DEBUG_BACKEND_CONNECTION.md` for detailed debugging steps and troubleshooting guide.


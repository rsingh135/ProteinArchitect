# Vercel Backend Connection Fix Guide

## What Was Fixed

### 1. **AIChat Component** (`frontend/src/components/chat/AIChat.jsx`)
   - **Problem**: Was using `/api/chat` (relative URL) which only works in development with Vite proxy
   - **Fix**: Now uses `API_ENDPOINTS.chat` from the centralized config, which respects `VITE_API_URL`
   - **Result**: Chat will now connect to your Render backend in production

### 2. **Error Messages** (`frontend/src/config/api.js`)
   - **Problem**: Error message showed localhost even when `VITE_API_URL` was set
   - **Fix**: Error messages now show the actual backend URL being used (either from env var or localhost)
   - **Result**: Better debugging information

### 3. **Centralized API Configuration**
   - All API calls now use the centralized `API_ENDPOINTS` from `frontend/src/config/api.js`
   - This ensures consistent backend URL usage across all components

## What You Need to Do in Vercel

### Step 1: Set Environment Variable
1. Go to your Vercel project dashboard
2. Navigate to: **Project → Settings → Environment Variables**
3. Add a new environment variable:
   - **Name**: `VITE_API_URL`
   - **Value**: `https://proteinarchitect-backend.onrender.com`
   - **Environment**: Select **Production** (and **Preview** if you want)
4. Click **Save**

### Step 2: Redeploy Your Frontend
After setting the environment variable, you need to redeploy:

**Option A: Automatic Redeploy**
- Vercel should automatically trigger a redeploy when you save environment variables
- Check the **Deployments** tab to see if a new deployment started

**Option B: Manual Redeploy**
1. Go to **Deployments** tab in Vercel
2. Click the **"..."** menu on the latest deployment
3. Select **"Redeploy"**
4. Make sure **"Use existing Build Cache"** is **UNCHECKED** (important for env vars to be included)

**Option C: Push a Commit**
- Make a small change (add a comment, fix formatting)
- Commit and push to trigger a new deployment

### Step 3: Verify Backend is Running
Before testing, verify your backend is accessible:
- Open: `https://proteinarchitect-backend.onrender.com/health`
- You should see: `{"status":"healthy"}` ✅

### Step 4: Test Your Frontend
1. **Hard Refresh** your Vercel site:
   - **Chrome/Edge**: `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)
   - **Firefox**: `Ctrl+F5` (Windows) or `Cmd+Shift+R` (Mac)
   - Or open an **Incognito/Private window**

2. **Test the Features**:
   - Try searching for a protein (e.g., "P01308")
   - Try the Research feature
   - Try the PPI Prediction
   - Try the AI Chat

3. **Check Browser Console**:
   - Open Developer Tools (F12)
   - Go to **Console** tab
   - Look for API calls - they should be going to `https://proteinarchitect-backend.onrender.com/...`
   - No more "localhost:8000" errors!

## How to Verify It's Working

### 1. Check Environment Variable is Set
After redeploy, you can verify in the browser console:
```javascript
// Open browser console on your Vercel site
console.log(import.meta.env.VITE_API_URL);
// Should show: "https://proteinarchitect-backend.onrender.com"
```

### 2. Check Network Requests
1. Open Developer Tools → **Network** tab
2. Try using a feature (search, research, chat)
3. Look for requests to `proteinarchitect-backend.onrender.com`
4. They should return **200 OK** responses (not CORS errors or connection failures)

### 3. Check Error Messages
- If there's still an error, it should now show the Render URL instead of localhost
- Error message format: `"Cannot connect to backend server at https://proteinarchitect-backend.onrender.com..."`

## Troubleshooting

### Problem: Still seeing localhost errors
**Solution**: 
- Make sure you **redeployed** after setting the environment variable
- Clear browser cache and hard refresh
- Check that `VITE_API_URL` is set for the correct environment (Production/Preview)

### Problem: CORS errors
**Solution**: 
- Make sure your Render backend has CORS enabled for your Vercel domain
- Check `backend/main.py` has CORS middleware configured

### Problem: Backend health check works but API calls fail
**Solution**:
- Check browser console for specific error messages
- Verify the endpoint paths match between frontend and backend
- Check Render backend logs for errors

### Problem: Environment variable not showing up
**Solution**:
- Make sure you saved it for the correct environment (Production)
- Redeploy with build cache disabled
- Check Vercel build logs to see if env vars are being injected

## Summary

✅ **Fixed**: AIChat now uses centralized API config
✅ **Fixed**: Error messages show correct backend URL
✅ **Next**: Set `VITE_API_URL` in Vercel
✅ **Next**: Redeploy frontend
✅ **Next**: Test and verify

Your frontend should now connect to your Render backend without any localhost errors!


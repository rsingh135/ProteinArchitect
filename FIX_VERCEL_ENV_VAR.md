# Fix Vercel Environment Variable Issue

## Problem
You're seeing: "Cannot connect to backend server. Please make sure the backend is running on http://localhost:8000"

This means `VITE_API_URL` is **not set** in your Vercel deployment, so the frontend is falling back to localhost.

## Solution: Set Environment Variable and Redeploy

### Step 1: Set Environment Variable in Vercel

1. **Go to Vercel Dashboard**
   - Open: https://vercel.com/dashboard
   - Click on your project

2. **Go to Settings → Environment Variables**
   - Click **Settings** tab (top menu)
   - Click **Environment Variables** (left sidebar)

3. **Add the Environment Variable**
   - Click **Add New** or **Add** button
   - **Key**: `VITE_API_URL`
   - **Value**: `https://proteinarchitect-backend.onrender.com`
   - **Environment**: Select **Production** (and **Preview** if you want)
   - Click **Save**

4. **Verify It's Set**
   - You should see `VITE_API_URL` in the list
   - Make sure it's set for **Production** environment

### Step 2: Force a New Deployment (IMPORTANT!)

**CRITICAL**: Just setting the env var isn't enough! You need to **redeploy** so Vercel rebuilds the app with the env var.

#### Option A: Redeploy from Dashboard (Recommended)
1. Go to **Deployments** tab
2. Find the latest deployment
3. Click the **"..."** (three dots) menu
4. Click **Redeploy**
5. **IMPORTANT**: **UNCHECK** "Use existing Build Cache" (this forces a fresh build)
6. Click **Redeploy**

#### Option B: Push a Commit
1. Make a small change to any file (add a comment, fix formatting)
2. Commit the change:
   ```bash
   git add .
   git commit -m "Trigger redeploy with VITE_API_URL"
   git push
   ```
3. This will trigger a new deployment automatically

#### Option C: Cancel and Retry
1. If current deployment is still running, cancel it
2. Set the env var (Step 1)
3. Redeploy (Step 2)

### Step 3: Verify the Fix

#### Check Browser Console
1. **Open your Vercel site** in browser
2. **Open Developer Tools** (F12)
3. **Go to Console tab**
4. **Look for this log message**:
   ```
   🔧 API Configuration: {
     VITE_API_URL: "https://proteinarchitect-backend.onrender.com",
     API_URL: "https://proteinarchitect-backend.onrender.com",
     environment: "production",
     isProduction: true
   }
   ```

#### If You See "NOT SET"
- The env var wasn't included in the build
- **Solution**: Redeploy with build cache disabled (Step 2, Option A)

#### If You See the Correct URL
- ✅ Environment variable is set correctly!
- Try using a feature (search, research) to test connection

### Step 4: Test the Connection

1. **Open your Vercel site**
2. **Open Developer Tools** (F12) → **Network tab**
3. **Try a feature** (search for a protein, research, etc.)
4. **Check Network requests**:
   - Should see requests to `proteinarchitect-backend.onrender.com`
   - Should **NOT** see requests to `localhost:8000`
   - Requests should return **200 OK** (not CORS errors)

## Troubleshooting

### Issue: Still seeing localhost error after redeploy

**Possible causes:**
1. **Env var not set for correct environment**
   - Check: Is it set for **Production**?
   - Check: Are you viewing the **Production** deployment (not Preview)?

2. **Build cache was used**
   - Solution: Redeploy with **"Use existing Build Cache" UNCHECKED**

3. **Browser cache**
   - Solution: Hard refresh (Ctrl+Shift+R or Cmd+Shift+R)
   - Or: Open in Incognito/Private window

4. **Wrong deployment**
   - Check: Are you viewing the latest deployment?
   - Check: Is the deployment status **Ready**?

### Issue: Env var is set but not working

**Check:**
1. **Spelling**: Is it exactly `VITE_API_URL`? (case-sensitive)
2. **Value**: Is it exactly `https://proteinarchitect-backend.onrender.com`? (no trailing slash)
3. **Environment**: Is it set for **Production**?
4. **Redeploy**: Did you redeploy after setting it?

### Issue: CORS errors

**If you see CORS errors:**
- The backend is working (you're connecting to it!)
- But CORS might not be configured correctly
- Check: Is your Vercel domain allowed in backend CORS settings?

## Quick Checklist

- [ ] Set `VITE_API_URL` in Vercel (Settings → Environment Variables)
- [ ] Value is `https://proteinarchitect-backend.onrender.com`
- [ ] Set for **Production** environment
- [ ] Redeployed with build cache **disabled**
- [ ] Checked browser console for API configuration log
- [ ] Verified Network requests go to Render backend (not localhost)
- [ ] Tested a feature (search, research) - it works!

## Expected Result

After fixing:
- ✅ No more "localhost:8000" errors
- ✅ Browser console shows correct API URL
- ✅ Network requests go to `proteinarchitect-backend.onrender.com`
- ✅ Features work correctly (search, research, chat, etc.)

## Still Not Working?

If you've done all the steps and it's still not working:

1. **Share the browser console log** - What does the API configuration show?
2. **Share the Network tab** - What URLs are being requested?
3. **Share the error message** - What exact error do you see?
4. **Check Vercel build logs** - Are there any errors during build?

The key issue is that **VITE environment variables are baked into the build at build time**. You MUST redeploy after setting the env var for it to take effect!


# Vercel Environment Variable Troubleshooting Guide

## Error You're Seeing
```
Cannot connect to backend server. Please make sure the backend is running on http://localhost:8000
```

## This Means:
❌ `VITE_API_URL` environment variable is **NOT set** in your Vercel deployment  
❌ OR it was set but the frontend **wasn't rebuilt** after setting it

## Why This Happens

Vite environment variables are **baked into the JavaScript bundle at BUILD TIME**. This means:
- Setting the env var AFTER deployment won't work
- You MUST redeploy after setting the env var
- The build cache must be cleared for env vars to be included

## Step-by-Step Fix

### Step 1: Verify Environment Variable is Set

1. Go to: https://vercel.com/dashboard
2. Click your project
3. Go to: **Settings** → **Environment Variables**
4. Look for: `VITE_API_URL`
5. Check:
   - ✅ Does it exist?
   - ✅ Value: `https://proteinarchitect-backend.onrender.com`
   - ✅ Environment: **Production** (and Preview if you want)
   - ✅ Is it saved?

### Step 2: If NOT Set - Set It Now

1. Click **Add New**
2. **Key**: `VITE_API_URL`
3. **Value**: `https://proteinarchitect-backend.onrender.com`
4. **Environment**: Select **Production** (check the box)
5. Click **Save**

### Step 3: Force a Fresh Deployment

**CRITICAL**: Just saving the env var isn't enough! You MUST redeploy.

#### Option A: Redeploy from Dashboard (Easiest)

1. Go to **Deployments** tab
2. Find the **latest deployment**
3. Click the **"..."** (three dots) menu
4. Click **Redeploy**
5. **IMPORTANT**: **UNCHECK** "Use existing Build Cache" ⚠️
6. Click **Redeploy**
7. Wait for deployment to complete (2-5 minutes)

#### Option B: Push a Commit

1. Make a small change (add a comment to any file)
2. Commit:
   ```bash
   git add .
   git commit -m "Trigger redeploy with VITE_API_URL"
   git push
   ```
3. This triggers a new deployment automatically

### Step 4: Verify It's Working

#### Check Browser Console

1. Open your Vercel site
2. Open Developer Tools (F12)
3. Go to **Console** tab
4. Look for this log message:
   ```
   🔧 API Configuration: {
     VITE_API_URL: "https://proteinarchitect-backend.onrender.com",
     API_URL: "https://proteinarchitect-backend.onrender.com",
     ...
   }
   ```

#### If You See "NOT SET":
- ❌ The env var wasn't included in the build
- **Solution**: Redeploy with build cache **disabled**

#### If You See the Correct URL:
- ✅ Environment variable is set correctly!
- Try using a feature to test

### Step 5: Test the Connection

1. Open **Network** tab in Developer Tools
2. Try using a feature (search, research, etc.)
3. Check Network requests:
   - ✅ Should see requests to `proteinarchitect-backend.onrender.com`
   - ❌ Should **NOT** see requests to `localhost:8000`
   - ✅ Requests should return **200 OK**

## Common Issues & Solutions

### Issue 1: Env Var Set But Still Seeing Localhost

**Cause**: Build cache was used, env var not included

**Solution**:
1. Go to Deployments
2. Click "..." → Redeploy
3. **UNCHECK** "Use existing Build Cache"
4. Click Redeploy

### Issue 2: Env Var Not Showing in Console

**Cause**: 
- Env var not set for correct environment
- Or deployment is using cached build

**Solution**:
1. Check env var is set for **Production**
2. Redeploy with cache disabled
3. Hard refresh browser (Ctrl+Shift+R)

### Issue 3: Wrong Environment

**Cause**: 
- Env var set for Preview but viewing Production
- Or vice versa

**Solution**:
1. Set env var for **Production** environment
2. Or set it for **All** environments (Production, Preview, Development)

### Issue 4: Typo in Env Var Name

**Cause**: 
- Typo in variable name
- Case sensitivity issue

**Solution**:
- Check it's exactly: `VITE_API_URL` (case-sensitive)
- No spaces, no typos

### Issue 5: Wrong Value

**Cause**: 
- Wrong URL
- Trailing slash
- HTTP instead of HTTPS

**Solution**:
- Value should be: `https://proteinarchitect-backend.onrender.com`
- No trailing slash
- Use HTTPS (not HTTP)

### Issue 6: Browser Cache

**Cause**: 
- Old JavaScript bundle cached in browser

**Solution**:
1. Hard refresh: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
2. Or open in Incognito/Private window
3. Or clear browser cache

## Quick Diagnostic Checklist

Run through this checklist:

- [ ] **Env var exists** in Vercel Settings → Environment Variables
- [ ] **Name is correct**: `VITE_API_URL` (exact, case-sensitive)
- [ ] **Value is correct**: `https://proteinarchitect-backend.onrender.com`
- [ ] **Environment is correct**: Production (or All)
- [ ] **Redeployed** after setting env var
- [ ] **Build cache disabled** when redeploying
- [ ] **Deployment completed** successfully
- [ ] **Browser console** shows correct API URL (not "NOT SET")
- [ ] **Hard refreshed** browser or opened incognito
- [ ] **Network tab** shows requests to Render backend (not localhost)

## Debugging Steps

### 1. Check What API URL is Being Used

Open browser console on your Vercel site and run:
```javascript
console.log('VITE_API_URL:', import.meta.env.VITE_API_URL);
console.log('API_URL:', import.meta.env.VITE_API_URL || 'http://localhost:8000');
```

**Expected**: Should show `https://proteinarchitect-backend.onrender.com`  
**If shows undefined**: Env var not set or not included in build

### 2. Check Vercel Build Logs

1. Go to Vercel dashboard → Deployments
2. Click on the latest deployment
3. Check build logs
4. Look for env vars being injected
5. Should see: `VITE_API_URL` in the logs (not the value, just the name)

### 3. Check Backend is Working

Test backend directly:
```bash
curl https://proteinarchitect-backend.onrender.com/health
```

Should return: `{"status":"healthy"}`

### 4. Check Network Requests

1. Open Developer Tools → Network tab
2. Try using a feature
3. Look for failed requests
4. Check if they're going to localhost or Render backend

## Still Not Working?

If you've done all the above and it's still not working:

1. **Share the browser console log** - What does `import.meta.env.VITE_API_URL` show?
2. **Share the Network tab** - What URLs are being requested?
3. **Share Vercel deployment logs** - Any errors during build?
4. **Verify backend** - Is `https://proteinarchitect-backend.onrender.com/health` working?

## Alternative: Check Code

The error message comes from `frontend/src/config/api.js`. Let's verify the code is correct:

```javascript
export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
```

This is correct - it uses the env var if set, otherwise falls back to localhost.

The issue is that `VITE_API_URL` is not set in your Vercel deployment's build.

## Quick Fix Summary

1. ✅ Set `VITE_API_URL` in Vercel (Settings → Environment Variables)
2. ✅ Value: `https://proteinarchitect-backend.onrender.com`
3. ✅ Environment: Production
4. ✅ Redeploy with build cache **disabled**
5. ✅ Hard refresh browser
6. ✅ Test and verify

The key is: **You MUST redeploy after setting the env var, and you MUST disable build cache!**


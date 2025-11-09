# Quick Fix: Localhost Error

## The Problem
You're seeing: `"Cannot connect to backend server. Please make sure the backend is running on http://localhost:8000"`

This means `VITE_API_URL` is **not set** in your Vercel deployment.

## The Fix (5 Steps)

### Step 1: Check if Env Var is Set

1. Go to: https://vercel.com/dashboard
2. Click your project
3. Click **Settings** → **Environment Variables**
4. Look for `VITE_API_URL`

**If it doesn't exist → Go to Step 2**  
**If it exists → Go to Step 3**

### Step 2: Set the Environment Variable

1. Click **Add New**
2. **Key**: `VITE_API_URL`
3. **Value**: `https://proteinarchitect-backend.onrender.com`
4. **Environment**: Check **Production** (and **Preview** if you want)
5. Click **Save**

### Step 3: Force a Fresh Deployment

⚠️ **CRITICAL**: You MUST redeploy after setting the env var!

1. Go to **Deployments** tab
2. Click the **"..."** (three dots) on the latest deployment
3. Click **Redeploy**
4. **IMPORTANT**: **UNCHECK** "Use existing Build Cache" ⚠️
5. Click **Redeploy**
6. Wait 2-5 minutes for deployment to complete

### Step 4: Verify in Browser

1. Open your Vercel site
2. Open Developer Tools (F12)
3. Go to **Console** tab
4. Look for this message:
   ```
   🔧 API Configuration: {
     VITE_API_URL: "https://proteinarchitect-backend.onrender.com",
     ...
   }
   ```

**If you see "NOT SET"**: The env var wasn't included. Go back to Step 3 and make sure build cache is **disabled**.

**If you see the correct URL**: ✅ It's working! Go to Step 5.

### Step 5: Test It

1. Hard refresh the page: **Ctrl+Shift+R** (Windows) or **Cmd+Shift+R** (Mac)
2. Or open in **Incognito/Private window**
3. Try using a feature (search, research, etc.)
4. Check **Network** tab - requests should go to `proteinarchitect-backend.onrender.com`

## Still Not Working?

### Check 1: Is the env var name correct?
- Must be exactly: `VITE_API_URL` (case-sensitive, no spaces)

### Check 2: Is the value correct?
- Must be: `https://proteinarchitect-backend.onrender.com`
- No trailing slash
- Use HTTPS (not HTTP)

### Check 3: Is it set for the right environment?
- Should be set for **Production**
- Or set for **All** environments

### Check 4: Did you redeploy?
- Just saving the env var isn't enough
- You MUST redeploy
- You MUST disable build cache

### Check 5: Is your backend working?
Test the backend directly:
```
https://proteinarchitect-backend.onrender.com/health
```
Should return: `{"status":"healthy"}`

### Check 6: Browser cache?
- Try hard refresh: Ctrl+Shift+R
- Or open in incognito window
- Or clear browser cache

## Quick Diagnostic

Open browser console on your Vercel site and run:
```javascript
console.log('VITE_API_URL:', import.meta.env.VITE_API_URL);
```

**Expected**: `https://proteinarchitect-backend.onrender.com`  
**If undefined**: Env var not set or not included in build

## Most Common Issue

**90% of the time**, the issue is:
1. ✅ Env var is set
2. ❌ But deployment used cached build (env var not included)

**Solution**: Redeploy with build cache **disabled**!

## Summary

1. ✅ Set `VITE_API_URL` in Vercel
2. ✅ Value: `https://proteinarchitect-backend.onrender.com`
3. ✅ Redeploy with cache **disabled**
4. ✅ Hard refresh browser
5. ✅ Test and verify

The key: **Redeploy with build cache disabled!**


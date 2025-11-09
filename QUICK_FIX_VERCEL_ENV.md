# Quick Fix: Vercel Environment Variable

## The Problem
You're getting: "Cannot connect to backend server. Please make sure the backend is running on http://localhost:8000"

**This means**: `VITE_API_URL` is not set in your Vercel deployment.

## The Fix (3 Steps)

### Step 1: Set Environment Variable
1. Go to: https://vercel.com/dashboard
2. Click your project
3. Click **Settings** → **Environment Variables**
4. Click **Add New**
5. Enter:
   - **Key**: `VITE_API_URL`
   - **Value**: `https://proteinarchitect-backend.onrender.com`
   - **Environment**: Select **Production**
6. Click **Save**

### Step 2: Redeploy (CRITICAL!)
⚠️ **IMPORTANT**: You MUST redeploy after setting the env var!

1. Go to **Deployments** tab
2. Click **"..."** on latest deployment
3. Click **Redeploy**
4. **UNCHECK** "Use existing Build Cache" ⚠️
5. Click **Redeploy**

### Step 3: Verify
1. Wait for deployment to complete
2. Open your Vercel site
3. Open browser console (F12)
4. Look for: `🔧 API Configuration:`
5. Should show: `VITE_API_URL: "https://proteinarchitect-backend.onrender.com"`

## Why This Happens
Vite environment variables are **baked into the build at build time**. If you set the env var after the build, it won't be included. You must **redeploy** for it to work.

## Still Not Working?
1. Check: Is env var set for **Production**?
2. Check: Did you redeploy with cache **disabled**?
3. Check: Browser console shows what API URL?
4. Check: Hard refresh the page (Ctrl+Shift+R)

## Expected Result
✅ No more localhost errors
✅ Console shows correct API URL
✅ Features work correctly


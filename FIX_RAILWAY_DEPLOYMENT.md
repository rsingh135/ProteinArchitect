# Fix Railway Deployment Error

## Problem

Railway error: "Error creating build plan with Railpack"

This happens when Railway can't detect your project structure or build configuration.

## Solutions

### Solution 1: Set Build/Start Commands in Railway UI (Easiest)

**In Railway Dashboard:**

1. Go to your service
2. Click on the service
3. Go to **"Settings"** tab
4. Scroll to **"Build & Deploy"** section
5. Set:
   - **Build Command**: `cd backend && pip install -r requirements.txt`
   - **Start Command**: `cd backend && uvicorn main:app --host 0.0.0.0 --port $PORT`
   - **Root Directory**: Leave empty (or try `backend/` if that doesn't work)

6. **Save** and redeploy

### Solution 2: Use Procfile

I've created a `Procfile` in your root directory. Railway should detect it automatically.

If it doesn't work:
1. Make sure `Procfile` is in the root directory
2. Redeploy

### Solution 3: Use railway.json

I've created `railway.json` with the build configuration.

If Railway still doesn't detect it:
1. Make sure `railway.json` is in root directory
2. Try setting commands manually in Railway UI (Solution 1)

### Solution 4: Set Root Directory

**In Railway Dashboard:**

1. Go to service → Settings
2. Find **"Root Directory"**
3. Set to: `backend`
4. Update commands:
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`
5. Save and redeploy

### Solution 5: Use Nixpacks Configuration

I've created `nixpacks.toml` which Railway/Nixpacks should detect.

## Recommended: Manual Configuration in Railway UI

**This is the most reliable method:**

1. **Go to Railway Dashboard**
2. **Select your service**
3. **Click "Settings" tab**
4. **Scroll to "Build & Deploy"**

5. **Set these values:**
   ```
   Build Command: cd backend && pip install -r requirements.txt
   Start Command: cd backend && uvicorn main:app --host 0.0.0.0 --port $PORT
   Root Directory: (leave empty)
   ```

6. **Or try with Root Directory:**
   ```
   Root Directory: backend
   Build Command: pip install -r requirements.txt
   Start Command: uvicorn main:app --host 0.0.0.0 --port $PORT
   ```

7. **Save** and **Redeploy

## Files Created

I've created these files to help Railway detect your project:

- ✅ `railway.json` - Railway configuration
- ✅ `Procfile` - Standard deployment file
- ✅ `nixpacks.toml` - Nixpacks configuration

## Troubleshooting

### If still failing:

1. **Check Railway logs:**
   - Click "View logs" in Railway
   - Look for specific error messages

2. **Verify Python version:**
   - Railway should auto-detect Python
   - You can specify in `runtime.txt` if needed

3. **Check requirements.txt:**
   - Make sure it's in `backend/requirements.txt`
   - Verify all dependencies are listed

4. **Try different root directory:**
   - Try `backend/` as root directory
   - Adjust commands accordingly

## Quick Fix Steps

1. **Go to Railway Dashboard**
2. **Service → Settings → Build & Deploy**
3. **Set:**
   - Build: `cd backend && pip install -r requirements.txt`
   - Start: `cd backend && uvicorn main:app --host 0.0.0.0 --port $PORT`
4. **Save and Redeploy**

This should fix the Railpack error!

Good luck! 🚀


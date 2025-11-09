# Vercel Deployment Troubleshooting Guide

## Typical Deployment Times
- **Normal deployment**: 1-5 minutes
- **First deployment**: 3-8 minutes (installing dependencies)
- **10+ minutes**: Likely an issue (build error, timeout, or stuck process)

## How to Check Deployment Status

### 1. Check Vercel Dashboard
1. Go to your Vercel project dashboard
2. Click on **Deployments** tab
3. Look at the latest deployment:
   - **Building** (yellow) = Still in progress
   - **Ready** (green) = Success
   - **Error** (red) = Build failed
   - **Cancelled** (gray) = Was cancelled

### 2. Check Build Logs
1. Click on the deployment
2. Click **View Build Logs** or scroll down to see logs
3. Look for:
   - Error messages (red text)
   - Warnings (yellow text)
   - Stuck at a specific step (e.g., "Installing dependencies...")

### 3. Common Issues & Solutions

#### Issue: Stuck at "Installing dependencies"
**Cause**: Large dependencies (molstar, three.js, react-three/fiber)
**Solution**: 
- Wait a bit longer (first deploy can take 10-15 min with large deps)
- Check if npm is downloading packages
- Consider using `.npmrc` to optimize installs

#### Issue: Build timeout
**Cause**: Build process taking too long
**Solution**:
- Vercel has a 45-minute timeout
- Check build logs for slow steps
- Optimize build process

#### Issue: Memory error
**Cause**: Build using too much memory
**Solution**:
- Check for memory-intensive operations
- Optimize bundle size

#### Issue: Build errors
**Cause**: Code errors, missing files, or configuration issues
**Solution**:
- Check build logs for specific errors
- Fix errors locally first
- Test build locally: `cd frontend && npm run build`

## Quick Checks

### 1. Test Build Locally
```bash
cd frontend
npm ci
npm run build
```
If this fails locally, it will fail on Vercel too.

### 2. Check Vercel Build Logs
Look for these common errors:
- `Module not found` - Missing dependency
- `Cannot find file` - Missing file
- `Syntax error` - Code error
- `Out of memory` - Memory issue
- `Timeout` - Build taking too long

### 3. Check Deployment Configuration
Your `vercel.json`:
```json
{
  "buildCommand": "cd frontend && npm ci && npm run build",
  "outputDirectory": "frontend/dist",
  "installCommand": "cd frontend && npm ci",
  "framework": null
}
```

This looks correct. However, you can optimize it:

## Optimized Configuration

### Option 1: Simplified vercel.json
```json
{
  "buildCommand": "cd frontend && npm run build",
  "outputDirectory": "frontend/dist",
  "installCommand": "cd frontend && npm ci",
  "framework": null
}
```

### Option 2: Remove vercel.json (Let Vercel Auto-detect)
Vercel can auto-detect Vite/React projects. You can:
1. Delete `vercel.json`
2. Set build settings in Vercel dashboard:
   - **Framework Preset**: Vite
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm ci`

## What to Do Right Now

### Step 1: Check Current Status
1. Open Vercel dashboard
2. Go to Deployments
3. Click on the latest deployment
4. Check the status and logs

### Step 2: If Still Building
- **Wait**: If it's been < 15 minutes, large dependencies might still be installing
- **Check logs**: See what step it's stuck on
- **Look for errors**: Red text in logs

### Step 3: If Failed
1. Read the error message in logs
2. Fix the error locally
3. Test build: `cd frontend && npm run build`
4. Commit and push again

### Step 4: If Taking Too Long
1. **Cancel the deployment** (if possible)
2. **Optimize build**:
   - Remove unused dependencies
   - Check for large files
   - Optimize imports
3. **Try again** with optimized build

## Quick Fix: Cancel and Retry

If deployment is stuck:
1. Go to Vercel dashboard → Deployments
2. Find the stuck deployment
3. Click **"..."** → **Cancel**
4. Make a small change (add a comment)
5. Commit and push to trigger a new deployment

## Alternative: Deploy from Vercel Dashboard

If Git deployments are having issues:
1. Go to Vercel dashboard → Settings → Git
2. Disconnect and reconnect your repository
3. Or manually deploy from dashboard:
   - Go to Deployments
   - Click **"..."** → **Redeploy**
   - Or upload a build manually

## Environment Variables Check

Make sure `VITE_API_URL` is set:
1. Go to Settings → Environment Variables
2. Verify `VITE_API_URL` is set to `https://proteinarchitect-backend.onrender.com`
3. Scope: Production (and Preview)

## Next Steps

1. **Check the deployment logs** right now
2. **Share any error messages** you see
3. **Try building locally** to catch issues early
4. **Optimize if needed** based on what you find

Most likely causes:
- Large dependencies taking time to install (normal for first deploy)
- Build error that needs fixing
- Network issues (rare)

Check your Vercel dashboard and let me know what you see in the logs!


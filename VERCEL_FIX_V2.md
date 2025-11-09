# Vercel Deployment Fix v2

## Issue
Vercel error: `should NOT have additional property 'rootDirectory'`

## Solution

The `rootDirectory` property is **not valid** in `vercel.json`. Instead, we need to:

### Option 1: Use Build Commands (Current Fix)

Updated `vercel.json` to use build commands that change into the frontend directory:

```json
{
  "buildCommand": "cd frontend && npm ci && npm run build",
  "outputDirectory": "frontend/dist",
  "installCommand": "cd frontend && npm ci",
  "framework": null
}
```

### Option 2: Set Root Directory in Vercel Dashboard (Recommended)

**Better approach**: Set the root directory in Vercel project settings:

1. Go to Vercel Dashboard
2. Select your project
3. Go to **Settings** → **General**
4. Scroll to **Root Directory**
5. Set it to: `frontend`
6. Click **Save**

Then you can use a simpler `vercel.json`:

```json
{
  "buildCommand": "npm ci && npm run build",
  "outputDirectory": "dist",
  "installCommand": "npm ci"
}
```

Or even simpler - Vercel will auto-detect Vite if the root directory is set correctly.

## Current Fix Applied

We've updated `vercel.json` to use build commands with `cd frontend`. This should work without needing to change dashboard settings.

## Next Steps

1. **Commit and push the updated vercel.json**:
   ```bash
   git add vercel.json
   git commit -m "Fix vercel.json: Remove invalid rootDirectory property"
   git push origin main
   ```

2. **OR set root directory in dashboard** (better long-term solution):
   - Go to Vercel Dashboard → Project Settings → General
   - Set Root Directory to `frontend`
   - Save and redeploy

## Verification

After deploying, verify:
- ✅ Build completes successfully
- ✅ No schema validation errors
- ✅ Application deploys correctly
- ✅ zustand import works

Good luck! 🚀


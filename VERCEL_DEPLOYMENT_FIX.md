# Vercel Deployment Fix Guide

## Issue
Vercel build failing with error:
```
[vite]: Rollup failed to resolve import "zustand" from "/vercel/path0/frontend/src/store/proteinStore.js"
```

## Solution

### 1. Updated `vercel.json`
Created/updated `vercel.json` in the root directory with:
```json
{
  "buildCommand": "npm ci && npm run build",
  "outputDirectory": "dist",
  "installCommand": "npm ci",
  "framework": "vite",
  "rootDirectory": "frontend"
}
```

This tells Vercel to:
- Treat `frontend/` as the root directory
- Use `npm ci` for faster, reliable installs
- Build from the frontend directory

### 2. Updated `vite.config.js`
Added build configuration to help with module resolution:
```js
build: {
  rollupOptions: {
    output: {
      manualChunks: undefined
    }
  }
},
resolve: {
  preserveSymlinks: false
}
```

### 3. Ensure `package-lock.json` is committed
The `package-lock.json` file should be committed to git for Vercel to install exact dependencies:
```bash
git add frontend/package-lock.json
git commit -m "Add package-lock.json for Vercel deployment"
```

## Steps to Deploy

1. **Commit the changes**:
   ```bash
   git add vercel.json frontend/vite.config.js frontend/package-lock.json
   git commit -m "Fix Vercel deployment configuration"
   git push
   ```

2. **Deploy to Vercel**:
   - If using Vercel CLI: `vercel --prod`
   - If using GitHub integration: Push to main branch (auto-deploys)

3. **Verify deployment**:
   - Check Vercel dashboard for build logs
   - Ensure `npm ci` runs successfully
   - Ensure `npm run build` completes without errors

## Alternative: Deploy Frontend Directory Only

If the above doesn't work, you can deploy just the frontend directory:

1. **In Vercel Dashboard**:
   - Go to project settings
   - Set "Root Directory" to `frontend`
   - Save and redeploy

2. **Or use Vercel CLI**:
   ```bash
   cd frontend
   vercel --prod
   ```

## Troubleshooting

### If build still fails:

1. **Check Vercel build logs** for specific errors
2. **Verify dependencies** are in `frontend/package.json`
3. **Clear Vercel cache** and rebuild
4. **Check Node version** matches local (should be in `package.json`)

### If zustand still not found:

1. **Verify zustand is in dependencies** (not devDependencies):
   ```json
   "dependencies": {
     "zustand": "^5.0.8"
   }
   ```

2. **Check import syntax**:
   ```js
   import { create } from 'zustand';  // Correct for v5
   ```

3. **Reinstall dependencies locally**:
   ```bash
   cd frontend
   rm -rf node_modules package-lock.json
   npm install
   ```

## Files Changed

- ✅ `vercel.json` - Vercel configuration
- ✅ `frontend/vite.config.js` - Added build/resolve options
- ✅ `frontend/package.json` - Already has zustand (no changes needed)
- ✅ `frontend/package-lock.json` - Should be committed

## Verification

After deployment, verify:
1. ✅ Build completes successfully
2. ✅ No zustand import errors
3. ✅ Application loads correctly
4. ✅ All dependencies are installed

Good luck! 🚀


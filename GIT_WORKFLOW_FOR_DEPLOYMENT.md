# Git Workflow for Deployment

## Current Situation

You have local changes that need to be committed and deployed, but others may have pushed changes to the remote repository.

## Safe Workflow

### Step 1: Check for Remote Changes

```bash
git fetch origin
git status
```

This will show if there are remote changes you don't have locally.

### Step 2: Stash Your Local Changes (Temporary Save)

```bash
git stash push -m "Vercel deployment fixes"
```

This saves your changes temporarily so you can pull remote changes.

### Step 3: Pull Remote Changes

```bash
git pull origin main
```

This brings in any changes from others.

### Step 4: Apply Your Stashed Changes

```bash
git stash pop
```

This puts your changes back on top of the latest remote changes.

### Step 5: Resolve Any Conflicts (if any)

If there are conflicts:
1. Git will mark conflicted files
2. Open the files and resolve conflicts
3. Stage resolved files: `git add <file>`
4. Continue: `git stash pop` (if still in progress)

### Step 6: Commit Your Changes

```bash
git add vercel.json frontend/vite.config.js frontend/.vercelignore .gitignore VERCEL_DEPLOYMENT_FIX.md
git commit -m "Fix Vercel deployment: Add vercel.json and update vite config"
```

### Step 7: Push to Remote

```bash
git push origin main
```

### Step 8: Deploy to Vercel

After pushing, Vercel should auto-deploy (if GitHub integration is set up).

---

## Alternative: Commit First, Then Pull (If No Conflicts Expected)

If you're confident there won't be conflicts:

```bash
# 1. Commit your changes
git add vercel.json frontend/vite.config.js frontend/.vercelignore .gitignore VERCEL_DEPLOYMENT_FIX.md
git commit -m "Fix Vercel deployment: Add vercel.json and update vite config"

# 2. Pull remote changes (this will create a merge commit if needed)
git pull origin main

# 3. Resolve any conflicts if they occur
# 4. Push
git push origin main
```

---

## Quick Command Sequence

```bash
# Check what's changed
git status

# Fetch remote changes (doesn't modify your working directory)
git fetch origin

# See if there are remote changes
git log HEAD..origin/main --oneline

# If there are remote changes, stash your changes
git stash push -m "Vercel fixes"

# Pull remote changes
git pull origin main

# Apply your changes back
git stash pop

# If conflicts occur, resolve them, then:
git add .
git commit -m "Merge remote changes with Vercel fixes"

# If no conflicts, commit your changes
git add vercel.json frontend/vite.config.js frontend/.vercelignore .gitignore VERCEL_DEPLOYMENT_FIX.md
git commit -m "Fix Vercel deployment: Add vercel.json and update vite config"

# Push
git push origin main
```

---

## What Each File Does

- `vercel.json` - Tells Vercel to build from `frontend/` directory
- `frontend/vite.config.js` - Added build configuration for module resolution
- `frontend/.vercelignore` - Ignore unnecessary files during deployment
- `.gitignore` - Updated comments
- `VERCEL_DEPLOYMENT_FIX.md` - Documentation

---

## If Conflicts Occur

1. **Git will mark conflicted sections** in files:
   ```
   <<<<<<< HEAD
   Your changes
   =======
   Their changes
   >>>>>>> origin/main
   ```

2. **Edit the file** to resolve conflicts (keep both, choose one, or merge)

3. **Stage the resolved file**:
   ```bash
   git add <file>
   ```

4. **Continue the merge**:
   ```bash
   git commit
   ```

---

## Best Practice

Always pull before pushing to avoid conflicts and keep your branch up to date!

Good luck! 🚀


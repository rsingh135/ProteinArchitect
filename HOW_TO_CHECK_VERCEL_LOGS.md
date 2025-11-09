# How to Check Vercel Deployment Logs

## Step-by-Step Guide

### Step 1: Go to Vercel Dashboard
1. Open your web browser
2. Go to: **https://vercel.com/dashboard**
3. Sign in if you're not already logged in

### Step 2: Select Your Project
1. You'll see a list of your projects
2. Click on your **Protein Architect** project (or whatever you named it)

### Step 3: Go to Deployments Tab
1. Once in your project, you'll see several tabs at the top:
   - **Overview**
   - **Deployments** ← Click this one
   - **Analytics**
   - **Settings**
   - etc.

### Step 4: Find the Latest Deployment
1. You'll see a list of deployments (most recent at the top)
2. Each deployment shows:
   - **Status** (Building, Ready, Error, Cancelled)
   - **Commit message**
   - **Time** (when it started)
   - **Duration** (how long it took/is taking)

3. Click on the **latest deployment** (the one at the top)

### Step 5: View Build Logs
Once you click on a deployment, you'll see:

#### Option A: Build Logs Tab
1. Look for a **"Build Logs"** or **"Logs"** tab
2. Click on it to see the full build output

#### Option B: Scroll Down
1. The deployment page will show build logs directly
2. Scroll down to see the full output

### Step 6: Read the Logs
The logs will show:
- **Installing dependencies** - Installing npm packages
- **Building** - Running the build command
- **Error messages** - Red text if something fails
- **Warnings** - Yellow text for warnings
- **Success messages** - Green text when steps complete

## What to Look For

### ✅ Good Signs:
- `Installing dependencies...` (then packages being installed)
- `Building application...`
- `Build completed successfully`
- `Deployment ready`

### ⚠️ Warning Signs:
- `Error:` (red text)
- `Failed to...`
- `Cannot find...`
- `Module not found...`
- `Timeout`
- `Out of memory`

### 🔴 Error Examples:
```
Error: Module not found: Can't resolve './components/SomeComponent'
Error: Command failed: npm run build
Error: Build timeout
Error: Out of memory
```

## Alternative: Check via URL

If you know your deployment URL:
1. The deployment page URL looks like:
   ```
   https://vercel.com/your-username/your-project/deployment-id
   ```
2. You can also click on the deployment in the list to go directly to it

## Quick Navigation Shortcuts

### From Project Page:
1. **Deployments** tab → Click latest deployment → View logs

### Direct Link:
1. Go to: `https://vercel.com/dashboard`
2. Click your project
3. Click **Deployments**
4. Click the latest deployment

## Screenshot Guide (What You'll See)

### 1. Dashboard View:
```
┌─────────────────────────────────────┐
│  Your Projects                      │
│  ┌───────────────────────────────┐  │
│  │ Protein Architect             │  │
│  │ Last deployed: 2 minutes ago  │  │
│  └───────────────────────────────┘  │
└─────────────────────────────────────┘
```

### 2. Project Page:
```
┌─────────────────────────────────────┐
│ Overview | Deployments | Analytics  │
│                                     │
│  Latest Deployments:                │
│  ┌───────────────────────────────┐  │
│  │ 🟡 Building...                │  │
│  │ Commit: "Update config"       │  │
│  │ Started: 10 minutes ago       │  │
│  └───────────────────────────────┘  │
└─────────────────────────────────────┘
```

### 3. Deployment Logs View:
```
┌─────────────────────────────────────┐
│ Deployment Details                  │
│                                     │
│ Status: 🟡 Building                 │
│                                     │
│ Build Logs:                         │
│ ───────────────────────────────────│
│ > Installing dependencies...        │
│ > npm ci                            │
│ > [1/5] Installing packages...      │
│ > [2/5] Installing packages...      │
│ > Building application...           │
│ > npm run build                     │
│ > vite v5.0.8 building...           │
│                                     │
└─────────────────────────────────────┘
```

## What Each Status Means

### 🟡 Building
- Deployment is in progress
- Check logs to see current step
- Normal for first few minutes

### 🟢 Ready
- Deployment completed successfully
- Your site is live!

### 🔴 Error
- Build failed
- Check logs for error messages
- Fix errors and redeploy

### ⚫ Cancelled
- Deployment was cancelled
- Either manually cancelled or timed out

## Pro Tips

### 1. Real-Time Updates
- Logs update in real-time
- Refresh the page to see latest updates
- Keep the tab open to watch progress

### 2. Search in Logs
- Use `Ctrl+F` (or `Cmd+F` on Mac) to search logs
- Search for "error", "failed", "warning"

### 3. Copy Logs
- Select text in logs to copy
- Useful for sharing errors or debugging

### 4. Download Logs
- Some deployments allow downloading full logs
- Look for a download button

## If You Can't Find Logs

### Check These:
1. **Are you in the right project?** - Make sure you clicked the correct project
2. **Are you in Deployments tab?** - Not Overview or Settings
3. **Is the deployment listed?** - Check if it's still building or completed
4. **Try refreshing** - Sometimes the page needs a refresh

### Still Can't Find It?
1. Go to: `https://vercel.com/dashboard`
2. Click your project name
3. Click **Deployments** (top menu)
4. Look for the most recent deployment (should be at the top)
5. Click on it - logs should be visible

## Next Steps After Checking Logs

### If Building:
- **Wait** if it's installing dependencies (can take 10-15 min first time)
- **Monitor** for any errors
- **Be patient** - large dependencies take time

### If Error:
1. **Read the error message** carefully
2. **Note the specific error** (file, line, module)
3. **Fix the error** locally
4. **Test build locally**: `cd frontend && npm run build`
5. **Commit and push** to trigger new deployment

### If Ready:
1. **Celebrate!** 🎉
2. **Visit your site** - click the deployment URL
3. **Test the features** - make sure everything works
4. **Check environment variables** - verify `VITE_API_URL` is set

## Quick Checklist

- [ ] Opened Vercel dashboard
- [ ] Selected correct project
- [ ] Clicked Deployments tab
- [ ] Clicked latest deployment
- [ ] Viewed build logs
- [ ] Checked for errors
- [ ] Noted current status

## Still Need Help?

If you're still having trouble:
1. **Share what you see** - What status is showing?
2. **Share any error messages** - Copy/paste the error
3. **Share a screenshot** - If possible
4. **Describe the issue** - What's happening?

Now go check your logs and let me know what you see! 🚀


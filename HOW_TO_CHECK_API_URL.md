# How to Check API URL in Browser Console

## Why You Got That Error

The error `Cannot use 'import.meta' outside a module` happens because `import.meta` only works in ES modules, not in the browser console directly.

## Solution 1: Check Existing Log Message (Easiest)

Your code **already logs** the API configuration when the page loads! Just look for it:

1. **Open your Vercel site**
2. **Open Console** (F12 → Console tab)
3. **Refresh the page** (F5)
4. **Look for this message** at the top of the console:
   ```
   🔧 API Configuration: {
     VITE_API_URL: "https://proteinarchitect-backend.onrender.com",
     API_URL: "https://proteinarchitect-backend.onrender.com",
     environment: "production",
     isProduction: true
   }
   ```

### What to Look For:

**✅ Good (Env var is set):**
```
🔧 API Configuration: {
  VITE_API_URL: "https://proteinarchitect-backend.onrender.com",
  API_URL: "https://proteinarchitect-backend.onrender.com",
  ...
}
```

**❌ Bad (Env var NOT set):**
```
🔧 API Configuration: {
  VITE_API_URL: "NOT SET",
  API_URL: "http://localhost:8000",
  ...
}
```

## Solution 2: Check Network Tab

This is the **easiest way** to see what's happening:

1. **Open your Vercel site**
2. **Open Developer Tools** (F12)
3. **Click "Network" tab**
4. **Try using a feature** (search, research, etc.)
5. **Look at the requests**:
   - ✅ **Good**: Requests go to `proteinarchitect-backend.onrender.com`
   - ❌ **Bad**: Requests go to `localhost:8000` (and fail)

### Example - What You'll See:

**✅ Good:**
```
Request URL: https://proteinarchitect-backend.onrender.com/health
Status: 200 OK
```

**❌ Bad:**
```
Request URL: http://localhost:8000/health
Status: (failed) net::ERR_CONNECTION_REFUSED
```

## Solution 3: Expose API URL to Window (Advanced)

If you want to check it in the console, we can expose it. But you don't need to - just use Solution 1 or 2!

## Quick Check Steps

### Step 1: Open Console
1. Open your Vercel site
2. Press `F12`
3. Click **Console** tab

### Step 2: Refresh Page
1. Press `F5` to refresh
2. Look at the **top** of the console output
3. Find the `🔧 API Configuration:` message

### Step 3: Check the Value
- If `VITE_API_URL` shows the Render URL → ✅ **Working!**
- If `VITE_API_URL` shows "NOT SET" → ❌ **Not set, need to fix**

## Alternative: Check Network Tab

1. Open **Network** tab (instead of Console)
2. Try using a feature
3. Look at the request URLs
4. See where they're going

## What the Log Message Means

When your page loads, the `api.js` file automatically logs:
```javascript
console.log('🔧 API Configuration:', {
  VITE_API_URL: import.meta.env.VITE_API_URL || 'NOT SET',
  API_URL: API_URL,
  environment: import.meta.env.MODE,
  isProduction: import.meta.env.PROD
});
```

This happens **automatically** - you don't need to run any commands!

## Still Can't Find It?

### Check 1: Clear Console
1. Click the **clear button** (🚫) in the console
2. Refresh the page (F5)
3. Look for the `🔧 API Configuration:` message

### Check 2: Filter Console
1. In the console, look for a filter/search box
2. Type: `API Configuration`
3. This will show only that message

### Check 3: Check Network Tab Instead
1. Go to **Network** tab
2. Try using a feature
3. See what URLs are being requested

## Summary

**You don't need to run any commands!** Just:
1. Open Console (F12)
2. Refresh page (F5)
3. Look for `🔧 API Configuration:` message
4. Check if `VITE_API_URL` shows the Render URL or "NOT SET"

OR

1. Open Network tab (F12 → Network)
2. Try using a feature
3. Check if requests go to Render backend or localhost

## Next Steps

After checking:
- **If it shows the Render URL**: ✅ Working! The error might be something else
- **If it shows "NOT SET"**: ❌ Need to set env var and redeploy
- **If requests go to localhost**: ❌ Need to set env var and redeploy

What do you see when you refresh the page and check the console?


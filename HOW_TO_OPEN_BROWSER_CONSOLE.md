# How to Open Browser Console

## Quick Method (Keyboard Shortcuts)

### Chrome / Edge (Windows/Linux)
1. Press `F12` key
   OR
2. Press `Ctrl + Shift + J` (simultaneously)

### Chrome / Edge (Mac)
1. Press `F12` key
   OR
2. Press `Cmd + Option + J` (simultaneously)

### Firefox (Windows/Linux)
1. Press `F12` key
   OR
2. Press `Ctrl + Shift + K` (simultaneously)

### Firefox (Mac)
1. Press `F12` key
   OR
2. Press `Cmd + Option + K` (simultaneously)

### Safari (Mac)
1. First enable Developer menu:
   - Go to Safari → Settings → Advanced
   - Check "Show Develop menu in menu bar"
2. Then press `Cmd + Option + C`

## Alternative Method (Right-Click)

1. **Right-click** anywhere on the webpage
2. Click **"Inspect"** or **"Inspect Element"**
3. Click the **"Console"** tab at the top

## Step-by-Step (Menu Method)

### Chrome / Edge
1. Click the **three dots** (⋮) in the top-right corner
2. Go to **More Tools** → **Developer Tools**
3. Click the **"Console"** tab

### Firefox
1. Click the **three lines** (☰) in the top-right corner
2. Go to **More Tools** → **Web Developer Tools**
3. Click the **"Console"** tab

### Safari
1. Go to **Safari** → **Settings** → **Advanced**
2. Check **"Show Develop menu in menu bar"**
3. Go to **Develop** → **Show JavaScript Console**

## What You'll See

Once the console is open, you'll see:
- A panel at the bottom or side of your browser
- A text input at the bottom (this is where you type)
- Log messages and errors displayed above

## Running the Diagnostic Command

1. **Click** in the text input at the bottom of the console
2. **Type** or **paste** this command:
   ```javascript
   console.log('VITE_API_URL:', import.meta.env.VITE_API_URL);
   ```
3. **Press Enter**

## What to Look For

### ✅ Good Result:
```
VITE_API_URL: https://proteinarchitect-backend.onrender.com
```
This means the environment variable is set correctly!

### ❌ Bad Result:
```
VITE_API_URL: undefined
```
This means the environment variable is NOT set or not included in the build.

## Additional Diagnostic Commands

You can also run these in the console:

### Check API Configuration:
```javascript
console.log('API Config:', {
  VITE_API_URL: import.meta.env.VITE_API_URL,
  MODE: import.meta.env.MODE,
  PROD: import.meta.env.PROD
});
```

### Check All Environment Variables:
```javascript
console.log('All env vars:', import.meta.env);
```

## Visual Guide

```
┌─────────────────────────────────────┐
│  Your Website                       │
│                                     │
│  [Content of your site]             │
│                                     │
├─────────────────────────────────────┤
│  Console                            │
│  ─────────────────────────────────  │
│  > [Type command here]              │
│                                     │
│  Output will appear above this line │
└─────────────────────────────────────┘
```

## Troubleshooting

### Console Won't Open?
- Try a different keyboard shortcut
- Try right-clicking and selecting "Inspect"
- Try refreshing the page first (F5)

### Can't Type in Console?
- Make sure you clicked in the console panel
- Look for the blinking cursor at the bottom
- Try clicking the text input area

### Don't See Console Tab?
- Look for tabs at the top: Console, Network, Elements, etc.
- Click the "Console" tab
- If you don't see it, try pressing `Esc` key to toggle it

## Quick Reference

| Browser | Windows/Linux | Mac |
|---------|---------------|-----|
| Chrome | `F12` or `Ctrl+Shift+J` | `F12` or `Cmd+Option+J` |
| Edge | `F12` or `Ctrl+Shift+J` | `F12` or `Cmd+Option+J` |
| Firefox | `F12` or `Ctrl+Shift+K` | `F12` or `Cmd+Option+K` |
| Safari | N/A | `Cmd+Option+C` (after enabling Develop menu) |

## Next Steps

After running the diagnostic:
1. **Check the output** - What does it show?
2. **Share the result** - Let me know what you see
3. **Fix if needed** - Based on the result, we can fix the issue

The console is your best friend for debugging! 🐛


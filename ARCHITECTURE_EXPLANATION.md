# Architecture Explanation: Why Backend is Needed

## The Core Limitation

**You CANNOT avoid running a backend server** for the AgenticResearch functionality. Here's why:

### 1. **Python Dependencies**
- `AgenticResearch.py` uses Python libraries: `dedalus-labs`, `httpx`, `asyncio`
- **Browsers cannot run Python code** - they only run JavaScript
- The Dedalus Labs SDK is a **Python package**, not a JavaScript library

### 2. **API Key Security**
- `DEDALUS_API_KEY` must be kept **secret** (server-side only)
- If you put it in the frontend, anyone can see it in the browser's developer tools
- This would allow others to use your API key and rack up charges

### 3. **CORS & Browser Security**
- Dedalus Labs API likely doesn't allow direct browser calls (CORS restrictions)
- Even if it did, exposing API keys in client code is a security risk

### 4. **Server-Side Processing**
- The research tasks are **long-running** (5-15 minutes)
- Browsers have timeout limits for requests
- Server-side processing is more reliable for async operations

## Current Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (Browser)                        │
│  - React/JavaScript                                          │
│  - Cannot run Python                                         │
│  - Makes HTTP requests                                       │
└────────────────────┬────────────────────────────────────────┘
                     │ HTTP Request
                     │ (protein_id: "P01308")
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                    Backend (Python Server)                  │
│  - FastAPI                                                   │
│  - Runs AgenticResearch.py                                  │
│  - Uses dedalus-labs Python SDK                             │
│  - Keeps API keys secure                                     │
└────────────────────┬────────────────────────────────────────┘
                     │ API Call
                     │ (with DEDALUS_API_KEY)
                     ▼
┌─────────────────────────────────────────────────────────────┐
│              Dedalus Labs API (External)                    │
│  - Processes research request                                │
│  - Uses MCP servers (exa-search, brave-search)              │
│  - Returns research results                                  │
└─────────────────────────────────────────────────────────────┘
```

## Why You Can't Skip the Backend

### ❌ What WON'T Work:

1. **Direct browser calls to Dedalus Labs**
   - No JavaScript SDK available
   - CORS restrictions
   - API key security risk

2. **Importing Python in JavaScript**
   - Browsers don't support Python
   - Pyodide exists but is complex and limited

3. **Client-side only**
   - Can't keep API keys secret
   - Can't use Python libraries

## Alternatives (Still Require a Server)

### Option 1: Serverless Functions (Easier Deployment)

Use Vercel/Netlify Functions:

```javascript
// frontend/src/api/research.js
export async function researchProtein(proteinId) {
  // Calls serverless function
  const response = await fetch('/api/research', {
    method: 'POST',
    body: JSON.stringify({ protein_id: proteinId })
  });
  return response.json();
}
```

**Pros:**
- No need to manually start server
- Auto-deploys with frontend
- Scales automatically

**Cons:**
- Still needs deployment
- Cold starts can be slow
- More complex setup

### Option 2: Simplify Backend Startup

Make it easier to start (what we've done):
- `start_backend.bat` - Double-click to start
- Better error messages
- Auto-install dependencies

### Option 3: Use a Different Architecture

If you want to avoid Python backend entirely, you'd need:
- A JavaScript/TypeScript SDK for Dedalus Labs (doesn't exist)
- Or a different research service with a JavaScript SDK
- Or build your own research service in Node.js

## The Reality

**The backend IS necessary** because:
1. ✅ Python libraries (dedalus-labs) require Python runtime
2. ✅ API key security requires server-side storage
3. ✅ Long-running tasks need server-side processing
4. ✅ CORS and browser security limitations

## Best Solution: Make Backend Easier to Start

Instead of removing the backend, we've made it easier:
- ✅ `start_backend.bat` - One-click startup
- ✅ Auto-installs dependencies
- ✅ Better error messages
- ✅ Port conflict detection

## Recommendation

**Keep the backend**, but make it easier:
1. Use `start_backend.bat` to start it
2. Keep it running in the background
3. Consider deploying to a cloud service (Vercel, Railway, Render) for production

The backend is a **necessary component** - it's not a limitation, it's the architecture that enables secure, powerful research functionality.




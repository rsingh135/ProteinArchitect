# ⚡ Render Build Optimization Guide

## Problem
Render is redownloading all dependencies on every deploy, which is slow and wasteful. This happens because:
1. No build cache is being used
2. Build command doesn't leverage pip cache
3. Heavy dependencies (torch, transformers, etc.) are downloaded fresh each time

## Solutions

### Solution 1: Use Pip Cache (Quick Fix) ⚡

**Update your `render.yaml`:**

```yaml
services:
  - type: web
    name: genlab-backend
    env: python
    region: oregon
    plan: free
    buildCommand: |
      cd backend && \
      pip install --upgrade pip setuptools wheel && \
      pip install --cache-dir ~/.cache/pip -r requirements.txt
    startCommand: cd backend && uvicorn main:app --host 0.0.0.0 --port $PORT
    # ... rest of config
```

**Or update `nixpacks.toml`:**

```toml
[phases.install]
cmds = [
  "cd backend && pip install --upgrade pip setuptools wheel",
  "cd backend && pip install --cache-dir ~/.cache/pip -r requirements.txt"
]
```

### Solution 2: Use Dockerfile with Layer Caching (Recommended) 🐳

Create a `Dockerfile` in the root directory:

```dockerfile
FROM python:3.11-slim

WORKDIR /app

# Install system dependencies (if needed)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first (for better caching)
COPY backend/requirements.txt /app/backend/requirements.txt

# Install Python dependencies (this layer will be cached if requirements.txt doesn't change)
RUN pip install --no-cache-dir --upgrade pip setuptools wheel && \
    pip install --no-cache-dir -r backend/requirements.txt

# Copy application code
COPY backend /app/backend

# Set working directory
WORKDIR /app/backend

# Expose port
EXPOSE $PORT

# Start command
CMD uvicorn main:app --host 0.0.0.0 --port $PORT
```

**Update `render.yaml` to use Docker:**

```yaml
services:
  - type: web
    name: genlab-backend
    dockerfilePath: ./Dockerfile
    dockerContext: .
    plan: free
    envVars:
      # ... your environment variables
```

**Benefits:**
- ✅ Docker layers are cached - only reinstalls if requirements.txt changes
- ✅ Much faster builds (2-5 minutes instead of 10-15 minutes)
- ✅ More control over the build process

### Solution 3: Optimize requirements.txt (Reduce Dependencies)

**Split requirements into core and optional:**

Create `backend/requirements-core.txt`:
```txt
# Core dependencies only
setuptools>=68.0.0
wheel
fastapi>=0.104.1
uvicorn[standard]>=0.24.0
pydantic>=2.5.0
python-dotenv>=1.0.0
httpx>=0.25.2
requests>=2.31.0
```

Create `backend/requirements-ml.txt` (optional, only if needed):
```txt
# Heavy ML dependencies (only install if actually used)
numpy>=1.26.0
scikit-learn>=1.3.2
torch>=2.0.0
pandas>=2.0.0
transformers>=4.30.0
fair-esm>=2.0.0
```

**Then use only what you need in production:**

```yaml
buildCommand: cd backend && pip install -r requirements-core.txt
```

### Solution 4: Use Render's Build Cache (If Available)

Render's paid tiers have better build caching. For free tier, use Solution 1 or 2.

### Solution 5: Pin Dependency Versions (Better Caching)

Instead of `>=` versions, pin exact versions in `requirements.txt`:

```txt
# Pinned versions (better for caching)
fastapi==0.104.1
uvicorn[standard]==0.24.0
pydantic==2.5.0
numpy==1.26.0
# ... etc
```

**Generate pinned versions:**
```bash
cd backend
pip install pip-tools
pip-compile requirements.in  # Creates requirements.txt with pinned versions
```

## Recommended Approach

**For Free Tier (Quick Fix):**
1. Use Solution 1 (pip cache) - easiest, works immediately
2. Consider Solution 3 (reduce dependencies) if you don't need all ML libraries

**For Best Performance:**
1. Use Solution 2 (Dockerfile) - best caching, fastest builds
2. Combine with Solution 5 (pinned versions) - most reliable

## Implementation Steps

### Option A: Quick Fix (5 minutes)

1. Update `render.yaml`:
```yaml
buildCommand: |
  cd backend && \
  pip install --upgrade pip setuptools wheel && \
  pip install --cache-dir ~/.cache/pip -r requirements.txt
```

2. Commit and push:
```bash
git add render.yaml
git commit -m "Optimize Render build with pip cache"
git push
```

3. Deploy and check build time (should be slightly faster)

### Option B: Dockerfile (15 minutes, Best Results)

1. Create `Dockerfile` in root directory (see Solution 2 above)

2. Update `render.yaml`:
```yaml
services:
  - type: web
    name: genlab-backend
    dockerfilePath: ./Dockerfile
    dockerContext: .
    plan: free
    # Remove buildCommand, use Dockerfile instead
    envVars:
      # ... your existing env vars
```

3. Update Render service:
   - Go to Render Dashboard
   - Your service → Settings
   - Change "Docker" to use the Dockerfile
   - Or update via `render.yaml` and redeploy

4. Commit and push:
```bash
git add Dockerfile render.yaml
git commit -m "Add Dockerfile for better build caching"
git push
```

5. First build will be slow (downloads base image), subsequent builds will be much faster!

## Expected Results

**Before:**
- Build time: 10-15 minutes
- Downloads all dependencies every time
- No caching

**After (with Dockerfile):**
- First build: 10-15 minutes (downloads base image)
- Subsequent builds: 2-5 minutes (uses cached layers)
- Only reinstalls if requirements.txt changes

**After (with pip cache):**
- Build time: 8-12 minutes (slight improvement)
- Some caching, but not as effective as Docker

## Troubleshooting

### Build still slow?
- Check if requirements.txt is changing frequently
- Verify Docker layers are being cached (check Render logs)
- Consider reducing dependencies (Solution 3)

### Docker build fails?
- Check Dockerfile syntax
- Verify all paths are correct
- Check Render logs for specific errors

### Cache not working?
- Render free tier has limited caching
- Docker caching is more reliable
- Consider upgrading to paid tier for better caching

## Additional Tips

1. **Monitor Build Times**: Check Render dashboard to see actual build times
2. **Use .dockerignore**: Create `.dockerignore` to exclude unnecessary files:
   ```
   node_modules
   .git
   venv
   __pycache__
   *.pyc
   .env
   ```

3. **Multi-stage Builds** (Advanced): For even smaller images:
   ```dockerfile
   FROM python:3.11-slim as builder
   WORKDIR /app
   COPY backend/requirements.txt .
   RUN pip install --user -r requirements.txt
   
   FROM python:3.11-slim
   WORKDIR /app
   COPY --from=builder /root/.local /root/.local
   COPY backend /app/backend
   ENV PATH=/root/.local/bin:$PATH
   CMD uvicorn main:app --host 0.0.0.0 --port $PORT
   ```

## Summary

**Quick Fix**: Update build command to use pip cache (Solution 1)
**Best Solution**: Use Dockerfile with layer caching (Solution 2)
**Long-term**: Reduce dependencies and pin versions (Solutions 3 & 5)

Choose the solution that fits your needs and time constraints!


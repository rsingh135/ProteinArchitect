# How to Start the Backend Server

## Quick Start (Windows)

### Option 1: Using the Batch Script (Easiest)
1. Double-click `start_backend.bat` in the `backend` folder
2. The server will start automatically

### Option 2: Manual Start

1. **Open PowerShell or Command Prompt**

2. **Navigate to the backend directory:**
   ```powershell
   cd "D:\My Projects\HackPrinceton2025\GenLab\backend"
   ```

3. **Activate virtual environment (if you have one):**
   ```powershell
   .\venv\Scripts\Activate.ps1
   ```
   Or if that doesn't work:
   ```powershell
   venv\Scripts\activate.bat
   ```

4. **Install dependencies (if not already installed):**
   ```powershell
   pip install -r requirements.txt
   ```

5. **Start the server:**
   ```powershell
   uvicorn main:app --reload --port 8000
   ```

6. **Verify it's running:**
   - Open your browser and go to: http://localhost:8000/docs
   - You should see the FastAPI documentation page

## Troubleshooting

### Port 8000 already in use
If you get an error that port 8000 is already in use:
- Find and close the process using port 8000, OR
- Use a different port: `uvicorn main:app --reload --port 8001`
- Then update the frontend API_URL in `ResearchOverview.jsx` to use port 8001

### Missing DEDALUS_API_KEY
The server will start even without this key, but research functionality won't work.
- Get your API key from https://dedaluslabs.ai
- Add it to `.env` file in the backend directory:
  ```
  DEDALUS_API_KEY=your_api_key_here
  ```

### Module not found errors
Make sure all dependencies are installed:
```powershell
pip install -r requirements.txt
```

## Verify Server is Running

Once started, you should see:
```
INFO:     Uvicorn running on http://127.0.0.1:8000 (Press CTRL+C to quit)
INFO:     Started reloader process
INFO:     Started server process
INFO:     Waiting for application startup.
INFO:     Application startup complete.
```

Then test the health endpoint:
- Open: http://localhost:8000/health
- Should return: `{"status":"healthy"}`




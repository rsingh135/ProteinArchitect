# 🎨 Starting the Frontend

## Quick Start

Since your backend is already running on `http://localhost:8000`, you just need to start the frontend in a **new terminal window**.

### Step 1: Open a New Terminal

Keep your backend terminal running, and open a **new terminal window/tab**.

### Step 2: Navigate to Frontend Directory

```bash
cd /Users/ranveersingh/GenLab/frontend
```

### Step 3: Install Dependencies (First Time Only)

```bash
npm install
```

This will install all React and Three.js dependencies. It may take 1-2 minutes.

### Step 4: Start Frontend Development Server

```bash
npm run dev
```

You should see output like:
```
  VITE v5.0.8  ready in 500 ms

  ➜  Local:   http://localhost:3000/
  ➜  Network: use --host to expose
```

### Step 5: Open in Browser

Open your browser and go to:
**http://localhost:3000**

## 🎯 You're All Set!

Now you have:
- ✅ **Backend** running on `http://localhost:8000`
- ✅ **Frontend** running on `http://localhost:3000`

The frontend will automatically connect to the backend API.

## 🧪 Test It Out

1. Fill in the protein design form
2. Click "Generate Protein"
3. Explore the 3D visualization tab
4. Check the manufacturing protocol tab

## 🔧 Troubleshooting

### Port 3000 Already in Use?

If port 3000 is busy, Vite will automatically use the next available port (like 3001, 3002, etc.). Check the terminal output for the actual URL.

### Frontend Can't Connect to Backend?

1. Make sure backend is still running on port 8000
2. Check browser console for errors (F12 → Console tab)
3. Verify CORS is enabled (it should be in the backend code)

### npm install Fails?

Try:
```bash
# Clear npm cache
npm cache clean --force

# Remove node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

## 📝 Quick Reference

```bash
# Start frontend (from frontend directory)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```


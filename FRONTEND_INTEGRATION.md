# 🎨 Frontend Integration Guide

## Adding PPI Prediction to Your Existing App

Since you like your current frontend setup, here's how to minimally integrate the PPI Prediction component.

## Option 1: Add as New Tab (Recommended)

Update `frontend/src/App.jsx`:

```jsx
import React, { useState } from 'react';
import MainLayout from './components/layout/MainLayout';
import DualViewer from './components/viewer/DualViewer';
import AnalysisDashboard from './components/analysis/AnalysisDashboard';
import PPIPrediction from './components/PPIPrediction'; // Add this
import AIChat from './components/chat/AIChat';
import { Layers, BarChart3, Dna } from 'lucide-react'; // Add Dna icon

function App() {
  const [activeView, setActiveView] = useState('viewer');

  return (
    <MainLayout>
      <div className="h-full w-full flex flex-col">
        {/* View Toggle */}
        <div className="flex items-center justify-center p-4 bg-white border-b border-gray-200">
          <div className="inline-flex rounded-lg border border-gray-200 p-1 bg-gray-50">
            <button
              onClick={() => setActiveView('viewer')}
              className={`px-6 py-2 rounded-md text-sm font-medium transition-all flex items-center space-x-2 ${
                activeView === 'viewer'
                  ? 'bg-white text-primary-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>3D Viewer</span>
            </button>
            <button
              onClick={() => setActiveView('analysis')}
              className={`px-6 py-2 rounded-md text-sm font-medium transition-all flex items-center space-x-2 ${
                activeView === 'analysis'
                  ? 'bg-white text-primary-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>Analysis Dashboard</span>
            </button>
            {/* Add PPI Prediction Tab */}
            <button
              onClick={() => setActiveView('ppi')}
              className={`px-6 py-2 rounded-md text-sm font-medium transition-all flex items-center space-x-2 ${
                activeView === 'ppi'
                  ? 'bg-white text-primary-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Dna className="w-4 h-4" />
              <span>PPI Prediction</span>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 w-full overflow-hidden bg-gray-50">
          {activeView === 'viewer' && <DualViewer />}
          {activeView === 'analysis' && <AnalysisDashboard />}
          {activeView === 'ppi' && <PPIPrediction />} {/* Add this */}
        </div>
      </div>

      {/* AI Chat (Floating) */}
      <AIChat />
    </MainLayout>
  );
}

export default App;
```

## Option 2: Add as Route (If using React Router)

If you're using React Router, add a route:

```jsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import PPIPrediction from './components/PPIPrediction';

// In your router
<Routes>
  <Route path="/" element={<DualViewer />} />
  <Route path="/analysis" element={<AnalysisDashboard />} />
  <Route path="/ppi" element={<PPIPrediction />} />
</Routes>
```

## Option 3: Add to Navbar

Add a link in your Navbar component:

```jsx
// In components/layout/Navbar.jsx
<nav>
  <Link to="/viewer">3D Viewer</Link>
  <Link to="/analysis">Analysis</Link>
  <Link to="/ppi">PPI Prediction</Link>
</nav>
```

## Styling Integration

The `PPIPrediction.css` uses its own styles, but you can customize to match your theme:

```css
/* Match your primary colors */
.ppi-prediction-container {
  /* Your styles */
}

/* Match your button styles */
.predict-button {
  /* Your button styles */
}
```

## API Configuration

Make sure your backend is running on `http://localhost:8000` (or update the URLs in `PPIPrediction.jsx`):

```jsx
// In PPIPrediction.jsx, update if needed:
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';
```

## Testing

1. Start backend:
   ```bash
   cd backend
   source venv/bin/activate
   uvicorn main:app --reload --port 8000
   ```

2. Start frontend:
   ```bash
   cd frontend
   npm run dev
   ```

3. Navigate to PPI Prediction tab
4. Test the workflow:
   - Search for "human insulin"
   - Select a protein
   - Search for another protein
   - Select second protein
   - Click "Predict Interaction"
   - View results

## Troubleshooting

### NGL Viewer Not Loading
- Check browser console for errors
- Ensure CDN is accessible
- Try loading NGL Viewer manually in browser

### API Calls Failing
- Check backend is running
- Check CORS settings
- Check network tab in browser dev tools

### Styles Not Matching
- Update CSS variables in `PPIPrediction.css`
- Match your theme colors
- Adjust spacing/padding as needed

## Minimal Changes Summary

**Files to modify:**
- `frontend/src/App.jsx` - Add tab/route
- (Optional) `frontend/src/components/layout/Navbar.jsx` - Add link

**Files added:**
- `frontend/src/components/PPIPrediction.jsx`
- `frontend/src/components/PPIPrediction.css`

**No changes needed to:**
- Existing components
- Existing routes
- Existing styles (unless you want to match them)

That's it! The component is self-contained and won't affect your existing setup.


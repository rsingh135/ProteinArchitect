import React, { useState } from 'react';
import MainLayout from './components/layout/MainLayout';
import DualViewer from './components/viewer/DualViewer';
import AnalysisDashboard from './components/analysis/AnalysisDashboard';
import AIChat from './components/chat/AIChat';
import { Layers, BarChart3 } from 'lucide-react';

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
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 w-full overflow-hidden bg-gray-50">
          {activeView === 'viewer' && <DualViewer />}
          {activeView === 'analysis' && <AnalysisDashboard />}
        </div>
      </div>

      {/* AI Chat (Floating) */}
      <AIChat />
    </MainLayout>
  );
}

export default App;


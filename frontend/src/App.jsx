import React, { useState } from 'react';
import MainLayout from './components/layout/MainLayout';
import DualViewer from './components/viewer/DualViewer';
import AnalysisDashboard from './components/analysis/AnalysisDashboard';
import AIChat from './components/chat/AIChat';
import { Layers, BarChart3 } from 'lucide-react';

function App() {
  const [activeView, setActiveView] = useState('viewer'); // 'viewer' | 'analysis'

  return (
    <MainLayout>
      {/* Main Content Area */}
      <div className="h-full flex flex-col">
        {/* View Toggle */}
        <div className="flex items-center justify-center p-2 border-b border-dark-border">
          <div className="glass rounded-lg p-1 flex space-x-1">
            <button
              onClick={() => setActiveView('viewer')}
              className={`px-6 py-2 rounded-md text-sm font-medium transition-all duration-300 flex items-center space-x-2 ${
                activeView === 'viewer'
                  ? 'bg-neon-cyan/20 text-neon-cyan shadow-neon-cyan'
                  : 'text-gray-400 hover:text-white hover:bg-dark-hover'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>3D Viewer</span>
            </button>
            <button
              onClick={() => setActiveView('analysis')}
              className={`px-6 py-2 rounded-md text-sm font-medium transition-all duration-300 flex items-center space-x-2 ${
                activeView === 'analysis'
                  ? 'bg-neon-purple/20 text-neon-purple shadow-neon-purple'
                  : 'text-gray-400 hover:text-white hover:bg-dark-hover'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>Analysis Dashboard</span>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
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


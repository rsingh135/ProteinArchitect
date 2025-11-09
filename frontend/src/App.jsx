import React, { useState, useEffect } from 'react';
import MainLayout from './components/layout/MainLayout';
import DualViewer from './components/viewer/DualViewer';
import AnalysisDashboard from './components/analysis/AnalysisDashboard';
import PPIPrediction from './components/PPIPrediction';
import ResearchOverview from './components/ResearchOverview';
import AIChat from './components/chat/AIChat';
import { Layers, BarChart3, Dna, BookOpen } from 'lucide-react';
import { useProteinStore } from './store/proteinStore';

function App() {
  const [activeView, setActiveView] = useState('viewer');
  const setActiveViewInStore = useProteinStore((state) => state.setActiveView);

  // Sync activeView with store
  useEffect(() => {
    setActiveViewInStore(activeView);
  }, [activeView, setActiveViewInStore]);

  return (
    <MainLayout>
      <div className="h-full w-full flex flex-col">
        {/* View Toggle */}
        <div className="flex items-center justify-center p-4 bg-white border-b border-gray-200">
          <div className="inline-flex rounded-lg border border-gray-200 p-1 bg-gray-50">
            <button
              onClick={() => setActiveView('viewer')}
              className={`px-6 py-3 rounded-md text-base font-medium transition-all flex items-center space-x-2 ${
                activeView === 'viewer'
                  ? 'bg-white text-primary-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Layers className="w-5 h-5" />
              <span>3D Viewer</span>
            </button>
            <button
              onClick={() => setActiveView('analysis')}
              className={`px-6 py-3 rounded-md text-base font-medium transition-all flex items-center space-x-2 ${
                activeView === 'analysis'
                  ? 'bg-white text-primary-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <BarChart3 className="w-5 h-5" />
              <span>Analysis Dashboard</span>
            </button>
            <button
              onClick={() => setActiveView('ppi')}
              className={`px-6 py-3 rounded-md text-base font-medium transition-all flex items-center space-x-2 ${
                activeView === 'ppi'
                  ? 'bg-white text-primary-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Dna className="w-5 h-5" />
              <span>PPI Prediction</span>
            </button>
            <button
              onClick={() => setActiveView('research')}
              className={`px-6 py-3 rounded-md text-base font-medium transition-all flex items-center space-x-2 ${
                activeView === 'research'
                  ? 'bg-white text-primary-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <BookOpen className="w-5 h-5" />
              <span>Research</span>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className={`flex-1 w-full ${activeView === 'research' ? 'overflow-y-auto' : 'overflow-hidden'} bg-gray-50`}>
          {activeView === 'viewer' && <DualViewer />}
          {activeView === 'analysis' && <AnalysisDashboard />}
          {activeView === 'ppi' && <PPIPrediction />}
          {activeView === 'research' && <ResearchOverview />}
        </div>
      </div>

      {/* AI Chat (Floating) */}
      <AIChat />
    </MainLayout>
  );
}

export default App;


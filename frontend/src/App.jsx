import React, { useState, useEffect } from 'react';
import MainLayout from './components/layout/MainLayout';
import DualViewer from './components/viewer/DualViewer';
import AnalysisDashboard from './components/analysis/AnalysisDashboard';
import ResearchOverview from './components/ResearchOverview';
import PPIPrediction from './components/PPIPrediction';
import AIChat from './components/chat/AIChat';
import ChatButton from './components/chat/ChatButton';
import { Layers, BarChart3, BookOpen, Dna } from 'lucide-react';
import { useProteinStore } from './store/proteinStore';
import { useThemeStore } from './store/themeStore';

function App() {
  const [activeView, setActiveView] = useState('viewer');
  const { setActiveView: setActiveViewInStore } = useProteinStore();
  const { theme } = useThemeStore();

  // Sync activeView with store
  useEffect(() => {
    setActiveViewInStore(activeView);
  }, [activeView, setActiveViewInStore]);

  // Initialize theme on mount
  useEffect(() => {
    const { theme: storedTheme, setTheme } = useThemeStore.getState();
    setTheme(storedTheme);
  }, []);

  return (
    <MainLayout>
      <div className="h-full w-full flex flex-col">
        {/* View Toggle */}
        <div className={`flex items-center justify-center p-4 border-b transition-colors ${
          theme === 'dark'
            ? 'bg-gray-900 border-gray-700'
            : 'bg-white border-gray-200'
        }`}>
          <div className={`inline-flex rounded-lg border p-1 ${
            theme === 'dark'
              ? 'border-gray-700 bg-gray-800'
              : 'border-gray-200 bg-gray-50'
          }`}>
            <button
              onClick={() => setActiveView('viewer')}
              className={`px-6 py-3 rounded-md text-base font-medium transition-all flex items-center space-x-2 ${
                activeView === 'viewer'
                  ? theme === 'dark'
                    ? 'bg-gray-700 text-blue-400 shadow-sm'
                    : 'bg-white text-primary-600 shadow-sm'
                  : theme === 'dark'
                  ? 'text-gray-300 hover:text-white'
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
                  ? theme === 'dark'
                    ? 'bg-gray-700 text-blue-400 shadow-sm'
                    : 'bg-white text-primary-600 shadow-sm'
                  : theme === 'dark'
                  ? 'text-gray-300 hover:text-white'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <BarChart3 className="w-5 h-5" />
              <span>Analysis Dashboard</span>
            </button>
            <button
              onClick={() => setActiveView('research')}
              className={`px-6 py-3 rounded-md text-base font-medium transition-all flex items-center space-x-2 ${
                activeView === 'research'
                  ? theme === 'dark'
                    ? 'bg-gray-700 text-blue-400 shadow-sm'
                    : 'bg-white text-primary-600 shadow-sm'
                  : theme === 'dark'
                  ? 'text-gray-300 hover:text-white'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <BookOpen className="w-5 h-5" />
              <span>Research</span>
            </button>
            <button
              onClick={() => setActiveView('ppi')}
              className={`px-6 py-3 rounded-md text-base font-medium transition-all flex items-center space-x-2 ${
                activeView === 'ppi'
                  ? theme === 'dark'
                    ? 'bg-gray-700 text-blue-400 shadow-sm'
                    : 'bg-white text-primary-600 shadow-sm'
                  : theme === 'dark'
                  ? 'text-gray-300 hover:text-white'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Dna className="w-5 h-5" />
              <span>PPI Prediction</span>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className={`flex-1 w-full ${activeView === 'research' || activeView === 'ppi' ? 'overflow-y-auto' : 'overflow-hidden'} transition-colors ${
          theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'
        }`}>
          {activeView === 'viewer' && <DualViewer />}
          {activeView === 'analysis' && <AnalysisDashboard />}
          {activeView === 'research' && <ResearchOverview />}
          {activeView === 'ppi' && <PPIPrediction />}
        </div>
      </div>

      {/* Chat Button (Bottom Right) */}
      <ChatButton />

      {/* AI Chat (Floating) */}
      <AIChat />
    </MainLayout>
  );
}

export default App;


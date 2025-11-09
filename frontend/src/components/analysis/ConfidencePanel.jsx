import React, { useMemo } from 'react';
import { TrendingUp } from 'lucide-react';
import { useProteinStore } from '../../store/proteinStore';
import { useThemeStore } from '../../store/themeStore';
import ConfidenceService from '../../services/confidenceService';

const ConfidencePanel = ({ protein = null, interactionStats = null }) => {
  const { targetProtein, interactionStats: storeInteractionStats } = useProteinStore();
  const { theme } = useThemeStore();
  
  // Use provided protein or fall back to target protein
  const displayProtein = protein || targetProtein;
  const stats = interactionStats || storeInteractionStats;

  // Generate pLDDT scores
  const confidenceData = useMemo(() => {
    if (!displayProtein) return [];
    return ConfidenceService.generatePLDDTScores(displayProtein, stats);
  }, [displayProtein, stats]);

  const getConfidenceColor = (score) => {
    if (score >= 90) return '#10b981'; // Very high - green-600
    if (score >= 70) return '#0284c7'; // High - blue-600
    if (score >= 50) return '#f59e0b'; // Medium - amber-600
    return '#dc2626'; // Low - red-600
  };

  const avgConfidence = useMemo(() => {
    if (confidenceData.length === 0) return 0;
    const sum = confidenceData.reduce((acc, d) => acc + d.score, 0);
    return (sum / confidenceData.length).toFixed(1);
  }, [confidenceData]);

  if (!displayProtein || confidenceData.length === 0) {
    return (
      <div className={`rounded-lg border shadow-sm p-6 transition-colors ${
        theme === 'dark'
          ? 'bg-gray-800 border-gray-700'
          : 'bg-white border-gray-200'
      }`}>
        <h3 className={`text-lg font-semibold flex items-center mb-4 ${
          theme === 'dark' ? 'text-white' : 'text-gray-900'
        }`}>
          <TrendingUp className="w-5 h-5 mr-2 text-blue-600" />
          Per-Residue Confidence (pLDDT)
        </h3>
        <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>No protein data available</p>
      </div>
    );
  }

  return (
    <div className={`rounded-lg border shadow-sm p-6 flex flex-col h-full transition-colors ${
      theme === 'dark'
        ? 'bg-gray-800 border-gray-700'
        : 'bg-white border-gray-200'
    }`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className={`text-lg font-semibold flex items-center ${
          theme === 'dark' ? 'text-white' : 'text-gray-900'
        }`}>
          <TrendingUp className="w-5 h-5 mr-2 text-blue-600" />
          Per-Residue Confidence (pLDDT)
        </h3>
        <div className={`px-3 py-1 rounded-lg text-sm font-semibold border transition-colors ${
          theme === 'dark'
            ? 'bg-blue-900/30 text-blue-300 border-blue-700'
            : 'bg-blue-50 text-blue-700 border-blue-200'
        }`}>
          Avg: {avgConfidence}
        </div>
      </div>

      {/* Confidence Chart */}
      <div className={`relative rounded-lg p-3 border flex-1 transition-colors ${
        theme === 'dark'
          ? 'bg-gray-900 border-gray-600'
          : 'bg-gray-50 border-gray-200'
      }`} style={{ minHeight: '280px' }}>
        {/* Chart Bars Container */}
        <div className="relative w-full h-full" style={{ paddingLeft: '32px', paddingRight: '4px', paddingTop: '4px', paddingBottom: '20px' }}>
          {/* Y-axis labels */}
          <div className={`absolute left-0 top-0 bottom-0 flex flex-col justify-between text-xs font-medium z-10 ${
            theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
          }`} style={{ width: '28px', paddingTop: '4px', paddingBottom: '20px' }}>
            <span>100</span>
            <span>50</span>
            <span>0</span>
          </div>
          
          {/* Chart Bars */}
          <div 
            className="absolute flex items-end justify-between"
            style={{ 
              left: '32px', 
              right: '4px', 
              bottom: '20px', 
              top: '4px',
            }}
          >
            {confidenceData.map((data, index) => {
              const heightPercent = (data.score / 100) * 100;
              
              return (
                <div
                  key={index}
                  className="rounded-t transition-all duration-300 hover:opacity-100 cursor-pointer"
                  style={{
                    flex: '1 1 0',
                    height: `${Math.max(heightPercent, 1)}%`,
                    backgroundColor: getConfidenceColor(data.score),
                    opacity: 0.9,
                    minHeight: '2px',
                    marginRight: index < confidenceData.length - 1 ? '0.5px' : '0',
                  }}
                  title={`Position ${data.position}: ${data.score.toFixed(1)}`}
                />
              );
            })}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="grid grid-cols-4 gap-2 mt-4">
        {[
          { label: 'Very High', color: '#10b981', range: '> 90' },
          { label: 'High', color: '#0284c7', range: '70-90' },
          { label: 'Medium', color: '#f59e0b', range: '50-70' },
          { label: 'Low', color: '#dc2626', range: '< 50' },
        ].map((item, index) => (
          <div key={index} className="flex items-center space-x-2">
            <div
              className={`w-3 h-3 rounded border ${
                theme === 'dark' ? 'border-gray-600' : 'border-gray-300'
              }`}
              style={{ backgroundColor: item.color }}
            />
            <div>
              <div className={`text-xs font-medium ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>{item.label}</div>
              <div className={`text-xs ${
                theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
              }`}>{item.range}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ConfidencePanel;

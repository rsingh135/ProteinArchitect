import React from 'react';
import { TrendingUp } from 'lucide-react';

const ConfidencePanel = () => {
  // Mock confidence data (per-residue pLDDT scores)
  const confidenceData = Array.from({ length: 100 }, (_, i) => ({
    position: i + 1,
    score: 50 + Math.random() * 50,
  }));

  const getConfidenceColor = (score) => {
    if (score >= 90) return '#10b981'; // Very high - green-600
    if (score >= 70) return '#0284c7'; // High - primary-600
    if (score >= 50) return '#f59e0b'; // Medium - amber-600
    return '#dc2626'; // Low - red-600
  };

  const getConfidenceLabel = (score) => {
    if (score >= 90) return 'Very High';
    if (score >= 70) return 'High';
    if (score >= 50) return 'Medium';
    return 'Low';
  };

  const avgConfidence = (
    confidenceData.reduce((sum, d) => sum + d.score, 0) / confidenceData.length
  ).toFixed(1);

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <TrendingUp className="w-5 h-5 mr-2 text-green-600" />
          Per-Residue Confidence (pLDDT)
        </h3>
        <div className="px-3 py-1 rounded-lg bg-green-50 text-green-700 text-sm font-semibold border border-green-200">
          Avg: {avgConfidence}
        </div>
      </div>

      {/* Confidence Chart */}
      <div className="relative h-48 bg-gray-50 rounded-lg p-4 overflow-hidden border border-gray-200">
        <div className="absolute inset-0 flex items-end justify-around px-4 pb-4">
          {confidenceData.map((data, index) => {
            if (index % 2 !== 0) return null; // Show every other bar for clarity
            const heightPercent = (data.score / 100) * 100;
            return (
              <div
                key={index}
                className="w-1 rounded-t transition-all duration-300 hover:opacity-100"
                style={{
                  height: `${heightPercent}%`,
                  backgroundColor: getConfidenceColor(data.score),
                  opacity: 0.9,
                }}
                title={`Position ${data.position}: ${data.score.toFixed(1)}`}
              />
            );
          })}
        </div>

        {/* Y-axis labels */}
        <div className="absolute left-0 top-0 bottom-0 flex flex-col justify-between text-xs text-gray-600 pr-2">
          <span>100</span>
          <span>50</span>
          <span>0</span>
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
              className="w-3 h-3 rounded border border-gray-300"
              style={{ backgroundColor: item.color }}
            />
            <div>
              <div className="text-xs text-gray-900 font-medium">{item.label}</div>
              <div className="text-xs text-gray-600">{item.range}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ConfidencePanel;

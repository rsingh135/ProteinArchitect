import React from 'react';
import { TrendingUp } from 'lucide-react';
import GlassCard from '../shared/GlassCard';

const ConfidencePanel = () => {
  // Mock confidence data (per-residue pLDDT scores)
  const confidenceData = Array.from({ length: 100 }, (_, i) => ({
    position: i + 1,
    score: 50 + Math.random() * 50,
  }));

  const getConfidenceColor = (score) => {
    if (score >= 90) return '#00ff88'; // Very high - neon green
    if (score >= 70) return '#00f0ff'; // High - neon cyan
    if (score >= 50) return '#ffaa00'; // Medium - neon orange
    return '#ff0080'; // Low - neon pink
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
    <GlassCard neonBorder neonColor="green">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white flex items-center">
          <TrendingUp className="w-5 h-5 mr-2 text-neon-green" />
          Per-Residue Confidence (pLDDT)
        </h3>
        <div className="px-3 py-1 rounded-lg bg-neon-green/20 text-neon-green text-sm font-semibold">
          Avg: {avgConfidence}
        </div>
      </div>

      {/* Confidence Chart */}
      <div className="relative h-48 bg-dark-surface/30 rounded-lg p-4 overflow-hidden">
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
                  opacity: 0.8,
                }}
                title={`Position ${data.position}: ${data.score.toFixed(1)}`}
              />
            );
          })}
        </div>

        {/* Y-axis labels */}
        <div className="absolute left-0 top-0 bottom-0 flex flex-col justify-between text-xs text-gray-500 pr-2">
          <span>100</span>
          <span>50</span>
          <span>0</span>
        </div>
      </div>

      {/* Legend */}
      <div className="grid grid-cols-4 gap-2 mt-4">
        {[
          { label: 'Very High', color: '#00ff88', range: '> 90' },
          { label: 'High', color: '#00f0ff', range: '70-90' },
          { label: 'Medium', color: '#ffaa00', range: '50-70' },
          { label: 'Low', color: '#ff0080', range: '< 50' },
        ].map((item, index) => (
          <div key={index} className="flex items-center space-x-2">
            <div
              className="w-3 h-3 rounded"
              style={{ backgroundColor: item.color, boxShadow: `0 0 8px ${item.color}50` }}
            />
            <div>
              <div className="text-xs text-white font-medium">{item.label}</div>
              <div className="text-xs text-gray-500">{item.range}</div>
            </div>
          </div>
        ))}
      </div>
    </GlassCard>
  );
};

export default ConfidencePanel;

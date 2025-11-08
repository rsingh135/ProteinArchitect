import React from 'react';
import { Grid3x3 } from 'lucide-react';
import GlassCard from '../shared/GlassCard';

const PAEPlot = () => {
  // Mock PAE data (Predicted Aligned Error)
  const size = 50;
  const paeData = Array.from({ length: size }, (_, i) =>
    Array.from({ length: size }, (_, j) => {
      // Create a mock PAE pattern
      const dist = Math.abs(i - j);
      return Math.min(30, dist * 0.5 + Math.random() * 5);
    })
  );

  const getErrorColor = (error) => {
    // Low error (good) = cyan/green, High error (bad) = orange/red
    if (error < 5) return '#00ff88';
    if (error < 10) return '#00f0ff';
    if (error < 15) return '#ffaa00';
    if (error < 20) return '#ff0080';
    return '#ff0000';
  };

  return (
    <GlassCard neonBorder neonColor="purple">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white flex items-center">
          <Grid3x3 className="w-5 h-5 mr-2 text-neon-purple" />
          Predicted Aligned Error (PAE)
        </h3>
        <div className="px-3 py-1 rounded-lg bg-neon-purple/20 text-neon-purple text-sm font-semibold">
          Interface Quality
        </div>
      </div>

      {/* PAE Heatmap */}
      <div className="relative bg-dark-surface/30 rounded-lg p-4">
        <div className="grid gap-px" style={{ gridTemplateColumns: `repeat(${size}, 1fr)` }}>
          {paeData.map((row, i) =>
            row.map((value, j) => (
              <div
                key={`${i}-${j}`}
                className="aspect-square rounded-sm transition-all duration-200 hover:scale-150 hover:z-10"
                style={{
                  backgroundColor: getErrorColor(value),
                  opacity: 0.8,
                }}
                title={`PAE[${i},${j}] = ${value.toFixed(1)} Å`}
              />
            ))
          )}
        </div>

        {/* Axis labels */}
        <div className="absolute -left-8 top-1/2 -translate-y-1/2 -rotate-90 text-xs text-gray-400">
          Scored Residue
        </div>
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-6 text-xs text-gray-400">
          Aligned Residue
        </div>
      </div>

      {/* Color Scale */}
      <div className="mt-4 flex items-center justify-between">
        <span className="text-xs text-gray-400">Low Error (Good)</span>
        <div className="flex-1 mx-4 h-3 rounded-full overflow-hidden flex">
          {[
            { color: '#00ff88', width: '25%' },
            { color: '#00f0ff', width: '25%' },
            { color: '#ffaa00', width: '25%' },
            { color: '#ff0080', width: '15%' },
            { color: '#ff0000', width: '10%' },
          ].map((segment, index) => (
            <div
              key={index}
              style={{ backgroundColor: segment.color, width: segment.width }}
            />
          ))}
        </div>
        <span className="text-xs text-gray-400">High Error (Bad)</span>
      </div>

      <p className="text-xs text-gray-500 mt-3 text-center">
        Lower values indicate higher confidence in relative position
      </p>
    </GlassCard>
  );
};

export default PAEPlot;

import React from 'react';
import { Grid3x3 } from 'lucide-react';

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
    // Low error (good) = green/blue, High error (bad) = amber/red
    if (error < 5) return '#10b981'; // green-600
    if (error < 10) return '#0284c7'; // primary-600
    if (error < 15) return '#f59e0b'; // amber-600
    if (error < 20) return '#dc2626'; // red-600
    return '#991b1b'; // red-800
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <Grid3x3 className="w-5 h-5 mr-2 text-purple-600" />
          Predicted Aligned Error (PAE)
        </h3>
        <div className="px-3 py-1 rounded-lg bg-purple-50 text-purple-700 text-sm font-semibold border border-purple-200">
          Interface Quality
        </div>
      </div>

      {/* PAE Heatmap */}
      <div className="relative bg-gray-50 rounded-lg p-4 border border-gray-200">
        <div className="grid gap-px" style={{ gridTemplateColumns: `repeat(${size}, 1fr)` }}>
          {paeData.map((row, i) =>
            row.map((value, j) => (
              <div
                key={`${i}-${j}`}
                className="aspect-square rounded-sm transition-all duration-200 hover:scale-150 hover:z-10"
                style={{
                  backgroundColor: getErrorColor(value),
                  opacity: 0.9,
                }}
                title={`PAE[${i},${j}] = ${value.toFixed(1)} Å`}
              />
            ))
          )}
        </div>

        {/* Axis labels */}
        <div className="absolute -left-8 top-1/2 -translate-y-1/2 -rotate-90 text-xs text-gray-600">
          Scored Residue
        </div>
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-6 text-xs text-gray-600">
          Aligned Residue
        </div>
      </div>

      {/* Color Scale */}
      <div className="mt-4 flex items-center justify-between">
        <span className="text-xs text-gray-600">Low Error (Good)</span>
        <div className="flex-1 mx-4 h-3 rounded-full overflow-hidden flex border border-gray-300">
          {[
            { color: '#10b981', width: '25%' },
            { color: '#0284c7', width: '25%' },
            { color: '#f59e0b', width: '25%' },
            { color: '#dc2626', width: '15%' },
            { color: '#991b1b', width: '10%' },
          ].map((segment, index) => (
            <div
              key={index}
              style={{ backgroundColor: segment.color, width: segment.width }}
            />
          ))}
        </div>
        <span className="text-xs text-gray-600">High Error (Bad)</span>
      </div>

      <p className="text-xs text-gray-600 mt-3 text-center">
        Lower values indicate higher confidence in relative position
      </p>
    </div>
  );
};

export default PAEPlot;

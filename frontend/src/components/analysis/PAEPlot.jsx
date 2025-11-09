import React, { useMemo } from 'react';
import { Grid3x3 } from 'lucide-react';
import { useProteinStore } from '../../store/proteinStore';
import { useThemeStore } from '../../store/themeStore';
import ConfidenceService from '../../services/confidenceService';

const PAEPlot = () => {
  const { targetProtein, binderProtein, interactionStats } = useProteinStore();
  const { theme } = useThemeStore();

  // Generate PAE matrix for the interaction
  const paeData = useMemo(() => {
    if (!targetProtein || !binderProtein || !interactionStats) {
      return null;
    }
    try {
      return ConfidenceService.generatePAEMatrix(targetProtein, binderProtein, interactionStats);
    } catch (error) {
      console.error('Error generating PAE matrix:', error);
      return null;
    }
  }, [targetProtein, binderProtein, interactionStats]);

  // Calculate interface quality
  const interfaceQuality = useMemo(() => {
    if (!interactionStats) return 0;
    return ConfidenceService.calculateInterfaceQuality(interactionStats);
  }, [interactionStats]);

  const getErrorColor = (error) => {
    // Low error (good) = green/blue, High error (bad) = amber/red
    if (error < 5) return '#10b981'; // green-600
    if (error < 10) return '#0284c7'; // blue-600
    if (error < 15) return '#f59e0b'; // amber-600
    if (error < 20) return '#dc2626'; // red-600
    return '#991b1b'; // red-800
  };

  if (!paeData || !paeData.matrix) {
    return (
      <div className={`rounded-lg border shadow-sm p-6 transition-colors ${
        theme === 'dark'
          ? 'bg-gray-800 border-gray-700'
          : 'bg-white border-gray-200'
      }`}>
        <h3 className={`text-lg font-semibold flex items-center mb-4 ${
          theme === 'dark' ? 'text-white' : 'text-gray-900'
        }`}>
          <Grid3x3 className="w-5 h-5 mr-2 text-blue-600" />
          Predicted Aligned Error (PAE)
        </h3>
        <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Interaction data required for PAE calculation</p>
      </div>
    );
  }

  const { matrix, totalLength } = paeData;
  
  // Calculate optimal display size based on available space
  // For a container that's roughly 300px wide with padding, aim for ~60-70 cells
  const maxDisplaySize = 65;
  const sampleRate = totalLength > maxDisplaySize ? Math.ceil(totalLength / maxDisplaySize) : 1;
  const displaySize = Math.min(maxDisplaySize, Math.ceil(totalLength / sampleRate));

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
          <Grid3x3 className="w-5 h-5 mr-2 text-blue-600" />
          Predicted Aligned Error (PAE)
        </h3>
        <div className={`px-3 py-1 rounded-lg text-sm font-semibold border transition-colors ${
          theme === 'dark'
            ? 'bg-blue-900/30 text-blue-300 border-blue-700'
            : 'bg-blue-50 text-blue-700 border-blue-200'
        }`}>
          Interface Quality: {interfaceQuality.toFixed(0)}
        </div>
      </div>

      {/* PAE Heatmap */}
      <div className={`relative rounded-lg p-3 border flex-1 transition-colors ${
        theme === 'dark'
          ? 'bg-gray-900 border-gray-600'
          : 'bg-gray-50 border-gray-200'
      }`} style={{ minHeight: '280px' }}>
        <div className="relative w-full h-full" style={{ paddingLeft: '32px', paddingRight: '4px', paddingTop: '4px', paddingBottom: '24px' }}>
          {/* Y-axis label */}
          <div className={`absolute left-0 top-1/2 -translate-y-1/2 -rotate-90 text-xs font-medium whitespace-nowrap z-10 ${
            theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
          }`} style={{ width: '28px' }}>
            Scored Residue
          </div>
          
          {/* Heatmap Grid Container */}
          <div className="absolute" style={{ left: '32px', right: '4px', top: '4px', bottom: '24px' }}>
            <div 
              className="grid gap-px w-full h-full"
              style={{ 
                gridTemplateColumns: `repeat(${displaySize}, 1fr)`,
                gridTemplateRows: `repeat(${displaySize}, 1fr)`,
              }}
            >
              {Array.from({ length: displaySize }, (_, i) => {
                const actualI = Math.min(i * sampleRate, matrix.length - 1);
                return Array.from({ length: displaySize }, (_, j) => {
                  const actualJ = Math.min(j * sampleRate, matrix[0].length - 1);
                  const value = matrix[actualI][actualJ];
                  return (
                    <div
                      key={`${i}-${j}`}
                      className="rounded-sm transition-all duration-200 hover:scale-150 hover:z-10 cursor-pointer"
                      style={{
                        backgroundColor: getErrorColor(value),
                        opacity: 0.9,
                        width: '100%',
                        height: '100%',
                      }}
                      title={`PAE[${actualI + 1},${actualJ + 1}] = ${value.toFixed(1)} Å`}
                    />
                  );
                });
              })}
            </div>
          </div>

          {/* X-axis label */}
          <div className={`absolute bottom-2 left-1/2 -translate-x-1/2 text-xs font-medium whitespace-nowrap ${
            theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
          }`} style={{ marginLeft: '16px' }}>
            Aligned Residue
          </div>
        </div>
      </div>

      {/* Color Scale */}
      <div className="mt-4 flex items-center justify-between">
        <span className={`text-xs font-medium ${
          theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
        }`}>Low Error (Good)</span>
        <div className={`flex-1 mx-4 h-3 rounded-full overflow-hidden flex border ${
          theme === 'dark' ? 'border-gray-600' : 'border-gray-300'
        }`}>
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
        <span className={`text-xs font-medium ${
          theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
        }`}>High Error (Bad)</span>
      </div>

      <p className={`text-xs mt-3 text-center ${
        theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
      }`}>
        Lower values indicate higher confidence in relative position
      </p>
    </div>
  );
};

export default PAEPlot;

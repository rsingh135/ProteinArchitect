import React from 'react';
import { Palette } from 'lucide-react';
import { useProteinStore } from '../../store/proteinStore';

const ViewerControls = () => {
  const { colorScheme, setColorScheme } = useProteinStore();

  const colorSchemes = [
    { id: 'spectrum', name: 'Spectrum' },
    { id: 'confidence', name: 'Confidence' },
    { id: 'chain', name: 'Chain' },
    { id: 'secondary', name: 'Secondary' },
  ];

  return (
    <div className="flex items-center space-x-6 bg-white px-4 py-3 rounded-lg border border-gray-200">
      {/* Color Scheme */}
      <div className="flex items-center space-x-3">
        <span className="text-sm text-gray-600 flex items-center font-medium">
          <Palette className="w-4 h-4 mr-2" />
          Color:
        </span>
        <div className="inline-flex rounded-lg border border-gray-200 p-1 bg-gray-50">
          {colorSchemes.map((scheme) => (
            <button
              key={scheme.id}
              onClick={() => setColorScheme(scheme.id)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                colorScheme === scheme.id
                  ? 'bg-white text-primary-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              title={scheme.name}
            >
              {scheme.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ViewerControls;

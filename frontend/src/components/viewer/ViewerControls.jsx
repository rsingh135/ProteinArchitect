import React from 'react';
import { Palette, Box, Circle, Layers as LayersIcon, Waves } from 'lucide-react';
import { useProteinStore } from '../../store/proteinStore';

const ViewerControls = () => {
  const { renderStyle, colorScheme, setRenderStyle, setColorScheme } = useProteinStore();

  const styles = [
    { id: 'cartoon', name: 'Cartoon', icon: Waves },
    { id: 'sphere', name: 'Sphere', icon: Circle },
    { id: 'stick', name: 'Stick', icon: Box },
    { id: 'surface', name: 'Surface', icon: LayersIcon },
  ];

  const colorSchemes = [
    { id: 'spectrum', name: 'Spectrum' },
    { id: 'confidence', name: 'Confidence' },
    { id: 'chain', name: 'Chain' },
    { id: 'secondary', name: 'Secondary' },
  ];

  return (
    <div className="flex items-center space-x-6 bg-white px-4 py-3 rounded-lg border border-gray-200">
      {/* Render Style */}
      <div className="flex items-center space-x-3">
        <span className="text-sm text-gray-600 flex items-center font-medium">
          <Box className="w-4 h-4 mr-2" />
          Style:
        </span>
        <div className="inline-flex rounded-lg border border-gray-200 p-1 bg-gray-50">
          {styles.map((style) => {
            const Icon = style.icon;
            return (
              <button
                key={style.id}
                onClick={() => setRenderStyle(style.id)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all flex items-center space-x-1.5 ${
                  renderStyle === style.id
                    ? 'bg-white text-primary-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
                title={style.name}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{style.name}</span>
              </button>
            );
          })}
        </div>
      </div>

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

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
    { id: 'spectrum', name: 'Spectrum', color: 'linear-gradient(90deg, #00f0ff, #ff00ff)' },
    { id: 'confidence', name: 'Confidence', color: 'linear-gradient(90deg, #ff0000, #00ff88)' },
    { id: 'chain', name: 'Chain', color: 'linear-gradient(90deg, #00f0ff, #b000ff)' },
    { id: 'secondary', name: 'Secondary', color: 'linear-gradient(90deg, #ffaa00, #00f0ff)' },
  ];

  return (
    <div className="flex items-center space-x-6">
      {/* Render Style */}
      <div className="flex items-center space-x-2">
        <span className="text-sm text-gray-400 flex items-center">
          <Box className="w-4 h-4 mr-2" />
          Style:
        </span>
        <div className="flex space-x-1 glass rounded-lg p-1">
          {styles.map((style) => {
            const Icon = style.icon;
            return (
              <button
                key={style.id}
                onClick={() => setRenderStyle(style.id)}
                className={`px-3 py-2 rounded-md text-xs font-medium transition-all duration-300 flex items-center space-x-1 ${
                  renderStyle === style.id
                    ? 'bg-neon-cyan/20 text-neon-cyan shadow-neon-cyan'
                    : 'text-gray-400 hover:text-white hover:bg-dark-hover'
                }`}
                title={style.name}
              >
                <Icon className="w-3 h-3" />
                <span>{style.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Color Scheme */}
      <div className="flex items-center space-x-2">
        <span className="text-sm text-gray-400 flex items-center">
          <Palette className="w-4 h-4 mr-2" />
          Color:
        </span>
        <div className="flex space-x-2 glass rounded-lg p-1">
          {colorSchemes.map((scheme) => (
            <button
              key={scheme.id}
              onClick={() => setColorScheme(scheme.id)}
              className={`px-3 py-2 rounded-md text-xs font-medium transition-all duration-300 relative overflow-hidden ${
                colorScheme === scheme.id
                  ? 'ring-2 ring-neon-cyan shadow-glow'
                  : 'hover:ring-1 ring-gray-600'
              }`}
              title={scheme.name}
            >
              <div
                className="absolute inset-0 opacity-30"
                style={{ background: scheme.color }}
              />
              <span className="relative text-white">{scheme.name}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ViewerControls;

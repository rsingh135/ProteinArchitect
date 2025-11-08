import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Layers, Link2, Eye, EyeOff, Maximize2 } from 'lucide-react';
import MolecularViewer from './MolecularViewer';
import ViewerControls from './ViewerControls';
import GlassCard from '../shared/GlassCard';
import { useProteinStore } from '../../store/proteinStore';

const DualViewer = () => {
  const {
    viewMode,
    syncRotation,
    renderStyle,
    colorScheme,
    setViewMode,
    setSyncRotation,
  } = useProteinStore();

  const [leftViewer, setLeftViewer] = useState(null);
  const [rightViewer, setRightViewer] = useState(null);

  const toggleViewMode = () => {
    setViewMode(viewMode === 'split' ? 'overlay' : 'split');
  };

  const toggleSync = () => {
    setSyncRotation(!syncRotation);
  };

  return (
    <div className="h-full flex flex-col p-6 space-y-4">
      {/* Top Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <h2 className="text-xl font-semibold text-white flex items-center">
            <Layers className="w-5 h-5 mr-2 text-neon-cyan" />
            3D Structure Viewer
          </h2>
        </div>

        <div className="flex items-center space-x-3">
          {/* Sync Toggle */}
          <button
            onClick={toggleSync}
            className={`px-4 py-2 rounded-lg flex items-center space-x-2 transition-all duration-300 ${
              syncRotation
                ? 'bg-neon-cyan/20 text-neon-cyan border border-neon-cyan/50 shadow-neon-cyan'
                : 'bg-dark-surface text-gray-400 border border-dark-border hover:bg-dark-hover'
            }`}
          >
            <Link2 className="w-4 h-4" />
            <span className="text-sm font-medium">
              {syncRotation ? 'Synced' : 'Independent'}
            </span>
          </button>

          {/* View Mode Toggle */}
          <button
            onClick={toggleViewMode}
            className="px-4 py-2 rounded-lg bg-dark-surface border border-dark-border hover:bg-dark-hover transition-all duration-300 flex items-center space-x-2 text-white"
          >
            {viewMode === 'split' ? (
              <Eye className="w-4 h-4" />
            ) : (
              <Layers className="w-4 h-4" />
            )}
            <span className="text-sm font-medium">
              {viewMode === 'split' ? 'Split View' : 'Overlay'}
            </span>
          </button>
        </div>
      </div>

      {/* Viewer Controls */}
      <ViewerControls />

      {/* Dual Viewer Area */}
      <div className="flex-1 grid grid-cols-2 gap-6">
        {/* Left Viewer - Target Protein */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
        >
          <GlassCard neonBorder neonColor="cyan" className="h-full flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold neon-text-cyan">Target Protein</h3>
                <p className="text-xs text-gray-400 mt-1">
                  UniProt ID: <span className="font-mono text-neon-cyan">P01308</span>
                </p>
              </div>
              <button className="p-2 rounded-lg hover:bg-dark-hover transition-colors">
                <Maximize2 className="w-4 h-4 text-gray-400" />
              </button>
            </div>

            <div className="flex-1 relative">
              <MolecularViewer
                pdbData={null}
                style={renderStyle}
                colorScheme={colorScheme}
                height="100%"
                onViewerReady={setLeftViewer}
              />

              {/* Confidence Badge */}
              <div className="absolute top-4 left-4 px-3 py-1 rounded-lg glass border border-neon-cyan/30">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 rounded-full bg-neon-green animate-glow-pulse"></div>
                  <span className="text-xs text-white font-medium">
                    Confidence: <span className="text-neon-green">92%</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="mt-4 grid grid-cols-3 gap-2">
              <div className="text-center py-2 rounded-lg bg-dark-surface/50">
                <div className="text-xs text-gray-400">Length</div>
                <div className="text-sm font-semibold text-neon-cyan">245 aa</div>
              </div>
              <div className="text-center py-2 rounded-lg bg-dark-surface/50">
                <div className="text-xs text-gray-400">Mass</div>
                <div className="text-sm font-semibold text-neon-cyan">27.5 kDa</div>
              </div>
              <div className="text-center py-2 rounded-lg bg-dark-surface/50">
                <div className="text-xs text-gray-400">pLDDT</div>
                <div className="text-sm font-semibold text-neon-green">92.3</div>
              </div>
            </div>
          </GlassCard>
        </motion.div>

        {/* Right Viewer - Binder/Partner */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
        >
          <GlassCard neonBorder neonColor="magenta" className="h-full flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold neon-text-magenta">Partner/Binder</h3>
                <p className="text-xs text-gray-400 mt-1">
                  Click search to add a binding partner
                </p>
              </div>
              <button className="p-2 rounded-lg hover:bg-dark-hover transition-colors">
                <Maximize2 className="w-4 h-4 text-gray-400" />
              </button>
            </div>

            <div className="flex-1 relative">
              <MolecularViewer
                pdbData={null}
                style={renderStyle}
                colorScheme={colorScheme}
                height="100%"
                onViewerReady={setRightViewer}
              />

              {/* Empty State Overlay */}
              <div className="absolute inset-0 flex items-center justify-center bg-dark-surface/30 backdrop-blur-sm rounded-xl">
                <div className="text-center">
                  <EyeOff className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                  <p className="text-gray-400 text-sm">
                    Search for a binding partner to visualize
                  </p>
                  <button className="mt-4 px-6 py-2 bg-gradient-to-r from-neon-magenta to-neon-purple text-white rounded-lg hover:shadow-neon-magenta transition-all duration-300">
                    Add Partner
                  </button>
                </div>
              </div>
            </div>

            {/* Quick Stats (Hidden when empty) */}
            <div className="mt-4 grid grid-cols-3 gap-2 opacity-30">
              <div className="text-center py-2 rounded-lg bg-dark-surface/50">
                <div className="text-xs text-gray-400">Length</div>
                <div className="text-sm font-semibold text-neon-magenta">--- aa</div>
              </div>
              <div className="text-center py-2 rounded-lg bg-dark-surface/50">
                <div className="text-xs text-gray-400">Mass</div>
                <div className="text-sm font-semibold text-neon-magenta">-- kDa</div>
              </div>
              <div className="text-center py-2 rounded-lg bg-dark-surface/50">
                <div className="text-xs text-gray-400">pLDDT</div>
                <div className="text-sm font-semibold text-neon-magenta">--</div>
              </div>
            </div>
          </GlassCard>
        </motion.div>
      </div>
    </div>
  );
};

export default DualViewer;

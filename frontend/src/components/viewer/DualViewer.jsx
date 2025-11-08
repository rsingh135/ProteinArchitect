import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Layers, Link2, Eye, Maximize2, X } from 'lucide-react';
import MolecularViewer from './MolecularViewer';
import ViewerControls from './ViewerControls';
import ProteinOverview from '../shared/ProteinOverview';
import ProteinViewerModal from './ProteinViewerModal';
import PartnerSearch from './PartnerSearch';
import { useProteinStore } from '../../store/proteinStore';

const DualViewer = () => {
  const {
    targetProtein,
    binderProtein,
    viewMode,
    syncRotation,
    renderStyle,
    colorScheme,
    setViewMode,
    setSyncRotation,
    setBinderProtein,
  } = useProteinStore();

  const [leftViewer, setLeftViewer] = useState(null);
  const [rightViewer, setRightViewer] = useState(null);
  const [expandedViewer, setExpandedViewer] = useState(null);
  const [isPartnerSearchOpen, setIsPartnerSearchOpen] = useState(false);

  const toggleViewMode = () => {
    setViewMode(viewMode === 'split' ? 'overlay' : 'split');
  };

  const toggleSync = () => {
    setSyncRotation(!syncRotation);
  };

  return (
    <div className="flex h-full overflow-hidden">
      {/* Main Content */}
      <div className="flex-1 flex flex-col p-6 space-y-4 overflow-hidden bg-gray-50">
        {/* Top Controls */}
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center">
            <Layers className="w-5 h-5 mr-2 text-gray-700" />
            3D Structure Viewer
          </h2>

          <div className="flex items-center space-x-3">
            {/* Sync Toggle */}
            <button
              onClick={toggleSync}
              className={`px-4 py-2 rounded-lg flex items-center space-x-2 transition-all text-sm font-medium ${
                syncRotation
                  ? 'bg-primary-600 text-white'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              <Link2 className="w-4 h-4" />
              <span>{syncRotation ? 'Synced' : 'Independent'}</span>
            </button>

            {/* View Mode Toggle */}
            <button
              onClick={toggleViewMode}
              className="px-4 py-2 rounded-lg bg-white border border-gray-300 hover:bg-gray-50 transition-all flex items-center space-x-2 text-gray-700 text-sm font-medium"
            >
              {viewMode === 'split' ? (
                <Eye className="w-4 h-4" />
              ) : (
                <Layers className="w-4 h-4" />
              )}
              <span>{viewMode === 'split' ? 'Split View' : 'Overlay'}</span>
            </button>
          </div>
        </div>

        {/* Color Controls Only */}
        <ViewerControls />

        {/* Dual Viewer Area */}
        <div className="flex-1 flex gap-6 pr-6 overflow-hidden">
        {/* Left Viewer - Target Protein */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex-1 bg-white rounded-lg border border-gray-200 shadow-sm p-6 flex flex-col"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Target Protein</h3>
              <p className="text-sm text-gray-600 mt-1">
                {targetProtein ? (
                  <>
                    UniProt ID: <span className="font-mono text-primary-600">{targetProtein.uniprotId}</span>
                  </>
                ) : (
                  <span className="text-gray-400">Search to load a protein</span>
                )}
              </p>
            </div>
            <button
              onClick={() => setExpandedViewer('target')}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              disabled={!targetProtein}
              aria-label="Expand target protein viewer"
            >
              <Maximize2 className="w-4 h-4 text-gray-600" />
            </button>
          </div>

          <div className="flex-1 relative">
            <MolecularViewer
              pdbData={targetProtein?.pdbData || null}
              style={renderStyle}
              colorScheme={colorScheme}
              height="100%"
              onViewerReady={setLeftViewer}
            />

            {/* Confidence Badge */}
            {targetProtein && (
              <div className="absolute top-4 left-4 px-3 py-2 rounded-lg bg-white border border-gray-200 shadow-sm">
                <div className="flex items-center space-x-2">
                  <div className={`w-2 h-2 rounded-full ${
                    targetProtein.metrics.plddt >= 70 ? 'bg-green-500' : 
                    targetProtein.metrics.plddt >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                  }`}></div>
                  <span className="text-xs text-gray-900 font-medium">
                    Confidence: <span className={
                      targetProtein.metrics.plddt >= 70 ? 'text-green-600' : 
                      targetProtein.metrics.plddt >= 50 ? 'text-yellow-600' : 'text-red-600'
                    }>{targetProtein.metrics.plddt.toFixed(0)}%</span>
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Quick Stats */}
          <div className="mt-4 grid grid-cols-3 gap-3">
            <div className="text-center py-3 rounded-lg bg-gray-50 border border-gray-200">
              <div className="text-xs text-gray-600 mb-1">Length</div>
              <div className="text-sm font-semibold text-gray-900">
                {targetProtein ? `${targetProtein.sequence.length} aa` : '--- aa'}
              </div>
            </div>
            <div className="text-center py-3 rounded-lg bg-gray-50 border border-gray-200">
              <div className="text-xs text-gray-600 mb-1">Mass</div>
              <div className="text-sm font-semibold text-gray-900">
                {targetProtein ? `${(targetProtein.sequence.length * 110 / 1000).toFixed(1)} kDa` : '-- kDa'}
              </div>
            </div>
            <div className="text-center py-3 rounded-lg bg-gray-50 border border-gray-200">
              <div className="text-xs text-gray-600 mb-1">pLDDT</div>
              <div className={`text-sm font-semibold ${
                targetProtein && targetProtein.metrics.plddt >= 70 ? 'text-green-600' : 
                targetProtein && targetProtein.metrics.plddt >= 50 ? 'text-yellow-600' : 'text-gray-400'
              }`}>
                {targetProtein ? targetProtein.metrics.plddt.toFixed(1) : '--'}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Right Viewer - Binder/Partner */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex-1 bg-white rounded-lg border border-gray-200 shadow-sm p-6 flex flex-col"
        >
          <div className="flex items-center justify-between mb-4">
            <div 
              className="flex-1 cursor-pointer"
              onClick={() => !binderProtein && setIsPartnerSearchOpen(true)}
            >
              <h3 className="text-lg font-semibold text-gray-900">Partner/Binder</h3>
              <p className="text-sm text-gray-600 mt-1">
                {binderProtein ? (
                  <>
                    UniProt ID: <span className="font-mono text-primary-600">{binderProtein.uniprotId}</span>
                    {' • '}
                    <span className="text-primary-600 hover:text-primary-700" onClick={(e) => {
                      e.stopPropagation();
                      setIsPartnerSearchOpen(true);
                    }}>
                      Change partner
                    </span>
                  </>
                ) : (
                  <span className="text-gray-400">Click to search for a binding partner</span>
                )}
              </p>
            </div>
            <div className="flex items-center space-x-2">
              {binderProtein && (
                <button
                  onClick={() => {
                    setBinderProtein(null);
                  }}
                  className="p-2 rounded-lg hover:bg-red-50 transition-colors"
                  title="Remove partner"
                >
                  <X className="w-4 h-4 text-red-600" />
                </button>
              )}
              <button
                onClick={() => setExpandedViewer('partner')}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                disabled={!binderProtein}
                aria-label="Expand partner protein viewer"
              >
                <Maximize2 className="w-4 h-4 text-gray-600" />
              </button>
            </div>
          </div>

          <div className="flex-1 relative">
            <MolecularViewer
              pdbData={binderProtein?.pdbData || null}
              style={renderStyle}
              colorScheme={colorScheme}
              height="100%"
              onViewerReady={setRightViewer}
            />

            {/* Empty State Overlay */}
            {!binderProtein && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-50/95 backdrop-blur-sm rounded-lg">
                <div className="text-center">
                  <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Eye className="w-8 h-8 text-gray-400" />
                  </div>
                  <p className="text-gray-600 text-sm mb-4">
                    Search for a binding partner to visualize
                  </p>
                  <button 
                    onClick={() => setIsPartnerSearchOpen(true)}
                    className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm font-medium"
                  >
                    Add Partner
                  </button>
                </div>
              </div>
            )}

            {/* Confidence Badge */}
            {binderProtein && (
              <div className="absolute top-4 left-4 px-3 py-2 rounded-lg bg-white border border-gray-200 shadow-sm">
                <div className="flex items-center space-x-2">
                  <div className={`w-2 h-2 rounded-full ${
                    binderProtein.metrics.plddt >= 70 ? 'bg-green-500' : 
                    binderProtein.metrics.plddt >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                  }`}></div>
                  <span className="text-xs text-gray-900 font-medium">
                    Confidence: <span className={
                      binderProtein.metrics.plddt >= 70 ? 'text-green-600' : 
                      binderProtein.metrics.plddt >= 50 ? 'text-yellow-600' : 'text-red-600'
                    }>{binderProtein.metrics.plddt.toFixed(0)}%</span>
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Quick Stats */}
          <div className={`mt-4 grid grid-cols-3 gap-3 ${!binderProtein ? 'opacity-40' : ''}`}>
            <div className="text-center py-3 rounded-lg bg-gray-50 border border-gray-200">
              <div className="text-xs text-gray-600 mb-1">Length</div>
              <div className={`text-sm font-semibold ${binderProtein ? 'text-gray-900' : 'text-gray-400'}`}>
                {binderProtein ? `${binderProtein.sequence.length} aa` : '--- aa'}
              </div>
            </div>
            <div className="text-center py-3 rounded-lg bg-gray-50 border border-gray-200">
              <div className="text-xs text-gray-600 mb-1">Mass</div>
              <div className={`text-sm font-semibold ${binderProtein ? 'text-gray-900' : 'text-gray-400'}`}>
                {binderProtein ? `${(binderProtein.sequence.length * 110 / 1000).toFixed(1)} kDa` : '--- kDa'}
              </div>
            </div>
            <div className="text-center py-3 rounded-lg bg-gray-50 border border-gray-200">
              <div className="text-xs text-gray-600 mb-1">pLDDT</div>
              <div className={`text-sm font-semibold ${
                binderProtein && binderProtein.metrics.plddt >= 70 ? 'text-green-600' : 
                binderProtein && binderProtein.metrics.plddt >= 50 ? 'text-yellow-600' : 'text-gray-400'
              }`}>
                {binderProtein ? binderProtein.metrics.plddt.toFixed(1) : '---'}
              </div>
            </div>
          </div>
        </motion.div>
        </div>
      </div>

      {/* Right Sidebar - Protein Overview with PPI */}
      <ProteinOverview showPPISuggestions={true} />

      {/* Modals */}
      <ProteinViewerModal
        isOpen={expandedViewer === 'target'}
        onClose={() => setExpandedViewer(null)}
        protein={targetProtein}
        title="Target Protein"
        colorScheme={colorScheme}
        renderStyle={renderStyle}
      />

      <ProteinViewerModal
        isOpen={expandedViewer === 'partner'}
        onClose={() => setExpandedViewer(null)}
        protein={binderProtein}
        title="Partner/Binder"
        colorScheme={colorScheme}
        renderStyle={renderStyle}
      />

      {/* Partner Search Dialog */}
      <PartnerSearch
        isOpen={isPartnerSearchOpen}
        onClose={() => setIsPartnerSearchOpen(false)}
        onPartnerAdded={() => {
          console.log('✅ Partner added successfully');
        }}
      />
    </div>
  );
};

export default DualViewer;

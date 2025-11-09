import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import MolecularViewer from './MolecularViewer';
import VoiceAssistant from '../voice/VoiceAssistant';

const ProteinViewerModal = ({
  isOpen,
  onClose,
  protein,
  title = "Protein Viewer",
  colorScheme = 'spectrum',
  renderStyle = 'cartoon'
}) => {
  const [selectedResidue, setSelectedResidue] = useState(null);
  const [viewerState, setViewerState] = useState({
    showDisulfides: true,
    showHBonds: false,
    showLabels: false,
  });
  // Debug logging
  useEffect(() => {
    if (isOpen) {
      console.log('Modal opened with protein:', protein);
    }
  }, [isOpen, protein]);

  // Handle ESC key to close
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose();
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      // Prevent background scrolling
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && protein && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleBackdropClick}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative w-[90vw] h-[90vh] bg-white rounded-xl shadow-2xl flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
                <p className="text-sm text-gray-600 mt-1">
                  UniProt ID: <span className="font-mono text-primary-600">{protein.uniprotId}</span>
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-gray-200 transition-colors"
                aria-label="Close modal"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 flex overflow-hidden">
              {/* Main Viewer */}
              <div className="flex-1 relative bg-gray-900 p-6">
                <MolecularViewer
                  pdbData={protein.pdbData}
                  style={renderStyle}
                  colorScheme={colorScheme}
                  height="100%"
                  onResidueSelect={setSelectedResidue}
                  onViewerStateChange={setViewerState}
                  showOverlays={true}
                />

                {/* Confidence Badge */}
                {protein.metrics && (
                  <div className="absolute top-10 left-10 px-4 py-3 rounded-lg bg-white border border-gray-200 shadow-lg">
                    <div className="flex items-center space-x-2">
                      <div className={`w-2.5 h-2.5 rounded-full ${
                        protein.metrics.plddt >= 70 ? 'bg-green-500' :
                        protein.metrics.plddt >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                      }`}></div>
                      <span className="text-sm text-gray-900 font-semibold">
                        Confidence: <span className={
                          protein.metrics.plddt >= 70 ? 'text-green-600' :
                          protein.metrics.plddt >= 50 ? 'text-yellow-600' : 'text-red-600'
                        }>{protein.metrics.plddt.toFixed(0)}%</span>
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Side Panel */}
              <div className="w-80 bg-gray-50 border-l border-gray-200 overflow-y-auto">
                <div className="p-6 space-y-6">
                  {/* Structure Info */}
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 mb-3">Structure</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center p-3 rounded-lg bg-white border border-gray-200">
                        <span className="text-xs text-gray-600">Atoms</span>
                        <span className="text-sm font-semibold text-gray-900">
                          {protein.sequence ? protein.sequence.length * 7.5 : 'N/A'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center p-3 rounded-lg bg-white border border-gray-200">
                        <span className="text-xs text-gray-600">Residues</span>
                        <span className="text-sm font-semibold text-gray-900">
                          {protein.sequence ? protein.sequence.length : 'N/A'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Quick Stats */}
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 mb-3">Properties</h3>
                    <div className="space-y-2">
                      <div className="p-3 rounded-lg bg-blue-50 border border-blue-200">
                        <div className="text-xs text-gray-600 mb-1">Length</div>
                        <div className="text-lg font-semibold text-gray-900">
                          {protein.sequence ? `${protein.sequence.length} aa` : 'N/A'}
                        </div>
                      </div>
                      <div className="p-3 rounded-lg bg-blue-50 border border-blue-200">
                        <div className="text-xs text-gray-600 mb-1">Molecular Mass</div>
                        <div className="text-lg font-semibold text-gray-900">
                          {protein.sequence
                            ? `${(protein.sequence.length * 110 / 1000).toFixed(1)} kDa`
                            : 'N/A'}
                        </div>
                      </div>
                      <div className="p-3 rounded-lg bg-blue-50 border border-blue-200">
                        <div className="text-xs text-gray-600 mb-1">pLDDT Score</div>
                        <div className="text-lg font-semibold text-gray-900">
                          {protein.metrics ? protein.metrics.plddt.toFixed(1) : 'N/A'}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Function */}
                  {protein.function && (
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900 mb-3">Function</h3>
                      <p className="text-sm text-gray-700 leading-relaxed">
                        {protein.function}
                      </p>
                    </div>
                  )}

                  {/* Voice Assistant - only shown in Target Protein modal */}
                  {title === 'Target Protein' && (
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900 mb-3">Voice Assistant</h3>
                      <VoiceAssistant
                        protein={protein}
                        selectedResidue={selectedResidue}
                        viewerState={viewerState}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ProteinViewerModal;

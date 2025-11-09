import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import MolecularViewer from './MolecularViewer';
import VoiceAssistant from '../voice/VoiceAssistant';
import { useThemeStore } from '../../store/themeStore';

const ProteinViewerModal = ({
  isOpen,
  onClose,
  protein,
  title = "Protein Viewer",
  colorScheme = 'spectrum',
  renderStyle = 'cartoon'
}) => {
  const { theme } = useThemeStore();
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

  // Helper function to truncate description to prevent cut-off
  // Max length: ~68 characters (length of "Multifunctional transcription factor that induces cell cycle arrest")
  // Ensures descriptions end with a period to form complete sentences
  const truncateDescription = (text, maxLength = 68) => {
    if (!text) return text;
    
    // If text is already short enough, ensure it ends with a period
    if (text.length <= maxLength) {
      const trimmed = text.trim();
      if (trimmed && !trimmed.match(/[.!?]$/)) {
        return trimmed + '.';
      }
      return trimmed;
    }
    
    // Truncate if too long
    const truncated = text.substring(0, maxLength);
    const lastSpace = truncated.lastIndexOf(' ');
    let finalText;
    
    // Try to end at a word boundary (within last 15 characters)
    if (lastSpace > maxLength - 15 && lastSpace < maxLength) {
      finalText = truncated.substring(0, lastSpace);
    } else {
      finalText = truncated;
    }
    
    // Ensure it ends with a period (remove any trailing punctuation and add period)
    finalText = finalText.replace(/[.,;:!?]+$/, '').trim();
    if (finalText && !finalText.endsWith('.')) {
      finalText += '.';
    }
    
    return finalText;
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
            className={`relative w-[90vw] h-[90vh] rounded-xl shadow-2xl flex flex-col overflow-hidden transition-colors ${
              theme === 'dark'
                ? 'bg-gray-800 border border-gray-700'
                : 'bg-white'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className={`flex items-center justify-between px-6 py-4 border-b transition-colors ${
              theme === 'dark'
                ? 'border-gray-700 bg-gray-900'
                : 'border-gray-200 bg-gray-50'
            }`}>
              <div>
                <h2 className={`text-xl font-semibold ${
                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                }`}>{title}</h2>
                <p className={`text-sm mt-1 ${
                  theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                }`}>
                  UniProt ID: <span className={`font-mono ${
                    theme === 'dark' ? 'text-blue-400' : 'text-primary-600'
                  }`}>{protein.uniprotId}</span>
                </p>
              </div>
              <button
                onClick={onClose}
                className={`p-2 rounded-lg transition-colors ${
                  theme === 'dark'
                    ? 'hover:bg-gray-700 text-gray-300'
                    : 'hover:bg-gray-200 text-gray-600'
                }`}
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
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
                  <div className={`absolute top-10 left-10 px-4 py-3 rounded-lg border shadow-lg transition-colors ${
                    theme === 'dark'
                      ? 'bg-gray-800 border-gray-600'
                      : 'bg-white border-gray-200'
                  }`}>
                    <div className="flex items-center space-x-2">
                      <div className={`w-2.5 h-2.5 rounded-full ${
                        protein.metrics.plddt >= 70 ? 'bg-green-500' :
                        protein.metrics.plddt >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                      }`}></div>
                      <span className={`text-sm font-semibold ${
                        theme === 'dark' ? 'text-white' : 'text-gray-900'
                      }`}>
                        Confidence: <span className={
                          protein.metrics.plddt >= 70 ? 'text-green-400' :
                          protein.metrics.plddt >= 50 ? 'text-yellow-400' : 'text-red-400'
                        }>{protein.metrics.plddt.toFixed(0)}%</span>
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Side Panel */}
              <div className={`w-80 border-l overflow-y-auto transition-colors ${
                theme === 'dark'
                  ? 'bg-gray-800 border-gray-700'
                  : 'bg-gray-50 border-gray-200'
              }`}>
                <div className="p-6 space-y-6">
                  {/* Structure Info */}
                  <div>
                    <h3 className={`text-sm font-semibold mb-3 ${
                      theme === 'dark' ? 'text-white' : 'text-gray-900'
                    }`}>Structure</h3>
                    <div className="space-y-2">
                      <div className={`flex justify-between items-center p-3 rounded-lg border transition-colors ${
                        theme === 'dark'
                          ? 'bg-gray-700/50 border-gray-600'
                          : 'bg-white border-gray-200'
                      }`}>
                        <span className={`text-xs ${
                          theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                        }`}>Atoms</span>
                        <span className={`text-sm font-semibold ${
                          theme === 'dark' ? 'text-white' : 'text-gray-900'
                        }`}>
                          {protein.sequence ? protein.sequence.length * 7.5 : 'N/A'}
                        </span>
                      </div>
                      <div className={`flex justify-between items-center p-3 rounded-lg border transition-colors ${
                        theme === 'dark'
                          ? 'bg-gray-700/50 border-gray-600'
                          : 'bg-white border-gray-200'
                      }`}>
                        <span className={`text-xs ${
                          theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                        }`}>Residues</span>
                        <span className={`text-sm font-semibold ${
                          theme === 'dark' ? 'text-white' : 'text-gray-900'
                        }`}>
                          {protein.sequence ? protein.sequence.length : 'N/A'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Quick Stats */}
                  <div>
                    <h3 className={`text-sm font-semibold mb-3 ${
                      theme === 'dark' ? 'text-white' : 'text-gray-900'
                    }`}>Properties</h3>
                    <div className="space-y-2">
                      <div className={`p-3 rounded-lg border transition-colors ${
                        theme === 'dark'
                          ? 'bg-blue-900/30 border-blue-800/50'
                          : 'bg-blue-50 border-blue-200'
                      }`}>
                        <div className={`text-xs mb-1 ${
                          theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                        }`}>Length</div>
                        <div className={`text-lg font-semibold ${
                          theme === 'dark' ? 'text-white' : 'text-gray-900'
                        }`}>
                          {protein.sequence ? `${protein.sequence.length} aa` : 'N/A'}
                        </div>
                      </div>
                      <div className={`p-3 rounded-lg border transition-colors ${
                        theme === 'dark'
                          ? 'bg-blue-900/30 border-blue-800/50'
                          : 'bg-blue-50 border-blue-200'
                      }`}>
                        <div className={`text-xs mb-1 ${
                          theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                        }`}>Molecular Mass</div>
                        <div className={`text-lg font-semibold ${
                          theme === 'dark' ? 'text-white' : 'text-gray-900'
                        }`}>
                          {protein.sequence
                            ? `${(protein.sequence.length * 110 / 1000).toFixed(1)} kDa`
                            : 'N/A'}
                        </div>
                      </div>
                      <div className={`p-3 rounded-lg border transition-colors ${
                        theme === 'dark'
                          ? 'bg-blue-900/30 border-blue-800/50'
                          : 'bg-blue-50 border-blue-200'
                      }`}>
                        <div className={`text-xs mb-1 ${
                          theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                        }`}>pLDDT Score</div>
                        <div className={`text-lg font-semibold ${
                          theme === 'dark' ? 'text-white' : 'text-gray-900'
                        }`}>
                          {protein.metrics ? protein.metrics.plddt.toFixed(1) : 'N/A'}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Function */}
                  {protein.function && (
                    <div>
                      <h3 className={`text-sm font-semibold mb-3 ${
                        theme === 'dark' ? 'text-white' : 'text-gray-900'
                      }`}>Function</h3>
                      <p className={`text-sm leading-relaxed break-words ${
                        theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                      }`}>
                        {truncateDescription(protein.function)}
                      </p>
                    </div>
                  )}

                  {/* Voice Assistant - only shown in Target Protein modal */}
                  {title === 'Target Protein' && (
                    <div>
                      <h3 className={`text-sm font-semibold mb-3 ${
                        theme === 'dark' ? 'text-white' : 'text-gray-900'
                      }`}>Voice Assistant</h3>
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

import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import InteractionViewer from './InteractionViewer';
import InteractionStats from './InteractionStats';
import { useThemeStore } from '../../store/themeStore';

const InteractionViewerModal = ({
  isOpen,
  onClose,
  targetProtein,
  partnerProtein,
  interactionStats,
  colorScheme = 'spectrum',
  renderStyle = 'cartoon',
  onInteractionStatsCalculated,
}) => {
  const { theme } = useThemeStore();
  
  // Handle ESC key to close
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose();
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
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

  if (!isOpen || !targetProtein || !partnerProtein) return null;

  return (
    <AnimatePresence>
      {isOpen && (
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
                }`}>Protein Interaction</h2>
                <p className={`text-sm mt-1 ${
                  theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                }`}>
                  <span className={`font-mono ${
                    theme === 'dark' ? 'text-blue-400' : 'text-primary-600'
                  }`}>{targetProtein.uniprotId}</span>
                  {' ↔ '}
                  <span className={`font-mono ${
                    theme === 'dark' ? 'text-purple-400' : 'text-green-600'
                  }`}>{partnerProtein.uniprotId}</span>
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
                <InteractionViewer
                  targetPdbData={targetProtein.pdbData}
                  partnerPdbData={partnerProtein.pdbData}
                  targetProtein={targetProtein}
                  partnerProtein={partnerProtein}
                  style={renderStyle}
                  colorScheme={colorScheme}
                  height="100%"
                  showInteractionsInView={true}
                  showOverlays={true}
                  onInteractionStatsCalculated={onInteractionStatsCalculated}
                />
              </div>

              {/* Side Panel */}
              <div className={`w-96 border-l overflow-y-auto transition-colors ${
                theme === 'dark'
                  ? 'bg-gray-800 border-gray-700'
                  : 'bg-gray-50 border-gray-200'
              }`}>
                <div className="p-6">
                  {interactionStats ? (
                    <InteractionStats
                      stats={interactionStats}
                      targetProtein={targetProtein}
                      partnerProtein={partnerProtein}
                    />
                  ) : (
                    <div className={`text-center py-8 ${
                      theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                    }`}>
                      <div className={`animate-spin rounded-full h-8 w-8 border-b-2 mx-auto mb-4 ${
                        theme === 'dark' ? 'border-blue-400' : 'border-primary-600'
                      }`}></div>
                      <p>Calculating interactions...</p>
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

export default InteractionViewerModal;


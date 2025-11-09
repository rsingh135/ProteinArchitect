import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import InteractionViewer from './InteractionViewer';
import InteractionStats from './InteractionStats';

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
            className="relative w-[90vw] h-[90vh] bg-white rounded-xl shadow-2xl flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Protein Interaction</h2>
                <p className="text-sm text-gray-600 mt-1">
                  <span className="font-mono text-primary-600">{targetProtein.uniprotId}</span>
                  {' ↔ '}
                  <span className="font-mono text-green-600">{partnerProtein.uniprotId}</span>
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
              <div className="w-96 bg-gray-50 border-l border-gray-200 overflow-y-auto">
                <div className="p-6">
                  {interactionStats ? (
                    <InteractionStats
                      stats={interactionStats}
                      targetProtein={targetProtein}
                      partnerProtein={partnerProtein}
                    />
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-4"></div>
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


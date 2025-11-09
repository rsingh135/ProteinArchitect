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
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-1">
                  <h2 className={`text-xl font-semibold ${
                    theme === 'dark' ? 'text-white' : 'text-gray-900'
                  }`}>Protein Interaction</h2>
                  {interactionStats && (() => {
                    // Calculate confidence (same conservative logic as DualViewer)
                    const totalContacts = interactionStats.totalContacts || 0;
                    const avgDistance = interactionStats.averageDistance || 0;
                    const minDistance = interactionStats.minDistance || 0;
                    const targetLength = targetProtein.sequence?.length || 100;
                    const partnerLength = partnerProtein.sequence?.length || 100;
                    // More conservative estimate
                    const maxExpectedContacts = Math.min(targetLength, partnerLength) * 0.03;
                    const contactRatio = Math.min(totalContacts / Math.max(maxExpectedContacts, 1), 2.0);
                    const contactScore = Math.min(contactRatio * 30, 30);
                    let distanceScore = 0;
                    if (minDistance > 0) {
                      if (minDistance < 3.5) distanceScore = 25;
                      else if (minDistance < 5.0) distanceScore = 20;
                      else if (minDistance < 7.0) distanceScore = 12;
                      else distanceScore = 3;
                    }
                    let avgDistanceScore = 0;
                    if (avgDistance > 0 && avgDistance < 6.0) {
                      avgDistanceScore = 15 * Math.max(0, (1 - (avgDistance - 3.0) / 3.0));
                      avgDistanceScore = Math.max(0, avgDistanceScore);
                    }
                    const baseScore = contactScore + distanceScore + avgDistanceScore;
                    const scaledScore = baseScore * 0.85;
                    let bonus = 0;
                    if (totalContacts > maxExpectedContacts * 1.5 && minDistance < 4.0) {
                      bonus = Math.min(10, (totalContacts / maxExpectedContacts) * 2);
                    }
                    const confidence = Math.min(95, Math.round(scaledScore + bonus));
                    
                    return (
                      <span className={`px-3 py-1 rounded-full text-sm font-bold ${
                        confidence >= 70
                          ? theme === 'dark'
                            ? 'bg-blue-900/40 text-blue-300 border border-blue-700'
                            : 'bg-blue-100 text-blue-700 border border-blue-300'
                          : confidence >= 50
                          ? theme === 'dark'
                            ? 'bg-yellow-900/40 text-yellow-300 border border-yellow-700'
                            : 'bg-yellow-100 text-yellow-700 border border-yellow-300'
                          : theme === 'dark'
                          ? 'bg-red-900/40 text-red-300 border border-red-700'
                          : 'bg-red-100 text-red-700 border border-red-300'
                      }`}>
                        {confidence}% Confidence
                      </span>
                    );
                  })()}
                </div>
                <p className={`text-sm mt-1 ${
                  theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                }`}>
                  <span className={`font-semibold ${
                    theme === 'dark' ? 'text-blue-400' : 'text-primary-600'
                  }`}>
                    {targetProtein.name || 'Target'}
                  </span>
                  {' '}
                  <span className={`font-mono text-xs ${
                    theme === 'dark' ? 'text-blue-500' : 'text-primary-500'
                  }`}>
                    ({targetProtein.uniprotId})
                  </span>
                  {' ↔ '}
                  <span className={`font-semibold ${
                    theme === 'dark' ? 'text-purple-400' : 'text-purple-600'
                  }`}>
                    {partnerProtein.name || 'Partner'}
                  </span>
                  {' '}
                  <span className={`font-mono text-xs ${
                    theme === 'dark' ? 'text-purple-500' : 'text-purple-500'
                  }`}>
                    ({partnerProtein.uniprotId})
                  </span>
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


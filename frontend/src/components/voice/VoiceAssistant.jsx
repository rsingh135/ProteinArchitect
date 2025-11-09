import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, Loader, AlertCircle } from 'lucide-react';
import { useVoiceAssistant } from '../../hooks/useVoiceAssistant';

/**
 * Voice Assistant Component
 * Provides voice interaction for protein analysis
 */
const VoiceAssistant = ({ protein, selectedResidue, viewerState }) => {
  const {
    isActive,
    status,
    error,
    audioLevel,
    toggleConversation,
  } = useVoiceAssistant(protein, selectedResidue, viewerState);

  // Determine button state and styling
  const getButtonState = () => {
    if (error) return { color: 'bg-red-600', textColor: 'text-white', text: 'Error', icon: AlertCircle };
    if (status === 'connecting') return { color: 'bg-yellow-500', textColor: 'text-gray-900', text: 'Connecting...', icon: Loader };
    if (status === 'listening') return { color: 'bg-yellow-400', textColor: 'text-gray-900', text: 'Listening', icon: Mic };
    if (status === 'speaking') return { color: 'bg-green-600', textColor: 'text-white', text: 'Speaking', icon: Mic };
    if (isActive) return { color: 'bg-yellow-400', textColor: 'text-gray-900', text: 'Listening', icon: Mic };
    return { color: 'bg-gray-700', textColor: 'text-white', text: 'Ask About This Protein', icon: MicOff };
  };

  const buttonState = getButtonState();
  const IconComponent = buttonState.icon;

  return (
    <div className="space-y-3">
      {/* Voice Button */}
      <button
        onClick={toggleConversation}
        disabled={status === 'connecting' || status === 'error'}
        className={`w-full ${buttonState.color} ${buttonState.textColor} rounded-lg px-4 py-3 font-medium transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 relative overflow-hidden`}
      >
        {/* Circular ripple waves when listening */}
        <AnimatePresence>
          {(status === 'listening' || (isActive && status === 'connected')) && (
            <>
              {/* Multiple expanding circular waves - blue on yellow */}
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{
                    opacity: [0.5, 0.2, 0],
                    scale: [0.7, 1.5, 2]
                  }}
                  exit={{ opacity: 0 }}
                  transition={{
                    duration: 2.5,
                    repeat: Infinity,
                    delay: i * 0.7,
                    ease: "easeOut"
                  }}
                  className="absolute inset-0 rounded-lg border-[3px] border-blue-500"
                />
              ))}
              {/* Center pulsing glow */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: [0.2, 0.4, 0.2] }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="absolute inset-0 bg-blue-500/20 rounded-lg"
              />
            </>
          )}
          {status === 'speaking' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: [0.5, 0.8, 0.5], scale: [1, 1.05, 1] }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="absolute inset-0 bg-white/20 rounded-lg"
            />
          )}
        </AnimatePresence>

        {/* Icon */}
        <div className="relative z-10">
          {status === 'connecting' ? (
            <Loader className="w-5 h-5 animate-spin" />
          ) : (
            <IconComponent className="w-5 h-5" />
          )}
        </div>

        {/* Text */}
        <span className="relative z-10">{buttonState.text}</span>
      </button>

      {/* Audio Level Visualization (only when listening) */}
      <AnimatePresence>
        {status === 'listening' && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="p-3 rounded-lg bg-white border border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-gray-600 font-medium">Audio Level</span>
                <span className="text-xs text-gray-500">{Math.round(audioLevel)}%</span>
              </div>
              <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-blue-500 rounded-full"
                  style={{ width: `${audioLevel}%` }}
                  transition={{ duration: 0.1 }}
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Waveform Visualization (when speaking) */}
      <AnimatePresence>
        {status === 'speaking' && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="p-3 rounded-lg bg-white border border-gray-200 flex items-center justify-center space-x-1">
              {[...Array(5)].map((_, i) => (
                <motion.div
                  key={i}
                  className="w-1 bg-green-500 rounded-full"
                  animate={{
                    height: ['8px', '24px', '8px'],
                  }}
                  transition={{
                    duration: 0.8,
                    repeat: Infinity,
                    delay: i * 0.1,
                  }}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error Message */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-3 rounded-lg bg-red-50 border border-red-200"
          >
            <div className="flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-xs font-semibold text-red-900">Error</p>
                <p className="text-xs text-red-700 mt-1">{error}</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Status Info */}
      {isActive && !error && (
        <div className="p-3 rounded-lg bg-blue-50 border border-blue-200">
          <p className="text-xs text-blue-900 font-medium">
            💡 Voice assistant is active
          </p>
          <p className="text-xs text-blue-700 mt-1">
            Ask questions about the protein structure, specific residues, or interactions.
          </p>
        </div>
      )}

      {/* Instructions when idle */}
      {!isActive && !error && (
        <div className="p-3 rounded-lg bg-gray-50 border border-gray-200">
          <p className="text-xs text-gray-700">
            Click the button above to start a voice conversation about this protein structure.
          </p>
        </div>
      )}
    </div>
  );
};

export default VoiceAssistant;

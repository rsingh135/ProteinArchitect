import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, MousePointer } from 'lucide-react';
import { useProteinStore } from '../../store/proteinStore';
import { useThemeStore } from '../../store/themeStore';

const ChatButton = () => {
  const { isChatOpen, setIsChatOpen } = useProteinStore();
  const { theme } = useThemeStore();
  const [isHovered, setIsHovered] = useState(false);

  // Generate cursor positions in concentric circles
  const cursors = useMemo(() => {
    const cursors = [];
    // Circle radii - smaller to fit within left card and prevent overflow to right side
    const circles = [60, 80, 100, 120];
    const cursorsPerCircle = [6, 8, 10, 12];
    
    circles.forEach((radius, circleIndex) => {
      const count = cursorsPerCircle[circleIndex];
      for (let i = 0; i < count; i++) {
        const angle = (i / count) * 2 * Math.PI;
        const x = Math.cos(angle) * radius;
        const y = Math.sin(angle) * radius;
        
        // Calculate rotation to point outward from button center
        const rotationOutward = Math.atan2(y, x) * (180 / Math.PI);
        
        // Main cursor
        cursors.push({
          id: `cursor-${circleIndex}-${i}`,
          finalX: x,
          finalY: y,
          delay: circleIndex * 0.01 + i * 0.002,
          rotation: rotationOutward,
          isTrail: false,
          opacity: 1,
          scale: 1
        });

        // Trail cursors (2 trailing elements)
        for (let t = 1; t <= 2; t++) {
          cursors.push({
            id: `cursor-${circleIndex}-${i}-trail-${t}`,
            finalX: x,
            finalY: y,
            delay: circleIndex * 0.01 + i * 0.002 + t * 0.008,
            rotation: rotationOutward,
            isTrail: true,
            opacity: 1 - (t * 0.3),
            scale: 1 - (t * 0.2)
          });
        }
      }
    });
    
    return cursors;
  }, []);

  const handleClick = () => {
    setIsChatOpen(!isChatOpen);
  };

  // Animation only shows on hover, not on click
  const shouldShowAnimation = isHovered;

  // Theme-aware colors
  const isDark = theme === 'dark';
  const buttonBg = isChatOpen 
    ? 'bg-blue-600 hover:bg-blue-700' 
    : isDark 
    ? 'bg-gray-800/80 backdrop-blur-md border border-gray-700/50' 
    : 'bg-white/80 backdrop-blur-md border border-gray-200/50';
  
  const buttonText = isChatOpen 
    ? 'text-white' 
    : isDark 
    ? 'text-white' 
    : 'text-gray-900';
  
  const glowColor = isDark 
    ? 'rgba(255,255,255,0.4)' 
    : 'rgba(59,130,246,0.4)'; // blue glow for light mode

  return (
    <button
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`fixed z-50 inline-flex items-center justify-center px-6 py-3 rounded-full shadow-xl transition-all duration-300 will-change-transform cursor-pointer group ${buttonBg} ${buttonText} overflow-visible`}
      aria-label={isChatOpen ? 'Close chat' : 'Open AI assistant'}
      style={{
        // Always bottom-right corner on all pages
        bottom: '1.5rem',
        right: '1.5rem',
        transform: shouldShowAnimation ? 'scale(1.05)' : 'scale(1)',
        transformOrigin: 'center center',
        boxShadow: shouldShowAnimation 
          ? `0 10px 40px rgba(0,0,0,0.3), 0 0 20px ${glowColor}` 
          : undefined,
      }}
    >
      {/* Gradient overlay */}
      <div className={`absolute inset-0 rounded-full ${
        isDark 
          ? 'bg-gradient-to-r from-white/10 via-white/5 to-transparent' 
          : 'bg-gradient-to-r from-blue-500/10 via-blue-500/5 to-transparent'
      }`} />
      
      {/* Pulsing glow effect */}
      <AnimatePresence>
        {shouldShowAnimation && (
          <motion.div
            className="absolute inset-0 rounded-full pointer-events-none will-change-transform"
            initial={{ opacity: 0, scale: 1 }}
            animate={{
              opacity: [0, 0.6, 0],
              scale: [1, 1.05, 1],
            }}
            exit={{ opacity: 0 }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            style={{
              boxShadow: `0 0 20px ${glowColor}`
            }}
          />
        )}
      </AnimatePresence>
      
      {/* Inner glow */}
      <div className={`absolute inset-0 rounded-full ${
        isDark 
          ? 'shadow-inner shadow-white/20' 
          : 'shadow-inner shadow-blue-500/20'
      }`} />
      
      {/* Flying Cursors Animation */}
      <AnimatePresence>
        {shouldShowAnimation && (
          <motion.div
            className="absolute pointer-events-none will-change-transform z-[-1]"
            style={{ 
              left: '50%', 
              top: '50%',
              transform: 'translate(-50%, -50%)',
              // No overflow hidden - let cursors be visible, but they're constrained by circle radii
            }}
            initial={{ rotate: 0 }}
            animate={{
              rotate: -360
            }}
            transition={{
              duration: 20,
              repeat: Infinity,
              ease: "linear"
            }}
          >
            {cursors.map((cursor) => (
              <motion.div
                key={cursor.id}
                className="absolute pointer-events-none will-change-transform"
                initial={{
                  x: 0,
                  y: 0,
                  opacity: 0,
                  scale: 0
                }}
                animate={{
                  x: cursor.finalX,
                  y: cursor.finalY,
                  opacity: cursor.isTrail ? cursor.opacity : [1, 0.8, 1],
                  scale: cursor.isTrail ? cursor.scale : [1, 1.1, 1]
                }}
                exit={{
                  opacity: 0,
                  scale: 0,
                  transition: { duration: 0.03 }
                }}
                transition={{
                  duration: 0.08,
                  delay: cursor.delay,
                  ease: "easeOut",
                  type: "spring",
                  damping: 25,
                  stiffness: 400,
                  opacity: {
                    duration: cursor.isTrail ? 0.08 : 2,
                    repeat: cursor.isTrail ? 0 : Infinity,
                    ease: "easeInOut"
                  },
                  scale: {
                    duration: cursor.isTrail ? 0.08 : 2,
                    repeat: cursor.isTrail ? 0 : Infinity,
                    ease: "easeInOut"
                  }
                }}
              >
                <MousePointer 
                  className={`w-4 h-4 ${buttonText} drop-shadow-lg`}
                  style={{ 
                    filter: isDark 
                      ? 'drop-shadow(0 0 6px rgba(255,255,255,0.6))' 
                      : 'drop-shadow(0 0 6px rgba(59,130,246,0.6))',
                    opacity: cursor.opacity,
                    transform: `scale(${cursor.scale}) rotate(${cursor.rotation}deg)`
                  }}
                />
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Button Content */}
      <span className={`inline-flex items-center space-x-2.5 relative z-10 ${buttonText} font-medium drop-shadow-lg whitespace-nowrap`}>
        {isChatOpen ? (
          <>
            <X className="w-5 h-5 flex-shrink-0" />
            <span>Close</span>
          </>
        ) : (
          <>
            <MessageCircle className="w-5 h-5 flex-shrink-0" />
            <span>AI Assistant</span>
          </>
        )}
      </span>
    </button>
  );
};

export default ChatButton;

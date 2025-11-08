import React from 'react';
import { motion } from 'framer-motion';

const GlassCard = ({ children, className = '', neonBorder = false, neonColor = 'cyan', ...props }) => {
  const neonColors = {
    cyan: 'shadow-neon-cyan border-neon-cyan/30',
    magenta: 'shadow-neon-magenta border-neon-magenta/30',
    green: 'shadow-neon-green border-neon-green/30',
    purple: 'shadow-neon-purple border-neon-purple/30',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`glass rounded-xl p-6 ${neonBorder ? neonColors[neonColor] : ''} ${className}`}
      {...props}
    >
      {children}
    </motion.div>
  );
};

export default GlassCard;

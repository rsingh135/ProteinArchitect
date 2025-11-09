import React from 'react';

const RainbowSpinner = ({ size = 80, className = '' }) => {
  const centerX = size / 2;
  const centerY = size / 2;
  const baseRadius = size * 0.15;
  
  // Generate unique IDs for gradients
  const gradientId1 = React.useMemo(() => `rainbow-gradient-1-${Math.random().toString(36).substr(2, 9)}`, []);
  const gradientId2 = React.useMemo(() => `rainbow-gradient-2-${Math.random().toString(36).substr(2, 9)}`, []);
  const gradientId3 = React.useMemo(() => `rainbow-gradient-3-${Math.random().toString(36).substr(2, 9)}`, []);
  
  // Create alpha-helix spirals (protein-like structure)
  const helixPoints = [];
  const numTurns = 3;
  const pointsPerTurn = 12;
  
  for (let i = 0; i <= numTurns * pointsPerTurn; i++) {
    const angle = (i / pointsPerTurn) * Math.PI * 2;
    const radius = baseRadius + (i / (numTurns * pointsPerTurn)) * baseRadius * 0.5;
    const x = centerX + Math.cos(angle) * radius;
    const y = centerY + Math.sin(angle) * radius;
    const z = (i / (numTurns * pointsPerTurn)) * baseRadius * 1.5 - baseRadius * 0.75;
    helixPoints.push({ x, y, z, angle, progress: i / (numTurns * pointsPerTurn) });
  }
  
  return (
    <div className={`relative ${className}`} style={{ width: size, height: size }}>
      <svg
        className="animate-spin"
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Rainbow gradient for helix backbone - flowing through the structure */}
          <linearGradient id={gradientId1} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#0000ff" />
            <stop offset="20%" stopColor="#00ffff" />
            <stop offset="40%" stopColor="#00ff00" />
            <stop offset="60%" stopColor="#ffff00" />
            <stop offset="80%" stopColor="#ff7f00" />
            <stop offset="100%" stopColor="#ff0000" />
          </linearGradient>
          
          {/* Secondary rainbow gradient for additional helix */}
          <linearGradient id={gradientId2} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ff0000" />
            <stop offset="20%" stopColor="#ff7f00" />
            <stop offset="40%" stopColor="#ffff00" />
            <stop offset="60%" stopColor="#00ff00" />
            <stop offset="80%" stopColor="#00ffff" />
            <stop offset="100%" stopColor="#0000ff" />
          </linearGradient>
          
          {/* Radial gradient for atoms/nodes */}
          <radialGradient id={gradientId3} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="30%" stopColor="#0000ff" />
            <stop offset="50%" stopColor="#00ff00" />
            <stop offset="70%" stopColor="#ffff00" />
            <stop offset="100%" stopColor="#ff0000" />
          </radialGradient>
        </defs>
        
        {/* Main alpha-helix spiral - thick, smooth, rainbow-colored */}
        <path
          d={`M ${helixPoints[0].x},${helixPoints[0].y} ${helixPoints.slice(1).map((p, i) => {
            const prev = helixPoints[i];
            const cp1x = prev.x + (p.x - prev.x) * 0.3;
            const cp1y = prev.y + (p.y - prev.y) * 0.3;
            const cp2x = p.x - (p.x - prev.x) * 0.3;
            const cp2y = p.y - (p.y - prev.y) * 0.3;
            return `C ${cp1x},${cp1y} ${cp2x},${cp2y} ${p.x},${p.y}`;
          }).join(' ')}`}
          stroke={`url(#${gradientId1})`}
          strokeWidth={size * 0.08}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.9"
        />
        
        {/* Secondary helix - smaller, offset */}
        {(() => {
          const secondaryHelix = helixPoints.map((p, i) => {
            const offsetAngle = p.angle + Math.PI / 3;
            const offsetRadius = baseRadius * 0.6;
            return {
              x: centerX + Math.cos(offsetAngle) * offsetRadius,
              y: centerY + Math.sin(offsetAngle) * offsetRadius,
              progress: p.progress
            };
          });
          
          return (
            <path
              d={`M ${secondaryHelix[0].x},${secondaryHelix[0].y} ${secondaryHelix.slice(1).map((p, i) => {
                const prev = secondaryHelix[i];
                const cp1x = prev.x + (p.x - prev.x) * 0.3;
                const cp1y = prev.y + (p.y - prev.y) * 0.3;
                const cp2x = p.x - (p.x - prev.x) * 0.3;
                const cp2y = p.y - (p.y - prev.y) * 0.3;
                return `C ${cp1x},${cp1y} ${cp2x},${cp2y} ${p.x},${p.y}`;
              }).join(' ')}`}
              stroke={`url(#${gradientId2})`}
              strokeWidth={size * 0.05}
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity="0.7"
            />
          );
        })()}
        
        {/* Protein atoms/nodes along the helix - with rainbow colors */}
        {helixPoints.filter((_, i) => i % 3 === 0).map((point, index) => {
          const colorProgress = (index / helixPoints.length) * 100;
          return (
            <circle
              key={index}
              cx={point.x}
              cy={point.y}
              r={size * 0.03}
              fill={`url(#${gradientId3})`}
              opacity="0.9"
            />
          );
        })}
        
        {/* Additional helix coils for depth - creating 3D effect */}
        {[0, 1, 2].map((layer) => {
          const layerOffset = (layer - 1) * baseRadius * 0.2;
          const layerOpacity = 0.3 - layer * 0.1;
          
          return (
            <ellipse
              key={layer}
              cx={centerX}
              cy={centerY + layerOffset}
              rx={baseRadius * (1 - layer * 0.15)}
              ry={baseRadius * (1.2 - layer * 0.15)}
              fill="none"
              stroke={`url(#${gradientId1})`}
              strokeWidth={size * 0.02}
              opacity={layerOpacity}
            />
          );
        })}
      </svg>
    </div>
  );
};

export default RainbowSpinner;

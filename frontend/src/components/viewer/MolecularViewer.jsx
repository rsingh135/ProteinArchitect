import React from 'react';

const MolecularViewer = ({
  pdbData,
  style = 'cartoon',
  colorScheme = 'spectrum',
  width = '100%',
  height = '600px',
  onViewerReady,
}) => {
  // Placeholder for 3Dmol viewer (will be implemented with proper 3Dmol integration)
  return (
    <div
      style={{
        width,
        height,
        position: 'relative',
        borderRadius: '12px',
        overflow: 'hidden',
        backgroundColor: '#12121a',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
      className="border border-dark-border shadow-glow"
    >
      <div style={{ textAlign: 'center', color: '#666' }}>
        <div style={{ fontSize: '48px', marginBottom: '10px' }}>🧬</div>
        <div style={{ fontSize: '14px', color: '#888' }}>
          3D Molecular Viewer
        </div>
        <div style={{ fontSize: '12px', color: '#666', marginTop: '8px' }}>
          {style} | {colorScheme}
        </div>
      </div>
    </div>
  );
};

export default MolecularViewer;

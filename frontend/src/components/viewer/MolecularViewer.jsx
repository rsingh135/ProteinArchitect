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
        borderRadius: '8px',
        overflow: 'hidden',
        backgroundColor: '#f9fafb',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
      className="border border-gray-200"
    >
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '48px', marginBottom: '12px' }}>🧬</div>
        <div style={{ fontSize: '14px', color: '#4b5563', fontWeight: '500' }}>
          3D Molecular Viewer
        </div>
        <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '8px' }}>
          {style} | {colorScheme}
        </div>
      </div>
    </div>
  );
};

export default MolecularViewer;

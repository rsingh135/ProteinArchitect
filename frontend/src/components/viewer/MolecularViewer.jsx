import React, { useEffect, useRef } from 'react';
import $3Dmol from '3dmol';

const MolecularViewer = ({
  pdbData,
  style = 'cartoon',
  colorScheme = 'spectrum',
  width = '100%',
  height = '600px',
  onViewerReady,
}) => {
  const viewerRef = useRef(null);
  const viewerInstanceRef = useRef(null);

  useEffect(() => {
    if (!viewerRef.current) return;

    // Initialize viewer
    const viewer = $3Dmol.createViewer(viewerRef.current, {
      backgroundColor: '#12121a',
    });
    viewerInstanceRef.current = viewer;

    // Load mock PDB data if none provided
    const defaultPDB = pdbData || `HEADER    PROTEIN
ATOM      1  CA  ALA A   1       0.000   0.000   0.000  1.00 50.00           C
ATOM      2  CA  GLY A   2       3.800   0.000   0.000  1.00 60.00           C
ATOM      3  CA  VAL A   3       7.600   0.000   0.000  1.00 70.00           C
ATOM      4  CA  LEU A   4      11.400   0.000   0.000  1.00 80.00           C
ATOM      5  CA  ALA A   5      15.200   0.000   0.000  1.00 90.00           C
END`;

    viewer.addModel(defaultPDB, 'pdb');

    // Apply style
    const styleConfig = getStyleConfig(style, colorScheme);
    viewer.setStyle({}, styleConfig);

    viewer.zoomTo();
    viewer.zoom(1.2);
    viewer.render();

    if (onViewerReady) {
      onViewerReady(viewer);
    }

    // Cleanup
    return () => {
      if (viewerInstanceRef.current) {
        viewerInstanceRef.current.clear();
      }
    };
  }, [pdbData, style, colorScheme]);

  const getStyleConfig = (styleType, color) => {
    const styles = {
      cartoon: { cartoon: { color: color === 'spectrum' ? 'spectrum' : '#00f0ff' } },
      sphere: { sphere: { colorscheme: color } },
      stick: { stick: { colorscheme: color } },
      surface: { surface: { opacity: 0.8, colorscheme: color } },
      'ball-stick': { stick: {}, sphere: { scale: 0.3 } },
    };

    return styles[styleType] || styles.cartoon;
  };

  return (
    <div
      ref={viewerRef}
      style={{
        width,
        height,
        position: 'relative',
        borderRadius: '12px',
        overflow: 'hidden',
      }}
      className="border border-dark-border shadow-glow"
    />
  );
};

export default MolecularViewer;

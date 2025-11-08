import React, { useEffect, useRef, useState } from 'react';

const MolecularViewer = ({
  pdbData,
  style = 'cartoon',
  colorScheme = 'spectrum',
  width = '100%',
  height = '600px',
  onViewerReady,
  onResidueSelect,
  onViewerStateChange,
}) => {
  const viewerRef = useRef(null);
  const viewerInstanceRef = useRef(null);
  const modelRef = useRef(null);
  const [selectedResidue, setSelectedResidue] = useState(null);
  const [showDisulfides, setShowDisulfides] = useState(true);
  const [showHBonds, setShowHBonds] = useState(false);
  const [showLabels, setShowLabels] = useState(false);
  const [structureInfo, setStructureInfo] = useState(null);

  useEffect(() => {
    if (!pdbData || !viewerRef.current) return;

    // Load 3Dmol dynamically
    const load3Dmol = async () => {
      try {
        // Load 3Dmol.js from CDN if not already loaded
        if (!window.$3Dmol) {
          await new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://3Dmol.csb.pitt.edu/build/3Dmol-min.js';
            script.async = true;
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
          });
        }

        // Create viewer
        const config = {
          backgroundColor: '#1a1a1a',
        };
        
        const viewer = window.$3Dmol.createViewer(viewerRef.current, config);
        viewerInstanceRef.current = viewer;

        // Add model from PDB data
        const model = viewer.addModel(pdbData, 'pdb');
        modelRef.current = model;

        // Calculate structure info
        calculateStructureInfo(model);

        // Set base style - blue protein
        viewer.setStyle({}, { cartoon: { color: '#4A90E2' } });

        // Add click handler for selecting residues
        viewer.setClickable({}, true, (atom, viewer, event, container) => {
          if (atom) {
            const residueInfo = {
              chain: atom.chain,
              resi: atom.resi,
              resn: atom.resn,
              atom: atom.atom,
            };

            setSelectedResidue(residueInfo);

            // Notify parent component if callback provided
            if (onResidueSelect) {
              onResidueSelect(residueInfo);
            }

            // Highlight selected residue
            highlightResidue(viewer, atom.chain, atom.resi);

            console.log('Selected:', residueInfo);
          }
        });

        viewer.zoomTo();
        viewer.render();

        console.log('✅ 3D structure rendered successfully');

        if (onViewerReady) {
          onViewerReady(viewer);
        }
      } catch (error) {
        console.error('Error loading 3Dmol:', error);
      }
    };

    load3Dmol();

    // Cleanup
    return () => {
      if (viewerInstanceRef.current) {
        viewerInstanceRef.current = null;
      }
    };
  }, [pdbData, onViewerReady]);

  // Calculate structure information
  const calculateStructureInfo = (model) => {
    const allAtoms = model.selectedAtoms({});
    const caAtoms = model.selectedAtoms({ atom: 'CA' });
    
    // Count amino acid types
    const aaCount = {};
    caAtoms.forEach(atom => {
      aaCount[atom.resn] = (aaCount[atom.resn] || 0) + 1;
    });
    
    // Find chains
    const chains = [...new Set(caAtoms.map(a => a.chain))];
    
    // Estimate secondary structure
    let helixCount = 0;
    let sheetCount = 0;
    caAtoms.forEach(atom => {
      if (atom.ss === 'h') helixCount++;
      if (atom.ss === 's') sheetCount++;
    });
    
    setStructureInfo({
      totalResidues: caAtoms.length,
      totalAtoms: allAtoms.length,
      chains: chains.length,
      chainList: chains,
      helixPercent: ((helixCount / caAtoms.length) * 100).toFixed(1),
      sheetPercent: ((sheetCount / caAtoms.length) * 100).toFixed(1),
      mostCommonAA: Object.entries(aaCount).sort((a, b) => b[1] - a[1])[0],
    });
  };

  // Notify parent when viewer state changes
  useEffect(() => {
    if (onViewerStateChange) {
      onViewerStateChange({
        showDisulfides,
        showHBonds,
        showLabels,
      });
    }
  }, [showDisulfides, showHBonds, showLabels, onViewerStateChange]);

  // Update visualization when options change
  useEffect(() => {
    if (!viewerInstanceRef.current || !modelRef.current) return;

    const viewer = viewerInstanceRef.current;

    // Clear existing styles and objects
    viewer.removeAllShapes();
    viewer.removeAllLabels();

    // Re-apply base style
    viewer.setStyle({}, { cartoon: { color: '#4A90E2' } });

    // Show disulfide bonds
    if (showDisulfides) {
      addDisulfideBonds(viewer, modelRef.current);
    }

    // Show hydrogen bonds
    if (showHBonds) {
      addHydrogenBonds(viewer, modelRef.current);
    }

    // Show residue labels
    if (showLabels) {
      addResidueLabels(viewer, modelRef.current);
    }

    // Re-highlight selected residue if any
    if (selectedResidue) {
      highlightResidue(viewer, selectedResidue.chain, selectedResidue.resi);
    }

    viewer.render();
  }, [showDisulfides, showHBonds, showLabels, selectedResidue]);

  // Highlight a specific residue
  const highlightResidue = (viewer, chain, resi) => {
    // Highlight in bright yellow/orange
    viewer.setStyle(
      { chain: chain, resi: resi },
      { 
        cartoon: { color: '#FFD700' },
        stick: { color: '#FFD700', radius: 0.3 }
      }
    );
    
    // Add label
    const atoms = viewer.selectedAtoms({ chain: chain, resi: resi });
    if (atoms.length > 0) {
      const atom = atoms[0];
      viewer.addLabel(
        `${atom.resn}${atom.resi}`,
        {
          position: atom,
          backgroundColor: '#FFD700',
          fontColor: '#000000',
          fontSize: 12,
          showBackground: true,
          backgroundOpacity: 0.8,
        }
      );
    }
    
    viewer.render();
  };

  // Find and display disulfide bonds (CYS-CYS pairs)
  const addDisulfideBonds = (viewer, model) => {
    const atoms = model.selectedAtoms({ resn: 'CYS' });
    const sgAtoms = atoms.filter(a => a.atom === 'SG'); // Sulfur atoms in cysteine
    
    // Find pairs within bonding distance (~2.5 Å)
    for (let i = 0; i < sgAtoms.length; i++) {
      for (let j = i + 1; j < sgAtoms.length; j++) {
        const atom1 = sgAtoms[i];
        const atom2 = sgAtoms[j];
        
        const dist = Math.sqrt(
          Math.pow(atom1.x - atom2.x, 2) +
          Math.pow(atom1.y - atom2.y, 2) +
          Math.pow(atom1.z - atom2.z, 2)
        );
        
        // Disulfide bonds are typically 2.0-2.1 Å, allow some tolerance
        if (dist < 3.0 && dist > 1.5) {
          // Draw yellow cylinder for disulfide bond
          viewer.addCylinder({
            start: { x: atom1.x, y: atom1.y, z: atom1.z },
            end: { x: atom2.x, y: atom2.y, z: atom2.z },
            radius: 0.15,
            color: '#FFD700',
            fromCap: 1,
            toCap: 1,
          });
          
          // Highlight the cysteines involved
          viewer.addStyle(
            { chain: atom1.chain, resi: atom1.resi },
            { stick: { color: '#FFD700', radius: 0.2 } }
          );
          viewer.addStyle(
            { chain: atom2.chain, resi: atom2.resi },
            { stick: { color: '#FFD700', radius: 0.2 } }
          );
          
          console.log(`Disulfide bond: CYS${atom1.resi} - CYS${atom2.resi} (${dist.toFixed(2)} Å)`);
        }
      }
    }
  };

  // Find and display hydrogen bonds
  const addHydrogenBonds = (viewer, model) => {
    const backboneAtoms = model.selectedAtoms({ 
      atom: ['N', 'O'], // Backbone N and O atoms
    });
    
    const nAtoms = backboneAtoms.filter(a => a.atom === 'N');
    const oAtoms = backboneAtoms.filter(a => a.atom === 'O');
    
    let bondCount = 0;
    // Find H-bond pairs (typically 2.5-3.5 Å between N and O)
    for (let i = 0; i < nAtoms.length && bondCount < 50; i++) { // Limit to 50 for performance
      for (let j = 0; j < oAtoms.length; j++) {
        const nAtom = nAtoms[i];
        const oAtom = oAtoms[j];
        
        // Skip same residue
        if (Math.abs(nAtom.resi - oAtom.resi) < 2) continue;
        
        const dist = Math.sqrt(
          Math.pow(nAtom.x - oAtom.x, 2) +
          Math.pow(nAtom.y - oAtom.y, 2) +
          Math.pow(nAtom.z - oAtom.z, 2)
        );
        
        if (dist < 3.5 && dist > 2.5) {
          // Draw dashed line for H-bond
          viewer.addLine({
            start: { x: nAtom.x, y: nAtom.y, z: nAtom.z },
            end: { x: oAtom.x, y: oAtom.y, z: oAtom.z },
            color: '#00CED1',
            dashed: true,
            linewidth: 1,
          });
          bondCount++;
        }
      }
    }
    
    console.log(`Found ${bondCount} hydrogen bonds`);
  };

  // Add labels to all residues
  const addResidueLabels = (viewer, model) => {
    const caAtoms = model.selectedAtoms({ atom: 'CA' }); // Alpha carbons
    
    // Show every 10th residue to avoid clutter
    caAtoms.forEach((atom, index) => {
      if (index % 10 === 0) {
        viewer.addLabel(
          `${atom.resn}${atom.resi}`,
          {
            position: atom,
            backgroundColor: '#4A90E2',
            fontColor: '#FFFFFF',
            fontSize: 10,
            showBackground: true,
            backgroundOpacity: 0.7,
          }
        );
      }
    });
  };

  const hasData = !!pdbData;

  return (
    <div
      style={{
        width,
        height,
        position: 'relative',
        borderRadius: '8px',
        overflow: 'hidden',
        backgroundColor: hasData ? '#1a1a1a' : '#f9fafb',
        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Roboto, sans-serif',
      }}
      className="border border-gray-200"
    >
      {hasData ? (
        <>
          {/* 3D Viewer */}
          <div
            ref={viewerRef}
            style={{
              width: '100%',
              height: '100%',
              position: 'relative',
            }}
          />
          
          {/* Control Panel - Compact */}
          <div
            style={{
              position: 'absolute',
              top: '8px',
              right: '8px',
              backgroundColor: 'rgba(255, 255, 255, 0.9)',
              borderRadius: '6px',
              padding: '6px 8px',
              boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
              fontSize: '10px',
              zIndex: 10,
              maxWidth: '140px',
            }}
          >
            <div style={{ fontSize: '9px', fontWeight: '600', marginBottom: '6px', color: '#374151', letterSpacing: '0.3px', textTransform: 'uppercase' }}>
              Interactions
            </div>
            
            <label style={{ display: 'flex', alignItems: 'center', marginBottom: '4px', cursor: 'pointer', fontSize: '11px', color: '#1f2937' }}>
              <input
                type="checkbox"
                checked={showDisulfides}
                onChange={(e) => setShowDisulfides(e.target.checked)}
                style={{ marginRight: '6px', cursor: 'pointer', width: '12px', height: '12px' }}
              />
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ width: '10px', height: '10px', backgroundColor: '#FFD700', borderRadius: '2px', display: 'inline-block' }}></span>
                S-S
              </span>
            </label>
            
            <label style={{ display: 'flex', alignItems: 'center', marginBottom: '4px', cursor: 'pointer', fontSize: '11px', color: '#1f2937' }}>
              <input
                type="checkbox"
                checked={showHBonds}
                onChange={(e) => setShowHBonds(e.target.checked)}
                style={{ marginRight: '6px', cursor: 'pointer', width: '12px', height: '12px' }}
              />
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ width: '10px', height: '2px', backgroundColor: '#00CED1', display: 'inline-block' }}></span>
                H-Bond
              </span>
            </label>
            
            <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', fontSize: '11px', color: '#1f2937' }}>
              <input
                type="checkbox"
                checked={showLabels}
                onChange={(e) => setShowLabels(e.target.checked)}
                style={{ marginRight: '6px', cursor: 'pointer', width: '12px', height: '12px' }}
              />
              Labels
            </label>
          </div>
          
          {/* Structure Info Panel - Compact */}
          {structureInfo && !selectedResidue && (
            <div
              style={{
                position: 'absolute',
                bottom: '8px',
                left: '8px',
                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                borderRadius: '6px',
                padding: '6px 8px',
                boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
                maxWidth: '120px',
                fontSize: '10px',
                zIndex: 10,
              }}
            >
              <div style={{ fontSize: '9px', fontWeight: '600', marginBottom: '6px', color: '#374151', letterSpacing: '0.3px', textTransform: 'uppercase' }}>
                Structure
              </div>
              <div>
                <div style={{ fontSize: '9px', color: '#6b7280', marginBottom: '2px' }}>Atoms</div>
                <div style={{ fontWeight: '600', color: '#111827', fontFamily: '"SF Mono", monospace', fontSize: '11px' }}>{structureInfo.totalAtoms}</div>
              </div>
              {structureInfo.chains > 1 && (
                <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: '4px', marginTop: '4px' }}>
                  <div style={{ fontSize: '9px', color: '#6b7280', marginBottom: '2px' }}>Chains</div>
                  <div style={{ fontWeight: '600', color: '#111827', fontFamily: '"SF Mono", monospace', fontSize: '10px' }}>
                    {structureInfo.chainList.join(', ')}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Selected Residue Info */}
          {selectedResidue && (
            <div
              style={{
                position: 'absolute',
                bottom: '12px',
                left: '12px',
                backgroundColor: 'rgba(255, 215, 0, 0.95)',
                borderRadius: '8px',
                padding: '10px 14px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                color: '#000000',
                fontSize: '13px',
                zIndex: 10,
              }}
            >
              <div style={{ marginBottom: '4px', fontWeight: '600', fontSize: '11px', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                Selected
              </div>
              <div style={{ fontFamily: '"SF Mono", "Monaco", monospace', fontSize: '14px', fontWeight: '600' }}>
                {selectedResidue.resn} {selectedResidue.resi}
                {selectedResidue.chain && ` (${selectedResidue.chain})`}
              </div>
              <div style={{ fontSize: '11px', marginTop: '4px', opacity: 0.75 }}>
                Click to select another
              </div>
            </div>
          )}
          
          {/* Instructions */}
          <div
            style={{
              position: 'absolute',
              bottom: '12px',
              right: '12px',
              backgroundColor: 'rgba(0, 0, 0, 0.75)',
              borderRadius: '6px',
              padding: '8px 12px',
              color: '#ffffff',
              fontSize: '11px',
              zIndex: 10,
              fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
            }}
          >
            💡 Click • Drag • Scroll to zoom
          </div>
        </>
      ) : (
        <div
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div style={{ textAlign: 'center', color: '#6b7280' }}>
            <div style={{ fontSize: '48px', marginBottom: '12px', opacity: 0.3 }}>🧬</div>
            <div style={{ fontSize: '15px', fontWeight: '500', color: '#9ca3af' }}>
              No structure loaded
            </div>
            <div style={{ fontSize: '13px', color: '#9ca3af', marginTop: '8px' }}>
              Search for a protein to view its 3D structure
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MolecularViewer;

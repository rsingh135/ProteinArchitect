import React, { useEffect, useRef, useState } from 'react';
import { MolecularDynamicsSimulation } from '../../utils/molecularDynamics';

const InteractionViewer = ({
  targetPdbData,
  partnerPdbData,
  targetProtein,
  partnerProtein,
  style = 'cartoon',
  colorScheme = 'spectrum',
  width = '100%',
  height = '600px',
  onViewerReady,
  onInteractionStatsCalculated,
  showInteractionsInView = false, // New prop to control if interactions are shown in this view
  showOverlays = true, // Control whether to show overlay panels
}) => {
  const viewerRef = useRef(null);
  const viewerInstanceRef = useRef(null);
  const targetModelRef = useRef(null);
  const partnerModelRef = useRef(null);
  const [selectedResidue, setSelectedResidue] = useState(null);
  const [showInteractions, setShowInteractions] = useState(true);
  const [showLabels, setShowLabels] = useState(false);
  const [interactionStats, setInteractionStats] = useState(null);
  const [interfaceContacts, setInterfaceContacts] = useState([]);
  
  // Molecular Dynamics Simulation
  const [isSimulationRunning, setIsSimulationRunning] = useState(false);
  const [simulationSpeed, setSimulationSpeed] = useState(1.0);
  const [simulationTemperature, setSimulationTemperature] = useState(300);
  const mdSimulationRef = useRef(null);
  const currentTargetPdbRef = useRef(targetPdbData);
  const currentPartnerPdbRef = useRef(partnerPdbData);
  const lastUpdateTimeRef = useRef(0);
  const interactionUpdateCounterRef = useRef(0);

  // Store previous PDB data to detect changes
  const prevTargetPdbRef = useRef(null);
  const prevPartnerPdbRef = useRef(null);

  useEffect(() => {
    if (!targetPdbData || !partnerPdbData || !viewerRef.current) return;

    // Check if PDB data has changed
    const dataChanged = 
      prevTargetPdbRef.current !== targetPdbData || 
      prevPartnerPdbRef.current !== partnerPdbData;

    // If viewer exists and data hasn't changed, don't recreate
    if (viewerInstanceRef.current && !dataChanged) {
      return;
    }

    // Update refs
    prevTargetPdbRef.current = targetPdbData;
    prevPartnerPdbRef.current = partnerPdbData;

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

        // Wait a bit for 3Dmol to be fully ready
        await new Promise(resolve => setTimeout(resolve, 100));

        // Clear any existing content and destroy old viewer
        if (viewerInstanceRef.current) {
          try {
            viewerInstanceRef.current = null;
          } catch (e) {
            // Ignore errors when clearing
          }
        }

        if (viewerRef.current) {
          viewerRef.current.innerHTML = '';
        }

        // Create viewer
        const config = {
          backgroundColor: '#1a1a1a',
        };
        
        const viewer = window.$3Dmol.createViewer(viewerRef.current, config);
        viewerInstanceRef.current = viewer;

        // Add target protein model (blue) - model index 0
        try {
          viewer.addModel(targetPdbData, 'pdb');
          targetModelRef.current = 0;
        } catch (err) {
          console.error('Error adding target model:', err);
          return;
        }
        
        // Add partner protein model (light blue) - model index 1
        try {
          viewer.addModel(partnerPdbData, 'pdb');
          partnerModelRef.current = 1;
        } catch (err) {
          console.error('Error adding partner model:', err);
          return;
        }

        // Style target protein in blue (model 0) - primary blue
        viewer.setStyle(
          { model: 0 },
          { cartoon: { color: '#4A90E2' } }
        );

        // Style partner protein in purple (model 1) - very different from blue
        viewer.setStyle(
          { model: 1 },
          { cartoon: { color: '#9333EA' } } // Purple - very distinct from blue
        );

        // Calculate interactions (always calculate for stats, but only visualize if showInteractionsInView is true)
        try {
          const stats = calculateInteractions(viewer, 0, 1, showInteractionsInView);
          setInteractionStats(stats);
          setInterfaceContacts(stats.contacts);
          
          if (onInteractionStatsCalculated) {
            onInteractionStatsCalculated(stats);
          }
        } catch (err) {
          console.error('Error calculating interactions:', err);
          // Still show the proteins even if interaction calculation fails
        }

        // Add click handler for selecting residues
        viewer.setClickable({}, true, (atom, viewer, event, container) => {
          if (atom) {
            const residueInfo = {
              chain: atom.chain,
              resi: atom.resi,
              resn: atom.resn,
              atom: atom.atom,
              model: atom.model,
            };
            
            setSelectedResidue(residueInfo);
            highlightResidue(viewer, atom.model, atom.chain, atom.resi);
            
            console.log('Selected:', residueInfo);
          }
        });

        // Center and zoom to show both proteins
        viewer.zoomTo();
        viewer.render();

        console.log('✅ Interaction viewer rendered successfully');

        if (onViewerReady) {
          onViewerReady(viewer);
        }
        
        // Initialize MD simulation when viewer is ready and in expanded mode
        if (showOverlays && showInteractionsInView && !mdSimulationRef.current) {
          // Delay initialization slightly to ensure viewer is fully ready
          setTimeout(() => {
            console.log('🔵 Initializing MD simulation in viewer ready...');
            const sim = initializeSimulation(viewer);
            if (sim) {
              // Auto-start simulation after initialization
              setTimeout(() => {
                if (mdSimulationRef.current && !isSimulationRunning) {
                  console.log('🟢 Auto-starting MD simulation from viewer ready...');
                  mdSimulationRef.current.start();
                  setIsSimulationRunning(true);
                } else {
                  console.warn('⚠️ Could not start simulation:', {
                    hasSim: !!mdSimulationRef.current,
                    isRunning: isSimulationRunning
                  });
                }
              }, 500);
            } else {
              console.error('❌ Failed to initialize simulation');
            }
          }, 1000);
        }
      } catch (error) {
        console.error('Error loading interaction viewer:', error);
      }
    };

    load3Dmol();

    // Cleanup - only destroy viewer on unmount
    return () => {
      // Stop simulation on cleanup
      if (mdSimulationRef.current) {
        mdSimulationRef.current.stop();
      }
    };
  }, [targetPdbData, partnerPdbData]); // Removed callbacks from dependencies
  
  // Auto-start simulation when expanded
  useEffect(() => {
    console.log('🟡 Auto-start effect triggered', {
      showOverlays,
      showInteractionsInView,
      hasViewer: !!viewerInstanceRef.current,
      hasSim: !!mdSimulationRef.current,
      isRunning: isSimulationRunning
    });
    
    if (showOverlays && showInteractionsInView && viewerInstanceRef.current) {
      // Initialize if not already initialized
      if (!mdSimulationRef.current) {
        console.log('🟡 Initializing simulation in useEffect...');
        const sim = initializeSimulation(viewerInstanceRef.current);
        if (sim) {
          setTimeout(() => {
            if (mdSimulationRef.current && !isSimulationRunning) {
              console.log('🟢 Starting simulation from useEffect...');
              mdSimulationRef.current.start();
              setIsSimulationRunning(true);
            }
          }, 500);
        }
      } else if (!isSimulationRunning) {
        // Start if already initialized but not running
        console.log('🟢 Starting existing simulation from useEffect...');
        mdSimulationRef.current.start();
        setIsSimulationRunning(true);
      }
    } else if ((!showOverlays || !showInteractionsInView) && isSimulationRunning && mdSimulationRef.current) {
      // Stop simulation when not expanded
      console.log('🔴 Stopping simulation (not expanded)...');
      mdSimulationRef.current.stop();
      setIsSimulationRunning(false);
    }
  }, [showOverlays, showInteractionsInView, isSimulationRunning]);
  
  // Initialize MD simulation
  const initializeSimulation = (viewer) => {
    if (!targetPdbData || !partnerPdbData) {
      console.warn('Cannot initialize simulation: missing PDB data', { 
        hasTarget: !!targetPdbData, 
        hasPartner: !!partnerPdbData
      });
      return;
    }
    
    if (mdSimulationRef.current) {
      console.log('Simulation already initialized, reusing...');
      return mdSimulationRef.current;
    }
    
    try {
      console.log('Initializing MD simulation...', {
        targetAtoms: targetPdbData.split('\n').filter(l => l.startsWith('ATOM')).length,
        partnerAtoms: partnerPdbData.split('\n').filter(l => l.startsWith('ATOM')).length
      });
      
      const simulation = new MolecularDynamicsSimulation(
        targetPdbData,
        partnerPdbData,
        {
          temperature: simulationTemperature,
          dt: 0.1 * simulationSpeed, // MUCH larger time step for guaranteed visible movement
          onUpdate: (targetAtoms, partnerAtoms) => {
            // Update viewer with new positions - CRITICAL: This must be called
            // Call directly, don't wait for animation frame
            if (viewerInstanceRef.current && targetAtoms && partnerAtoms && targetAtoms.length > 0 && partnerAtoms.length > 0) {
              // Update immediately
              updateViewerPositions(viewerInstanceRef.current, targetAtoms, partnerAtoms);
            }
          },
          onStatsUpdate: (stats) => {
            // Merge with existing stats structure
            setInteractionStats(prevStats => ({
              ...prevStats,
              totalContacts: stats.totalContacts,
              averageDistance: stats.averageDistance,
              minDistance: stats.minDistance,
              contacts: stats.contacts,
              simulationTime: stats.time,
              simulationStep: stats.step,
              totalEnergy: stats.totalEnergy,
              interactionTypes: prevStats?.interactionTypes || {}
            }));
            setInterfaceContacts(stats.contacts);
            
            if (onInteractionStatsCalculated) {
              onInteractionStatsCalculated({
                ...interactionStats,
                totalContacts: stats.totalContacts,
                averageDistance: stats.averageDistance,
                minDistance: stats.minDistance,
                contacts: stats.contacts,
                simulationTime: stats.time,
                simulationStep: stats.step,
                totalEnergy: stats.totalEnergy
              });
            }
          }
        }
      );
      
      mdSimulationRef.current = simulation;
      console.log('✅ MD Simulation initialized successfully');
      return simulation;
    } catch (error) {
      console.error('Error initializing MD simulation:', error);
      return null;
    }
  };
  
  // Update PDB data from atom positions
  const updatePDBFromAtoms = (originalPdb, atoms) => {
    const lines = originalPdb.split('\n');
    let atomIndex = 0;
    const result = [];
    
    for (const line of lines) {
      if (line.startsWith('ATOM ') || line.startsWith('HETATM')) {
        if (atomIndex < atoms.length) {
          const atom = atoms[atomIndex];
          const newLine = 
            line.substring(0, 30) +
            atom.x.toFixed(3).padStart(8) +
            atom.y.toFixed(3).padStart(8) +
            atom.z.toFixed(3).padStart(8) +
            line.substring(54);
          result.push(newLine);
          atomIndex++;
        } else {
          result.push(line);
        }
      } else {
        result.push(line);
      }
    }
    
    return result.join('\n');
  };
  
  // Update viewer with new atom positions (throttled for performance)
  const updateViewerPositions = (viewer, targetAtoms, partnerAtoms) => {
    if (!viewer || !targetAtoms || !partnerAtoms || targetAtoms.length === 0 || partnerAtoms.length === 0) {
      return;
    }
    
    // Throttle updates to ~20fps for better performance
    const now = Date.now();
    if (now - lastUpdateTimeRef.current < 50) return; // ~20fps
    lastUpdateTimeRef.current = now;
    
    try {
      // Verify atoms have actually moved
      const sampleAtom = targetAtoms[0];
      if (sampleAtom && (sampleAtom.x === undefined || isNaN(sampleAtom.x))) {
        console.error('Invalid atom data:', sampleAtom);
        return;
      }
      
      // Convert atoms to PDB format
      const newTargetPdb = updatePDBFromAtoms(targetPdbData, targetAtoms);
      const newPartnerPdb = updatePDBFromAtoms(partnerPdbData, partnerAtoms);
      
      if (!newTargetPdb || !newPartnerPdb || newTargetPdb.length < 100 || newPartnerPdb.length < 100) {
        console.warn('Invalid PDB data generated', {
          targetLength: newTargetPdb?.length || 0,
          partnerLength: newPartnerPdb?.length || 0
        });
        return;
      }
      
      // Store current styles and interactions state
      const currentSelectedResidue = selectedResidue;
      const currentShowInteractions = showInteractions;
      
      // Remove old models - SIMPLIFIED: just remove and re-add
      try {
        // Clear all models
        viewer.removeAll();
      } catch (e) {
        // If removeAll doesn't work, try removing individually
        try {
          viewer.removeModel(0);
          viewer.removeModel(1);
        } catch (e2) {
          // Last resort: clear the div
          if (viewerRef.current) {
            const viewerDiv = viewerRef.current;
            viewerDiv.innerHTML = '';
            // Recreate viewer if needed
            if (window.$3Dmol) {
              const config = { backgroundColor: '#1a1a1a' };
              const newViewer = window.$3Dmol.createViewer(viewerDiv, config);
              viewerInstanceRef.current = newViewer;
              viewer = newViewer;
            }
          }
        }
      }
      
      // Add updated models - CRITICAL: This must work
      try {
        const model1 = viewer.addModel(newTargetPdb, 'pdb');
        const model2 = viewer.addModel(newPartnerPdb, 'pdb');
        
        if (!model1 || !model2) {
          console.error('Failed to add models to viewer');
          return;
        }
      } catch (e) {
        console.error('Error adding models to viewer:', e);
        return;
      }
      
      // Re-apply styles
      viewer.setStyle({ model: 0 }, { cartoon: { color: '#4A90E2' } });
      viewer.setStyle({ model: 1 }, { cartoon: { color: '#9333EA' } });
      
      // Recalculate interactions periodically (not every frame)
      interactionUpdateCounterRef.current++;
      if (interactionUpdateCounterRef.current % 5 === 0) { // Every 5th update
        if (currentShowInteractions) {
          try {
            const stats = calculateInteractions(viewer, 0, 1, true);
            if (stats) {
              setInterfaceContacts(stats.contacts);
            }
          } catch (e) {
            console.warn('Error recalculating interactions:', e);
          }
        }
      }
      
      // Re-highlight selected residue if any
      if (currentSelectedResidue) {
        try {
          highlightResidue(viewer, currentSelectedResidue.model, currentSelectedResidue.chain, currentSelectedResidue.resi);
        } catch (e) {
          // Ignore highlight errors
        }
      }
      
      // CRITICAL: Actually render the viewer
      viewer.render();
      
      // Debug log occasionally
      if (interactionUpdateCounterRef.current % 30 === 0) {
        console.log('Viewer updated successfully', {
          targetAtoms: targetAtoms.length,
          partnerAtoms: partnerAtoms.length,
          sampleTargetPos: { x: targetAtoms[0]?.x?.toFixed(2), y: targetAtoms[0]?.y?.toFixed(2), z: targetAtoms[0]?.z?.toFixed(2) },
          samplePartnerPos: { x: partnerAtoms[0]?.x?.toFixed(2), y: partnerAtoms[0]?.y?.toFixed(2), z: partnerAtoms[0]?.z?.toFixed(2) }
        });
      }
    } catch (error) {
      console.error('Error updating viewer positions:', error);
      console.error('Stack:', error.stack);
    }
  };
  
  // Control simulation
  const startSimulation = () => {
    console.log('Start simulation called', { 
      hasSimulation: !!mdSimulationRef.current, 
      isRunning: isSimulationRunning,
      hasViewer: !!viewerInstanceRef.current 
    });
    
    if (mdSimulationRef.current && !isSimulationRunning) {
      console.log('Starting existing simulation...');
      mdSimulationRef.current.start();
      setIsSimulationRunning(true);
    } else if (!mdSimulationRef.current && viewerInstanceRef.current) {
      console.log('Initializing new simulation...');
      initializeSimulation(viewerInstanceRef.current);
      // Wait a bit for initialization, then start
      setTimeout(() => {
        if (mdSimulationRef.current) {
          console.log('Starting newly initialized simulation...');
          mdSimulationRef.current.start();
          setIsSimulationRunning(true);
        } else {
          console.error('Simulation failed to initialize');
        }
      }, 100);
    } else {
      console.warn('Cannot start simulation:', {
        hasSimulation: !!mdSimulationRef.current,
        isRunning: isSimulationRunning,
        hasViewer: !!viewerInstanceRef.current
      });
    }
  };
  
  const stopSimulation = () => {
    if (mdSimulationRef.current && isSimulationRunning) {
      mdSimulationRef.current.stop();
      setIsSimulationRunning(false);
    }
  };
  
  const resetSimulation = () => {
    if (mdSimulationRef.current) {
      mdSimulationRef.current.reset();
      setIsSimulationRunning(false);
      
      // Reload viewer with original positions
      if (viewerInstanceRef.current) {
        try {
          viewerInstanceRef.current.removeAll();
          viewerInstanceRef.current.addModel(targetPdbData, 'pdb');
          viewerInstanceRef.current.addModel(partnerPdbData, 'pdb');
          
          viewerInstanceRef.current.setStyle({ model: 0 }, { cartoon: { color: '#4A90E2' } });
          viewerInstanceRef.current.setStyle({ model: 1 }, { cartoon: { color: '#9333EA' } });
          
          if (showInteractions) {
            const stats = calculateInteractions(viewerInstanceRef.current, 0, 1, true);
            setInteractionStats(stats);
            setInterfaceContacts(stats.contacts);
          }
          
          viewerInstanceRef.current.zoomTo();
          viewerInstanceRef.current.render();
        } catch (error) {
          console.error('Error resetting viewer:', error);
        }
      }
    }
  };

  // Calculate interactions between two proteins
  const calculateInteractions = (viewer, targetModelIndex, partnerModelIndex, visualize = false) => {
    try {
      const targetAtoms = viewer.selectedAtoms({ model: targetModelIndex });
      const partnerAtoms = viewer.selectedAtoms({ model: partnerModelIndex });
      
      if (!targetAtoms || targetAtoms.length === 0 || !partnerAtoms || partnerAtoms.length === 0) {
        console.warn('No atoms found for interaction calculation');
        return {
          totalContacts: 0,
          contacts: [],
          averageDistance: 0,
          minDistance: 0,
          maxDistance: 0,
          interactionTypes: {},
        };
      }
      
      const contacts = [];
      const interfaceDistance = 5.0; // Angstroms - typical interface distance
      
      // Limit the number of atoms to check for performance (sample if too many)
      const maxAtomsToCheck = 1000;
      const targetSample = targetAtoms.length > maxAtomsToCheck 
        ? targetAtoms.filter((_, i) => i % Math.ceil(targetAtoms.length / maxAtomsToCheck) === 0)
        : targetAtoms;
      const partnerSample = partnerAtoms.length > maxAtomsToCheck
        ? partnerAtoms.filter((_, i) => i % Math.ceil(partnerAtoms.length / maxAtomsToCheck) === 0)
        : partnerAtoms;
      
      // Find interface contacts
      for (const targetAtom of targetSample) {
        for (const partnerAtom of partnerSample) {
          const dist = Math.sqrt(
            Math.pow(targetAtom.x - partnerAtom.x, 2) +
            Math.pow(targetAtom.y - partnerAtom.y, 2) +
            Math.pow(targetAtom.z - partnerAtom.z, 2)
          );
          
          if (dist < interfaceDistance) {
            // Check if this contact is already recorded (same residue pair)
            const existingContact = contacts.find(
              c => c.targetResi === targetAtom.resi && 
                   c.partnerResi === partnerAtom.resi &&
                   c.targetChain === targetAtom.chain &&
                   c.partnerChain === partnerAtom.chain
            );
            
            if (!existingContact) {
              contacts.push({
                targetChain: targetAtom.chain,
                targetResi: targetAtom.resi,
                targetResn: targetAtom.resn,
                targetAtom: targetAtom.atom,
                partnerChain: partnerAtom.chain,
                partnerResi: partnerAtom.resi,
                partnerResn: partnerAtom.resn,
                partnerAtom: partnerAtom.atom,
                distance: dist,
                type: determineInteractionType(targetAtom, partnerAtom, dist),
              });
            } else if (dist < existingContact.distance) {
              // Update with closer distance
              existingContact.distance = dist;
              existingContact.type = determineInteractionType(targetAtom, partnerAtom, dist);
            }
          }
        }
      }

      // Visualize interactions only if requested
      if (visualize) {
        visualizeInteractions(viewer, targetModelIndex, partnerModelIndex, contacts);
      }

      // Calculate statistics
      const stats = {
        totalContacts: contacts.length,
        contacts: contacts.slice(0, 50), // Limit to top 50 for display
        averageDistance: contacts.length > 0 
          ? contacts.reduce((sum, c) => sum + c.distance, 0) / contacts.length 
          : 0,
        minDistance: contacts.length > 0 
          ? Math.min(...contacts.map(c => c.distance))
          : 0,
        maxDistance: contacts.length > 0
          ? Math.max(...contacts.map(c => c.distance))
          : 0,
        interactionTypes: countInteractionTypes(contacts),
      };

      console.log(`✅ Calculated ${contacts.length} interface contacts`);
      return stats;
    } catch (error) {
      console.error('Error in calculateInteractions:', error);
      return {
        totalContacts: 0,
        contacts: [],
        averageDistance: 0,
        minDistance: 0,
        maxDistance: 0,
        interactionTypes: {},
      };
    }
  };

  // Determine interaction type based on atoms and distance
  const determineInteractionType = (atom1, atom2, distance) => {
    const a1 = atom1.atom;
    const a2 = atom2.atom;
    const r1 = atom1.resn;
    const r2 = atom2.resn;

    // Hydrogen bond (N-O or O-N, 2.5-3.5 Å)
    if (((a1 === 'N' && a2 === 'O') || (a1 === 'O' && a2 === 'N')) && distance >= 2.5 && distance <= 3.5) {
      return 'Hydrogen Bond';
    }
    
    // Salt bridge (charged residues, < 4 Å)
    const charged = ['ARG', 'LYS', 'ASP', 'GLU', 'HIS'];
    if ((charged.includes(r1) && charged.includes(r2)) && distance < 4.0) {
      return 'Salt Bridge';
    }
    
    // π-π stacking (aromatic residues, 3.5-5.0 Å)
    const aromatic = ['PHE', 'TYR', 'TRP'];
    if (aromatic.includes(r1) && aromatic.includes(r2) && distance >= 3.5 && distance <= 5.0) {
      return 'π-π Stacking';
    }
    
    // Van der Waals (close contact, < 4 Å)
    if (distance < 4.0) {
      return 'Van der Waals';
    }
    
    return 'Contact';
  };

  // Count interaction types
  const countInteractionTypes = (contacts) => {
    const types = {};
    contacts.forEach(contact => {
      types[contact.type] = (types[contact.type] || 0) + 1;
    });
    return types;
  };

  // Visualize interactions
  const visualizeInteractions = (viewer, targetModelIndex, partnerModelIndex, contacts) => {
    // Show top 30 closest contacts to avoid clutter
    const topContacts = contacts
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 30);

    topContacts.forEach(contact => {
      // Find the actual atoms
      const targetAtoms = viewer.selectedAtoms({
        model: targetModelIndex,
        chain: contact.targetChain,
        resi: contact.targetResi,
        atom: contact.targetAtom,
      });
      
      const partnerAtoms = viewer.selectedAtoms({
        model: partnerModelIndex,
        chain: contact.partnerChain,
        resi: contact.partnerResi,
        atom: contact.partnerAtom,
      });

      if (targetAtoms.length > 0 && partnerAtoms.length > 0) {
        const atom1 = targetAtoms[0];
        const atom2 = partnerAtoms[0];

        // Color based on interaction type - using blue shades
        let color = '#4A90E2'; // Default blue
        if (contact.type === 'Hydrogen Bond') color = '#7DD3FC'; // Light blue
        else if (contact.type === 'Salt Bridge') color = '#0EA5E9'; // Medium blue
        else if (contact.type === 'π-π Stacking') color = '#38BDF8'; // Sky blue
        else if (contact.type === 'Van der Waals') color = '#BAE6FD'; // Very light blue

        // Draw line connecting the atoms
        viewer.addLine({
          start: { x: atom1.x, y: atom1.y, z: atom1.z },
          end: { x: atom2.x, y: atom2.y, z: atom2.z },
          color: color,
          dashed: contact.type === 'Hydrogen Bond',
          linewidth: contact.distance < 3.0 ? 2 : 1,
          opacity: 0.7,
        });
      }
    });
  };

  // Update visualization when options change
  useEffect(() => {
    if (!viewerInstanceRef.current || targetModelRef.current === null || partnerModelRef.current === null) return;
    if (!interfaceContacts || interfaceContacts.length === 0) return;

    const viewer = viewerInstanceRef.current;
    
    try {
      // Clear existing styles and objects
      viewer.removeAllShapes();
      viewer.removeAllLabels();
      
      // Re-apply base styles
      viewer.setStyle(
        { model: 0 },
        { cartoon: { color: '#4A90E2' } }
      );
      viewer.setStyle(
        { model: 1 },
        { cartoon: { color: '#9333EA' } } // Purple - very distinct from blue
      );

      // Show interactions
      if (showInteractions && interfaceContacts.length > 0) {
        visualizeInteractions(viewer, 0, 1, interfaceContacts);
      }

      // Show residue labels
      if (showLabels) {
        addResidueLabels(viewer, 0, 1);
      }

      // Re-highlight selected residue if any
      if (selectedResidue) {
        highlightResidue(viewer, selectedResidue.model, selectedResidue.chain, selectedResidue.resi);
      }

      viewer.render();
    } catch (error) {
      console.error('Error updating visualization:', error);
    }
  }, [showInteractions, showLabels, selectedResidue, interfaceContacts]);

  // Highlight a specific residue - Yellow like left diagram
  const highlightResidue = (viewer, modelIndex, chain, resi) => {
    viewer.setStyle(
      { model: modelIndex, chain: chain, resi: resi },
      { 
        cartoon: { color: '#FFD700' }, // Yellow for highlight (like left diagram)
        stick: { color: '#FFD700', radius: 0.3 }
      }
    );
    
    viewer.render();
  };

  // Add labels to interface residues
  const addResidueLabels = (viewer, targetModelIndex, partnerModelIndex) => {
    // Label interface residues from both proteins
    const interfaceResidues = new Set();
    interfaceContacts.slice(0, 20).forEach(contact => {
      interfaceResidues.add(`0-${contact.targetChain}-${contact.targetResi}`); // 0 = target model
      interfaceResidues.add(`1-${contact.partnerChain}-${contact.partnerResi}`); // 1 = partner model
    });

    interfaceResidues.forEach(residueKey => {
      const [modelIdx, chain, resi] = residueKey.split('-');
      const modelIndex = parseInt(modelIdx);
      const atoms = viewer.selectedAtoms({ model: modelIndex, chain, resi: parseInt(resi), atom: 'CA' });
      
      if (atoms.length > 0) {
        const atom = atoms[0];
        viewer.addLabel(
          `${atom.resn}${atom.resi}`,
          {
            position: atom,
            backgroundColor: modelIndex === 0 ? '#4A90E2' : '#9333EA',
            fontColor: '#FFFFFF',
            fontSize: 10,
            showBackground: true,
            backgroundOpacity: 0.7,
          }
        );
      }
    });
  };

  const hasData = !!targetPdbData && !!partnerPdbData;

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
              position: 'absolute',
              top: 0,
              left: 0,
            }}
          />
          
          {/* Control Panel - Only show if interactions are enabled AND overlays are enabled */}
          {showInteractionsInView && showOverlays && (
            <div
              style={{
                position: 'absolute',
                top: '8px',
                right: '8px',
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                borderRadius: '8px',
                padding: '10px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                fontSize: '10px',
                zIndex: 10,
                minWidth: '180px',
              }}
            >
              <div style={{ fontSize: '9px', fontWeight: '600', marginBottom: '8px', color: '#374151', letterSpacing: '0.3px', textTransform: 'uppercase' }}>
                Interactions
              </div>
              
              <label style={{ display: 'flex', alignItems: 'center', marginBottom: '6px', cursor: 'pointer', fontSize: '11px', color: '#1f2937' }}>
                <input
                  type="checkbox"
                  checked={showInteractions}
                  onChange={(e) => setShowInteractions(e.target.checked)}
                  style={{ marginRight: '6px', cursor: 'pointer', width: '12px', height: '12px' }}
                />
                <span>Show Contacts</span>
              </label>
              
              <label style={{ display: 'flex', alignItems: 'center', marginBottom: '8px', cursor: 'pointer', fontSize: '11px', color: '#1f2937' }}>
                <input
                  type="checkbox"
                  checked={showLabels}
                  onChange={(e) => setShowLabels(e.target.checked)}
                  style={{ marginRight: '6px', cursor: 'pointer', width: '12px', height: '12px' }}
                />
                <span>Labels</span>
              </label>
              
              {/* MD Simulation Status */}
              {isSimulationRunning && (
                <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px solid #e5e7eb' }}>
                  <div style={{ fontSize: '9px', fontWeight: '600', marginBottom: '4px', color: '#374151', letterSpacing: '0.3px', textTransform: 'uppercase' }}>
                    Dynamics
                  </div>
                  <div style={{ fontSize: '9px', color: '#10b981', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                    <span style={{ display: 'inline-block', width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#10b981', animation: 'pulse 2s infinite' }}></span>
                    Simulating...
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Selected Residue Info - Always show when selected - Yellow like left diagram */}
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
                {selectedResidue.model === 0 ? 'Target' : 'Partner'}
              </div>
            </div>
          )}
          
          {/* Legend - Only show if overlays enabled */}
          {showOverlays && (
            <div
              style={{
                position: 'absolute',
                top: '8px',
                left: '8px',
                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                borderRadius: '6px',
                padding: '8px 10px',
                boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
                fontSize: '10px',
                zIndex: 10,
              }}
            >
              <div style={{ fontSize: '9px', fontWeight: '600', marginBottom: '6px', color: '#374151', letterSpacing: '0.3px', textTransform: 'uppercase' }}>
                Proteins
              </div>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '4px' }}>
                <div style={{ width: '12px', height: '12px', backgroundColor: '#4A90E2', borderRadius: '2px', marginRight: '6px' }}></div>
                <span style={{ fontSize: '10px', color: '#1f2937' }}>Target</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <div style={{ width: '12px', height: '12px', backgroundColor: '#9333EA', borderRadius: '2px', marginRight: '6px' }}></div>
                <span style={{ fontSize: '10px', color: '#1f2937' }}>Partner</span>
              </div>
            </div>
          )}
          
          {/* Instructions - Only show if overlays enabled */}
          {showOverlays && (
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
          )}
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
              No structures loaded
            </div>
            <div style={{ fontSize: '13px', color: '#9ca3af', marginTop: '8px' }}>
              Load both target and partner proteins
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InteractionViewer;


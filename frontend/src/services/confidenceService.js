/**
 * Confidence Service
 * Generates per-residue pLDDT scores and PAE matrices
 * from protein interaction data
 */

export const ConfidenceService = {
  /**
   * Generate per-residue pLDDT scores for a protein
   * @param {Object} protein - Protein object
   * @param {Object} interactionStats - Interaction statistics (optional)
   * @returns {Array} Array of {position, score} objects
   */
  generatePLDDTScores(protein, interactionStats = null) {
    if (!protein) {
      return [];
    }

    // Get sequence length from various possible formats
    let sequenceLength = 0;
    if (typeof protein.sequence === 'string') {
      sequenceLength = protein.sequence.length;
    } else if (protein.sequence?.full) {
      sequenceLength = protein.sequence.full.length;
    } else if (protein.sequence?.length) {
      sequenceLength = protein.sequence.length;
    } else if (protein.metrics?.length) {
      sequenceLength = protein.metrics.length;
    }
    
    if (sequenceLength === 0) return [];

    const avgPLDDT = protein.metrics?.plddt || 72.0;
    const scores = [];

    // Generate realistic pLDDT distribution
    // Higher confidence at ends (often more stable), variable in middle
    for (let i = 0; i < sequenceLength; i++) {
      const position = i + 1;
      const normalizedPos = i / Math.max(sequenceLength - 1, 1); // 0 to 1
      
      // Base score around average
      let score = avgPLDDT;
      
      // Add variation: higher at ends, lower in middle
      const endBonus = Math.min(normalizedPos, 1 - normalizedPos) * 15; // Up to 15 points at ends
      score += endBonus;
      
      // Add noise/variation
      const noise = (Math.random() - 0.5) * 20; // ±10 points
      score += noise;
      
      // Boost confidence for residues involved in interactions
      if (interactionStats && interactionStats.contacts) {
        const isInterfaceResidue = interactionStats.contacts.some(contact => {
          const targetResi = contact.targetResi;
          const partnerResi = contact.partnerResi;
          return targetResi === position || partnerResi === position;
        });
        
        if (isInterfaceResidue) {
          score += 10; // Interface residues often have higher confidence
        }
      }
      
      // Clamp to valid range [0, 100]
      score = Math.max(0, Math.min(100, score));
      
      scores.push({
        position,
        score: parseFloat(score.toFixed(1)),
      });
    }

    return scores;
  },

  /**
   * Generate PAE matrix for protein-protein interaction
   * @param {Object} targetProtein - Target protein
   * @param {Object} binderProtein - Partner protein
   * @param {Object} interactionStats - Interaction statistics
   * @returns {Array<Array<number>>} PAE matrix (2D array)
   */
  generatePAEMatrix(targetProtein, binderProtein, interactionStats) {
    if (!targetProtein || !binderProtein || !interactionStats) {
      return null;
    }

    // Get sequence lengths from various possible formats
    let targetLength = 0;
    if (typeof targetProtein.sequence === 'string') {
      targetLength = targetProtein.sequence.length;
    } else if (targetProtein.sequence?.full) {
      targetLength = targetProtein.sequence.full.length;
    } else if (targetProtein.sequence?.length) {
      targetLength = targetProtein.sequence.length;
    } else if (targetProtein.metrics?.length) {
      targetLength = targetProtein.metrics.length;
    }
    
    let binderLength = 0;
    if (typeof binderProtein.sequence === 'string') {
      binderLength = binderProtein.sequence.length;
    } else if (binderProtein.sequence?.full) {
      binderLength = binderProtein.sequence.full.length;
    } else if (binderProtein.sequence?.length) {
      binderLength = binderProtein.sequence.length;
    } else if (binderProtein.metrics?.length) {
      binderLength = binderProtein.metrics.length;
    }
    
    if (targetLength === 0 || binderLength === 0) {
      return null;
    }

    // For interaction PAE, we show error between all residues in the complex
    // This is a simplified model based on interaction contacts
    const totalLength = targetLength + binderLength;
    const paeMatrix = Array.from({ length: totalLength }, () => 
      Array.from({ length: totalLength }, () => 0)
    );

    // Extract contact information
    const contacts = interactionStats.contacts || [];
    
    // Create contact sets for quick lookup
    const targetInterfaceResidues = new Set();
    const binderInterfaceResidues = new Set();
    const contactDistances = new Map();
    
    contacts.forEach(contact => {
      const targetResi = contact.targetResi; // 1-based
      const partnerResi = contact.partnerResi; // 1-based
      const distance = typeof contact.distance === 'number' 
        ? contact.distance 
        : parseFloat(contact.distance) || 5.0;
      
      targetInterfaceResidues.add(targetResi);
      binderInterfaceResidues.add(partnerResi);
      
      // Store contact with both residue indices (0-based for matrix)
      const key1 = `${targetResi - 1}-${partnerResi - 1 + targetLength}`;
      const key2 = `${partnerResi - 1 + targetLength}-${targetResi - 1}`;
      contactDistances.set(key1, distance);
      contactDistances.set(key2, distance);
    });

    // Fill PAE matrix
    for (let i = 0; i < totalLength; i++) {
      for (let j = 0; j < totalLength; j++) {
        if (i === j) {
          // Diagonal: comparing residue to itself = 0 error (perfect alignment)
          paeMatrix[i][j] = 0;
        } else {
          // Check if these residues are in contact
          const key = `${i}-${j}`;
          const distance = contactDistances.get(key);
          
          if (distance !== undefined && distance < 5.0) {
            // Residues are in contact - convert distance to error
            // Closer contacts = lower error (better confidence)
            if (distance < 3.0) {
              paeMatrix[i][j] = distance * 1.2; // Very low error (0-3.6)
            } else if (distance < 3.5) {
              paeMatrix[i][j] = 3.6 + (distance - 3.0) * 3; // Low error (3.6-5.1)
            } else if (distance < 4.5) {
              paeMatrix[i][j] = 5.1 + (distance - 3.5) * 5; // Medium error (5.1-10.1)
            } else {
              paeMatrix[i][j] = 10.1 + (distance - 4.5) * 8; // Higher error (10.1-14.1)
            }
          } else {
            // No direct contact - estimate based on sequence distance and protein context
            const seqDist = Math.abs(i - j);
            const iInTarget = i < targetLength;
            const jInTarget = j < targetLength;
            const isSameProtein = iInTarget === jInTarget;
            
            if (isSameProtein) {
              // Within same protein: error increases with sequence distance
              // But generally lower error than inter-protein
              if (seqDist < 5) {
                paeMatrix[i][j] = 3 + seqDist * 0.5; // Low error for very close residues
              } else if (seqDist < 20) {
                paeMatrix[i][j] = 5.5 + (seqDist - 5) * 0.6; // Medium error
              } else if (seqDist < 50) {
                paeMatrix[i][j] = 14.5 + (seqDist - 20) * 0.3; // Higher error
              } else {
                paeMatrix[i][j] = 23.5 + Math.random() * 6.5; // High error for far residues
              }
            } else {
              // Between different proteins: higher error if not in contact
              // Interface region (boundary between proteins) should have moderate error
              const iResi = i < targetLength ? i + 1 : (i - targetLength + 1);
              const jResi = j < targetLength ? j + 1 : (j - targetLength + 1);
              
              const iNearInterface = iInTarget 
                ? targetInterfaceResidues.has(iResi)
                : binderInterfaceResidues.has(iResi);
              const jNearInterface = jInTarget
                ? targetInterfaceResidues.has(jResi)
                : binderInterfaceResidues.has(jResi);
              
              if (iNearInterface && jNearInterface) {
                // Both near interface but not in direct contact
                paeMatrix[i][j] = 15 + Math.random() * 10; // Medium-high error
              } else {
                // Far from interface
                paeMatrix[i][j] = 22 + Math.random() * 8; // High error
              }
            }
          }
          
          // Clamp to reasonable range [0, 30]
          paeMatrix[i][j] = Math.max(0, Math.min(30, paeMatrix[i][j]));
        }
      }
    }
    
    // Smooth the diagonal region (residues close to diagonal should have lower error)
    for (let i = 0; i < totalLength; i++) {
      for (let j = 0; j < totalLength; j++) {
        const distFromDiag = Math.abs(i - j);
        if (distFromDiag < 10 && paeMatrix[i][j] > 10) {
          // Reduce error for residues close to diagonal
          paeMatrix[i][j] = Math.min(paeMatrix[i][j], 8 + distFromDiag * 0.5);
        }
      }
    }
    
    // Create blocks for same-protein regions (should show lower error)
    // Target protein block (top-left)
    for (let i = 0; i < targetLength; i++) {
      for (let j = 0; j < targetLength; j++) {
        if (i !== j) {
          const seqDist = Math.abs(i - j);
          if (seqDist < 30) {
            // Reduce error for nearby residues in same protein
            paeMatrix[i][j] = Math.min(paeMatrix[i][j], 8 + seqDist * 0.2);
          }
        }
      }
    }
    
    // Partner protein block (bottom-right)
    for (let i = targetLength; i < totalLength; i++) {
      for (let j = targetLength; j < totalLength; j++) {
        if (i !== j) {
          const seqDist = Math.abs(i - j);
          if (seqDist < 30) {
            // Reduce error for nearby residues in same protein
            paeMatrix[i][j] = Math.min(paeMatrix[i][j], 8 + seqDist * 0.2);
          }
        }
      }
    }

    return {
      matrix: paeMatrix,
      targetLength,
      binderLength,
      totalLength,
    };
  },

  /**
   * Calculate interface quality score
   * @param {Object} interactionStats - Interaction statistics
   * @returns {number} Interface quality score (0-100)
   */
  calculateInterfaceQuality(interactionStats) {
    if (!interactionStats) return 0;

    const totalContacts = interactionStats.totalContacts || 0;
    const avgDistance = interactionStats.averageDistance || 5.0;
    const minDistance = interactionStats.minDistance || 5.0;

    // Quality based on number of contacts and distances
    let quality = 0;
    
    // More contacts = better (up to 50 points)
    quality += Math.min(50, (totalContacts / 50) * 50);
    
    // Closer average distance = better (up to 30 points)
    quality += Math.max(0, 30 - (avgDistance - 2.0) * 10);
    
    // Very close minimum distance = better (up to 20 points)
    quality += Math.max(0, 20 - (minDistance - 1.5) * 10);

    return Math.min(100, Math.max(0, quality));
  },
};

export default ConfidenceService;

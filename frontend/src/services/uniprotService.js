/**
 * UniProt Service
 * Fetches detailed protein information from UniProt API
 */

export const UniProtService = {
  /**
   * Fetch detailed protein information from UniProt
   * @param {string} uniprotId - UniProt ID (e.g., 'P01308')
   * @returns {Promise<Object>} Detailed protein data
   */
  async fetchProteinDetails(uniprotId) {
    try {
      const response = await fetch(
        `https://rest.uniprot.org/uniprotkb/${uniprotId}.json`
      );
      
      if (!response.ok) {
        throw new Error(`Failed to fetch UniProt data for ${uniprotId}`);
      }
      
      const data = await response.json();
      return this.parseUniProtData(data);
    } catch (error) {
      console.error('Error fetching UniProt details:', error);
      throw error;
    }
  },

  /**
   * Parse UniProt JSON response into structured data
   */
  parseUniProtData(data) {
    const result = {
      // Basic info
      uniprotId: data.primaryAccession,
      name: data.proteinDescription?.recommendedName?.fullName?.value || '',
      geneName: data.genes?.[0]?.geneName?.value || '',
      organism: data.organism?.scientificName || '',
      
      // Function
      function: data.comments?.find(c => c.commentType === 'FUNCTION')?.texts?.[0]?.value || '',
      
      // GO terms (Biological Process, Molecular Function, Cellular Component)
      goTerms: {
        biologicalProcess: [],
        molecularFunction: [],
        cellularComponent: [],
      },
      
      // Domains
      domains: [],
      
      // Binding sites
      bindingSites: [],
      
      // Variants
      variants: [],
      
      // Post-translational modifications
      ptms: [],
      
      // Subcellular localization
      subcellularLocation: '',
      
      // Interactions
      interactions: [],
      
      // Sequence features
      features: [],
      
      // Keywords
      keywords: [],
    };

    // Parse GO terms from crossReferences
    if (data.crossReferences) {
      data.crossReferences.forEach(ref => {
        if (ref.database === 'GO') {
          const properties = ref.properties || {};
          // GO terms typically have properties like: {"GoTerm":["P:0000001","biological_process"]}
          // or the aspect is in the properties
          const goTerms = properties.GoTerm;
          const goId = ref.id;
          
          // Determine aspect from properties
          let aspect = '';
          let goName = goId;
          
          if (Array.isArray(goTerms) && goTerms.length >= 2) {
            aspect = goTerms[0] || '';
            goName = goTerms[1] || goId;
          } else if (typeof goTerms === 'string') {
            aspect = goTerms;
            goName = properties.GoTermName || goId;
          }
          
          // Categorize by aspect prefix (P, F, or C)
          if (aspect.startsWith('P:') || aspect.toLowerCase().includes('p:') || aspect.toLowerCase().includes('biological_process')) {
            result.goTerms.biologicalProcess.push({
              id: goId,
              name: goName,
            });
          } else if (aspect.startsWith('F:') || aspect.toLowerCase().includes('f:') || aspect.toLowerCase().includes('molecular_function')) {
            result.goTerms.molecularFunction.push({
              id: goId,
              name: goName,
            });
          } else if (aspect.startsWith('C:') || aspect.toLowerCase().includes('c:') || aspect.toLowerCase().includes('cellular_component')) {
            result.goTerms.cellularComponent.push({
              id: goId,
              name: goName,
            });
          }
        }
      });
    }

    // Parse domains
    if (data.features) {
      data.features.forEach(feature => {
        if (feature.type === 'Domain' || feature.type === 'Region') {
          result.domains.push({
            name: feature.description || feature.type,
            start: feature.location?.start?.value,
            end: feature.location?.end?.value,
          });
        } else if (feature.type === 'Binding site') {
          result.bindingSites.push({
            description: feature.description || '',
            position: feature.location?.start?.value,
          });
        } else if (feature.type === 'Modified residue') {
          result.ptms.push({
            type: feature.description || 'Modified residue',
            position: feature.location?.start?.value,
          });
        } else if (feature.type === 'Natural variant') {
          // Extract disease information from feature description or evidences
          let disease = '';
          if (feature.description) {
            // Try to extract disease name from description
            const desc = feature.description.toLowerCase();
            if (desc.includes('disease')) {
              disease = feature.description;
            }
          }
          // Also check evidences for disease
          if (feature.evidences && feature.evidences.length > 0) {
            const diseaseEvidence = feature.evidences.find(e => e.disease);
            if (diseaseEvidence) {
              disease = diseaseEvidence.disease?.value || diseaseEvidence.disease || disease;
            }
          }
          
          result.variants.push({
            position: feature.location?.start?.value || feature.location?.start || '',
            wildType: feature.wildType || feature.alternativeSequence?.[0] || '',
            mutant: feature.alternativeSequence || feature.alternativeSequence?.[0] || '',
            description: feature.description || '',
            disease: disease,
          });
        }
      });
    }

    // Parse subcellular location
    const locationComment = data.comments?.find(c => c.commentType === 'SUBCELLULAR LOCATION');
    if (locationComment) {
      result.subcellularLocation = locationComment.subcellularLocations?.[0]?.location?.value || '';
    }

    // Parse keywords
    if (data.keywords) {
      result.keywords = data.keywords.map(kw => kw.value);
    }

    // Parse interactions (from comments)
    const interactionComment = data.comments?.find(c => c.commentType === 'INTERACTION');
    if (interactionComment && interactionComment.interactions) {
      result.interactions = interactionComment.interactions.map(interaction => {
        // UniProt uses interactantOne and interactantTwo
        const interactant1 = interaction.interactantOne;
        const interactant2 = interaction.interactantTwo;
        
        if (interactant1 && interactant2) {
          // Extract UniProt IDs - prioritize uniProtKBAccession, fallback to other IDs
          const getId = (interactant) => {
            // First try uniProtKBAccession (most reliable)
            if (interactant.uniProtKBAccession) {
              return interactant.uniProtKBAccession;
            }
            // Try intActId (might be a UniProt ID format)
            if (interactant.intActId) {
              // Check if it looks like a UniProt ID
              if (/^[A-Z][0-9][A-Z0-9]{3}[0-9]$/.test(interactant.intActId)) {
                return interactant.intActId;
              }
            }
            // Try database id from crossReferences
            if (interactant.dbReferences && interactant.dbReferences.length > 0) {
              const uniprotRef = interactant.dbReferences.find(ref => ref.database === 'UniProtKB');
              if (uniprotRef && uniprotRef.id) {
                return uniprotRef.id;
              }
            }
            // Last resort: use any available ID
            return interactant.uniProtKBAccession || interactant.intActId || interactant.dbXrefs?.[0] || '';
          };
          
          const id1 = getId(interactant1);
          const id2 = getId(interactant2);
          
          if (!id1 || !id2) {
            return null; // Skip if we can't get valid IDs
          }
          
          // Extract evidence information
          const evidences = interaction.evidences || [];
          const numberOfExperiments = interaction.numberOfExperiments || evidences.length || 0;
          
          // Extract methods from evidences
          const methods = [];
          evidences.forEach(evidence => {
            if (evidence.interactionDetectionMethod) {
              methods.push({
                methodName: evidence.interactionDetectionMethod.value || '',
                methodId: evidence.interactionDetectionMethod.id || '',
              });
            }
          });
          
          return {
            interactor1: id1,
            interactor2: id2,
            type: 'Physical interaction',
            numberOfExperiments: numberOfExperiments,
            evidences: evidences,
            methods: methods,
          };
        }
        return null;
      }).filter(Boolean);
    }

    return result;
  },

  /**
   * Calculate secondary structure percentages from PDB data
   * This is a simplified calculation - in practice, you'd use DSSP or similar
   */
  calculateSecondaryStructure(pdbData) {
    if (!pdbData) return { helix: 0, sheet: 0, coil: 0 };
    
    // Simplified: count residues (this is a placeholder)
    // Real implementation would parse PDB and use DSSP
    const lines = pdbData.split('\n');
    const residues = new Set();
    
    lines.forEach(line => {
      if (line.startsWith('ATOM')) {
        const resSeq = line.substring(22, 26).trim();
        const chain = line.substring(21, 22);
        residues.add(`${chain}_${resSeq}`);
      }
    });
    
    const totalResidues = residues.size;
    
    // Placeholder percentages (would be calculated from actual structure)
    return {
      helix: 0,
      sheet: 0,
      coil: 0,
      total: totalResidues,
    };
  },
};

export default UniProtService;


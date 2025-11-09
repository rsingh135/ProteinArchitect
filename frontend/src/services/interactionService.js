/**
 * Interaction Service
 * Fetches protein-protein interaction data from various databases
 */

import UniProtService from './uniprotService';

export const InteractionService = {
  /**
   * Check if a protein exists in AlphaFold database
   * @param {string} uniprotId - UniProt ID
   * @returns {Promise<boolean>} True if protein exists in AlphaFold
   */
  async checkAlphaFoldAvailability(uniprotId) {
    try {
      const response = await fetch(
        `https://alphafold.ebi.ac.uk/api/prediction/${uniprotId}`
      );
      return response.ok;
    } catch (error) {
      return false;
    }
  },
  /**
   * Fetch protein-protein interactions for a given protein
   * @param {string} uniprotId - UniProt ID
   * @returns {Promise<Array>} Array of interaction partners with metadata
   */
  async fetchInteractions(uniprotId) {
    if (!uniprotId) return [];

    try {
      // Fetch from UniProt API
      const uniprotData = await UniProtService.fetchProteinDetails(uniprotId);
      
      if (!uniprotData.interactions || uniprotData.interactions.length === 0) {
        // Try to fetch from STRING database as fallback
        return await this.fetchFromSTRING(uniprotId);
      }

      // Process UniProt interactions
      const interactions = [];
      const processedIds = new Set(); // Avoid duplicates

      for (const interaction of uniprotData.interactions) {
        // Determine which interactor is the partner (not the target)
        const partnerId = interaction.interactor1 === uniprotId 
          ? interaction.interactor2 
          : interaction.interactor1;

        if (partnerId && partnerId !== uniprotId && !processedIds.has(partnerId)) {
          processedIds.add(partnerId);
          
          // Check if partner exists in AlphaFold before adding
          const existsInAlphaFold = await this.checkAlphaFoldAvailability(partnerId);
          if (!existsInAlphaFold) {
            console.log(`Skipping ${partnerId} - not in AlphaFold database`);
            continue;
          }
          
          try {
            // Fetch partner protein details to get name
            const partnerData = await UniProtService.fetchProteinDetails(partnerId);
            
            // Calculate confidence from interaction evidence
            const confidence = this.calculateConfidence(interaction, uniprotData);
            
            interactions.push({
              id: partnerId,
              name: partnerData.name || partnerId,
              confidence: confidence,
              source: 'UniProt',
              type: interaction.type || 'Physical interaction',
            });
          } catch (error) {
            console.warn(`Error fetching details for ${partnerId}:`, error);
            // Skip if we can't fetch details
            continue;
          }
        }
      }

      // Sort by confidence (highest first) and limit to top 4
      return interactions
        .sort((a, b) => b.confidence - a.confidence)
        .slice(0, 4);
    } catch (error) {
      console.error('Error fetching interactions:', error);
      // Fallback to STRING
      return await this.fetchFromSTRING(uniprotId);
    }
  },

  /**
   * Fetch interactions from STRING database
   * @param {string} uniprotId - UniProt ID
   * @returns {Promise<Array>} Array of interaction partners
   */
  async fetchFromSTRING(uniprotId) {
    try {
      // Use STRING's enrichment API which returns interactions with better UniProt mapping
      // This endpoint returns interactions with both STRING IDs and UniProt IDs when available
      const stringUrl = `https://string-db.org/api/tsv/interaction_partners?identifiers=${uniprotId}&species=9606&limit=4&required_score=400`;
      
      const response = await fetch(stringUrl);
      if (!response.ok) {
        throw new Error('STRING API request failed');
      }

      const text = await response.text();
      
      if (!text || text.trim().length === 0) {
        return [];
      }

      // Parse TSV format
      const lines = text.trim().split('\n');
      if (lines.length <= 1) {
        return []; // Only header or empty
      }

      // Parse TSV header to understand column order
      const header = lines[0].split('\t');
      const interactions = [];
      const processedIds = new Set();
      
      // Find column indices (STRING API format can vary)
      const getColumnIndex = (header, possibleNames) => {
        for (const name of possibleNames) {
          const idx = header.findIndex(col => col.toLowerCase().includes(name.toLowerCase()));
          if (idx !== -1) return idx;
        }
        return -1;
      };
      
      const stringIdAIdx = getColumnIndex(header, ['stringid_a', 'stringid_a']);
      const stringIdBIdx = getColumnIndex(header, ['stringid_b', 'stringid_b']);
      const nameAIdx = getColumnIndex(header, ['preferredname_a', 'preferred_name_a']);
      const nameBIdx = getColumnIndex(header, ['preferredname_b', 'preferred_name_b']);
      const scoreIdx = getColumnIndex(header, ['score', 'combined_score']);
      
      // Fallback to positional if header parsing fails
      const usePositional = stringIdAIdx === -1 || stringIdBIdx === -1 || scoreIdx === -1;
      
      for (let i = 1; i < lines.length && interactions.length < 4; i++) {
        const columns = lines[i].split('\t');
        if (columns.length < 5) continue;
        
        let partnerUniProtId, partnerName, score;
        
        if (usePositional) {
          // Fallback: use positional indices (0, 1, 2, 3, 4)
          const stringIdA = columns[0];
          const stringIdB = columns[1];
          const nameA = columns[2] || '';
          const nameB = columns[3] || '';
          score = parseFloat(columns[4]) || 0;
          
          // Determine partner (the one that's not the target)
          if (stringIdA.includes(uniprotId) || nameA === uniprotId) {
            partnerUniProtId = stringIdB;
            partnerName = nameB;
          } else {
            partnerUniProtId = stringIdA;
            partnerName = nameA;
          }
        } else {
          const stringIdA = columns[stringIdAIdx];
          const stringIdB = columns[stringIdBIdx];
          const nameA = nameAIdx !== -1 ? columns[nameAIdx] : '';
          const nameB = nameBIdx !== -1 ? columns[nameBIdx] : '';
          score = parseFloat(columns[scoreIdx]) || 0;
          
          if (stringIdA.includes(uniprotId) || nameA === uniprotId) {
            partnerUniProtId = stringIdB;
            partnerName = nameB;
          } else {
            partnerUniProtId = stringIdA;
            partnerName = nameA;
          }
        }
        
        // Skip if already processed
        if (processedIds.has(partnerUniProtId) || !partnerUniProtId) {
          continue;
        }
        processedIds.add(partnerUniProtId);
        
        // Try to find UniProt ID
        let finalUniProtId = partnerUniProtId;
        
        // If it looks like a UniProt ID, use it directly
        if (/^[A-Z][0-9][A-Z0-9]{3}[0-9]$/.test(partnerUniProtId)) {
          finalUniProtId = partnerUniProtId;
        } else if (partnerName) {
          // Try to search UniProt by name
          try {
            const searchQuery = encodeURIComponent(partnerName);
            const uniprotSearchUrl = `https://rest.uniprot.org/uniprotkb/search?query=${searchQuery}+AND+reviewed:true+AND+organism_id:9606&format=json&size=1`;
            const uniprotResponse = await fetch(uniprotSearchUrl);
            
            if (uniprotResponse.ok) {
              const uniprotData = await uniprotResponse.json();
              if (uniprotData.results && uniprotData.results.length > 0) {
                finalUniProtId = uniprotData.results[0].primaryAccession;
              }
            }
          } catch (searchError) {
            console.warn('Could not find UniProt ID for:', partnerName);
            continue; // Skip if we can't find UniProt ID
          }
        } else {
          continue; // Skip if no name
        }
        
        // Check if partner exists in AlphaFold before adding
        const existsInAlphaFold = await this.checkAlphaFoldAvailability(finalUniProtId);
        if (!existsInAlphaFold) {
          console.log(`Skipping ${finalUniProtId} - not in AlphaFold database`);
          continue;
        }
        
        interactions.push({
          id: finalUniProtId,
          name: partnerName || finalUniProtId,
          confidence: score / 1000, // STRING scores are 0-1000, convert to 0-1
          source: 'STRING',
          type: 'Physical interaction',
        });
      }

      return interactions.sort((a, b) => b.confidence - a.confidence);
    } catch (error) {
      console.error('Error fetching from STRING:', error);
      return [];
    }
  },

  /**
   * Calculate confidence score from interaction data
   * @param {Object} interaction - Interaction data from UniProt
   * @param {Object} uniprotData - Full UniProt data to extract evidence
   * @returns {number} Confidence score (0-1)
   */
  calculateConfidence(interaction, uniprotData) {
    // Try to extract evidence information from the interaction
    // UniProt interactions can have different evidence types
    
    // Check if interaction has numberOfExperiments field
    if (interaction.numberOfExperiments) {
      // More experiments = higher confidence
      // Scale: 1 experiment = 0.6, 2-3 = 0.75, 4-5 = 0.85, 6+ = 0.95
      const expCount = interaction.numberOfExperiments;
      if (expCount >= 6) return 0.95;
      if (expCount >= 4) return 0.85;
      if (expCount >= 2) return 0.75;
      return 0.60;
    }
    
    // Check for evidence types in the interaction
    if (interaction.evidences && Array.isArray(interaction.evidences)) {
      const evidenceCount = interaction.evidences.length;
      // Scale confidence based on evidence count
      if (evidenceCount >= 5) return 0.90;
      if (evidenceCount >= 3) return 0.80;
      if (evidenceCount >= 2) return 0.70;
      if (evidenceCount >= 1) return 0.60;
    }
    
    // Check for methods - certain methods indicate higher confidence
    if (interaction.methods && Array.isArray(interaction.methods)) {
      const highConfidenceMethods = ['x-ray', 'nmr', 'cryo-em'];
      const hasHighConfMethod = interaction.methods.some(m => 
        highConfidenceMethods.some(hcm => 
          (m.methodName || '').toLowerCase().includes(hcm)
        )
      );
      if (hasHighConfMethod) return 0.85;
    }
    
    // If interaction is from UniProt (curated), it's at least moderately confident
    // But we'll be conservative and use a lower default
    return 0.70; // Conservative default for curated UniProt interactions
  },
};

export default InteractionService;


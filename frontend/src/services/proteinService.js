/**
 * Protein Service Layer
 * 
 * This service provides a unified interface for fetching protein data.
 * Currently uses AlphaFold API, but can be easily swapped with your own model.
 * 
 * To switch to your own model:
 * 1. Replace the implementation in alphafoldProvider
 * 2. Or create a new provider and update ACTIVE_PROVIDER
 */

// ==================== PROVIDER CONFIGURATION ====================
// Change this to switch between providers
const ACTIVE_PROVIDER = 'alphafold'; // Options: 'alphafold' | 'custom'

// ==================== ALPHAFOLD PROVIDER ====================
const alphafoldProvider = {
  name: 'AlphaFold',
  
  /**
   * Search for protein by UniProt ID or protein name
   * @param {string} query - UniProt ID (e.g., 'P01308') or protein name
   * @returns {Promise<Object>} Protein data
   */
  async searchProtein(query) {
    try {
      // Normalize query - remove spaces, convert to uppercase
      const normalizedQuery = query.trim().toUpperCase();
      
      // Check if it looks like a UniProt ID (starts with letter, has numbers)
      const isUniProtId = /^[A-Z][0-9][A-Z0-9]{3}[0-9]|[A-Z]{3}[0-9]{5}$/.test(normalizedQuery);
      
      let uniprotId = normalizedQuery;
      
      // If not a UniProt ID, try to search for it
      if (!isUniProtId) {
        uniprotId = await this.searchByName(query);
        if (!uniprotId) {
          throw new Error(`Could not find protein: ${query}`);
        }
      }
      
      // Fetch from AlphaFold API
      const response = await fetch(
        `https://alphafold.ebi.ac.uk/api/prediction/${uniprotId}`
      );
      
      if (!response.ok) {
        throw new Error(`Protein not found in AlphaFold database: ${uniprotId}`);
      }
      
      const data = await response.json();
      
      // Transform to our standard format
      return this.transformData(data[0], uniprotId);
    } catch (error) {
      console.error('AlphaFold search error:', error);
      throw error;
    }
  },
  
  /**
   * Search UniProt by protein name
   * @param {string} name - Protein name
   * @returns {Promise<string|null>} UniProt ID
   */
  async searchByName(name) {
    try {
      // Use UniProt API to search by name - get top 10 results
      const response = await fetch(
        `https://rest.uniprot.org/uniprotkb/search?query=${encodeURIComponent(name)}&format=json&size=10`
      );
      
      if (!response.ok) return null;
      
      const data = await response.json();
      if (!data.results || data.results.length === 0) {
        return null;
      }
      
      // Score each result based on name similarity
      const scoredResults = data.results.map(entry => {
        const proteinName = entry.proteinDescription?.recommendedName?.fullName?.value || '';
        const geneName = entry.genes?.[0]?.geneName?.value || '';
        const searchLower = name.toLowerCase();
        const nameLower = proteinName.toLowerCase();
        const geneLower = geneName.toLowerCase();
        
        let score = 0;
        
        // Exact match (highest priority)
        if (nameLower === searchLower || geneLower === searchLower) {
          score = 1000;
        }
        // Starts with search term
        else if (nameLower.startsWith(searchLower) || geneLower.startsWith(searchLower)) {
          score = 500;
        }
        // Contains search term
        else if (nameLower.includes(searchLower) || geneLower.includes(searchLower)) {
          score = 100;
        }
        
        // Bonus for human proteins (common use case)
        if (entry.organism?.scientificName === 'Homo sapiens') {
          score += 50;
        }
        
        // Bonus for reviewed (Swiss-Prot) entries
        if (entry.entryType === 'UniProtKB reviewed (Swiss-Prot)') {
          score += 25;
        }
        
        // Penalty for fragments
        if (proteinName.toLowerCase().includes('fragment')) {
          score -= 50;
        }
        
        return {
          id: entry.primaryAccession,
          name: proteinName,
          gene: geneName,
          organism: entry.organism?.scientificName || '',
          score,
        };
      });
      
      // Sort by score (highest first)
      scoredResults.sort((a, b) => b.score - a.score);
      
      console.log('🔍 Search results for:', name);
      console.log('Top matches:', scoredResults.slice(0, 3).map(r => `${r.name} (${r.id}) - Score: ${r.score}`));
      
      // Return the best match
      return scoredResults[0].id;
    } catch (error) {
      console.error('UniProt search error:', error);
      return null;
    }
  },
  
  /**
   * Transform AlphaFold data to our standard format
   */
  transformData(afData, uniprotId) {
    return {
      id: uniprotId,
      name: afData.uniprotDescription || 'Unknown Protein',
      organism: afData.organismScientificName || 'Unknown',
      uniprotId: uniprotId,
      
      // Structure data
      structure: {
        pdbUrl: afData.pdbUrl,
        cifUrl: afData.cifUrl,
        bcifUrl: afData.bcifUrl, // Binary CIF for faster loading
      },
      
      // Sequence data
      sequence: {
        full: afData.uniprotSequence || '',
        length: afData.uniprotSequence?.length || 0,
      },
      
      // Confidence/Quality metrics
      metrics: {
        plddt: this.calculateAveragePLDDT(afData),
        confidence: this.getConfidenceLevel(afData),
        modelVersion: afData.latestVersion || 'v4',
        modelDate: afData.modelCreatedDate || null,
      },
      
      // Additional metadata
      metadata: {
        entryId: afData.entryId,
        gene: afData.gene || null,
        uniprotStart: afData.uniprotStart,
        uniprotEnd: afData.uniprotEnd,
        globalMetricValue: afData.globalMetricValue,
      },
      
      // Raw data for advanced use
      _raw: afData,
      _provider: 'alphafold',
    };
  },
  
  /**
   * Calculate average pLDDT from AlphaFold data
   */
  calculateAveragePLDDT(afData) {
    // AlphaFold provides globalMetricValue which is the average pLDDT
    return afData.globalMetricValue || 0;
  },
  
  /**
   * Get confidence level based on pLDDT
   */
  getConfidenceLevel(afData) {
    const plddt = afData.globalMetricValue || 0;
    if (plddt >= 90) return 'very-high';
    if (plddt >= 70) return 'high';
    if (plddt >= 50) return 'medium';
    return 'low';
  },
  
  /**
   * Fetch PDB structure file
   */
  async fetchPDBStructure(proteinData) {
    try {
      const pdbUrl = proteinData.structure.pdbUrl;
      const response = await fetch(pdbUrl);
      if (!response.ok) {
        throw new Error('Failed to fetch PDB structure');
      }
      return await response.text();
    } catch (error) {
      console.error('Error fetching PDB:', error);
      throw error;
    }
  },
  
  /**
   * Fetch CIF structure file (faster, binary format)
   */
  async fetchCIFStructure(proteinData) {
    try {
      const cifUrl = proteinData.structure.bcifUrl || proteinData.structure.cifUrl;
      const response = await fetch(cifUrl);
      if (!response.ok) {
        throw new Error('Failed to fetch CIF structure');
      }
      return await response.arrayBuffer();
    } catch (error) {
      console.error('Error fetching CIF:', error);
      throw error;
    }
  },
};

// ==================== CUSTOM PROVIDER (Placeholder) ====================
const customProvider = {
  name: 'Custom Model',
  
  async searchProtein(query) {
    // TODO: Replace with your own model API
    // Example:
    // const response = await fetch('YOUR_API_ENDPOINT', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ query }),
    // });
    // const data = await response.json();
    // return this.transformData(data);
    
    throw new Error('Custom provider not implemented yet. Using AlphaFold as fallback.');
  },
  
  transformData(data) {
    // Transform your model's data to our standard format
    return {
      id: data.id,
      name: data.name,
      organism: data.organism,
      uniprotId: data.uniprot_id,
      structure: {
        pdbUrl: data.pdb_url,
        // ... other fields
      },
      sequence: {
        full: data.sequence,
        length: data.sequence.length,
      },
      metrics: {
        plddt: data.confidence_score,
        confidence: data.confidence_level,
        // ... other metrics
      },
      metadata: {},
      _raw: data,
      _provider: 'custom',
    };
  },
  
  async fetchPDBStructure(proteinData) {
    // TODO: Implement structure fetching from your model
    throw new Error('Not implemented');
  },
};

// ==================== PROVIDER REGISTRY ====================
const providers = {
  alphafold: alphafoldProvider,
  custom: customProvider,
};

// ==================== PUBLIC API ====================
export const ProteinService = {
  /**
   * Get the current active provider
   */
  getProvider() {
    return providers[ACTIVE_PROVIDER];
  },
  
  /**
   * Search for a protein
   * @param {string} query - UniProt ID or protein name
   * @returns {Promise<Object>} Protein data
   */
  async searchProtein(query) {
    const provider = this.getProvider();
    console.log(`🔍 Searching for protein using ${provider.name}:`, query);
    
    try {
      const result = await provider.searchProtein(query);
      console.log(`✅ Found protein:`, result.name);
      return result;
    } catch (error) {
      // Fallback to AlphaFold if custom provider fails
      if (ACTIVE_PROVIDER !== 'alphafold') {
        console.warn(`⚠️ ${provider.name} failed, falling back to AlphaFold`);
        return await alphafoldProvider.searchProtein(query);
      }
      throw error;
    }
  },
  
  /**
   * Fetch structure file for visualization
   * @param {Object} proteinData - Protein data object
   * @param {string} format - 'pdb' or 'cif'
   * @returns {Promise<string|ArrayBuffer>} Structure data
   */
  async fetchStructure(proteinData, format = 'pdb') {
    const provider = providers[proteinData._provider || ACTIVE_PROVIDER];
    
    if (format === 'pdb') {
      return await provider.fetchPDBStructure(proteinData);
    } else {
      return await provider.fetchCIFStructure(proteinData);
    }
  },
  
  /**
   * Get confidence color for visualization
   */
  getConfidenceColor(plddt) {
    if (plddt >= 90) return '#00B050'; // Green
    if (plddt >= 70) return '#92D050'; // Light green
    if (plddt >= 50) return '#FFC000'; // Orange
    return '#FF0000'; // Red
  },
  
  /**
   * Calculate molecular weight from sequence
   */
  calculateMolecularWeight(sequence) {
    // Approximate MW calculation (average amino acid MW ≈ 110 Da)
    return (sequence.length * 110) / 1000; // Return in kDa
  },
};

// Export provider names for UI
export const AVAILABLE_PROVIDERS = Object.keys(providers);
export const CURRENT_PROVIDER = ACTIVE_PROVIDER;

export default ProteinService;


/**
 * Analysis Service
 * Provides comprehensive protein analysis data by combining
 * multiple data sources (UniProt, AlphaFold, interaction data)
 */

import UniProtService from './uniprotService';
import axios from 'axios';

export const AnalysisService = {
  /**
   * Get comprehensive analysis data for a protein
   * @param {Object} protein - Protein object from store
   * @param {Object} interactionStats - Interaction statistics (optional)
   * @param {Object} binderProtein - Partner protein (optional)
   * @returns {Promise<Object>} Analysis data
   */
  async getAnalysisData(protein, interactionStats = null, binderProtein = null) {
    if (!protein || !protein.uniprotId) {
      return this.getEmptyAnalysisData();
    }

    try {
      // Fetch detailed UniProt data
      const uniprotData = await UniProtService.fetchProteinDetails(protein.uniprotId);
      
      // Calculate statistics
      const stats = this.calculateStatistics(uniprotData, interactionStats, protein);
      
      // Get functional analysis
      const functionalAnalysis = this.getFunctionalAnalysis(uniprotData, protein);
      
      // Get structural analysis
      const structuralAnalysis = await this.getStructuralAnalysis(protein);
      
      // Get interaction analysis
      const interactionAnalysis = this.getInteractionAnalysis(uniprotData, interactionStats, binderProtein);
      
      // Get variant analysis
      const variantAnalysis = this.getVariantAnalysis(uniprotData);
      
      // Get evolutionary analysis
      const evolutionaryAnalysis = await this.getEvolutionaryAnalysis(uniprotData, protein);
      
      return {
        stats,
        functionalAnalysis,
        structuralAnalysis,
        interactionAnalysis,
        variantAnalysis,
        evolutionaryAnalysis,
      };
    } catch (error) {
      console.error('Error getting analysis data:', error);
      // Return empty data structure on error
      return this.getEmptyAnalysisData();
    }
  },

  /**
   * Calculate overall statistics
   */
  calculateStatistics(uniprotData, interactionStats, protein) {
    return {
      functionalDomains: uniprotData.domains.length,
      bindingSites: uniprotData.bindingSites.length || (interactionStats?.totalContacts > 0 ? 1 : 0),
      diseaseVariants: uniprotData.variants.filter(v => v.disease).length,
      proteinInteractions: uniprotData.interactions.length || (interactionStats ? 1 : 0),
      ptms: uniprotData.ptms.length,
      subcellularLocation: uniprotData.subcellularLocation || 'Unknown',
    };
  },

  /**
   * Get functional analysis data
   */
  getFunctionalAnalysis(uniprotData, protein) {
    return {
      function: uniprotData.function || protein.function || 'Function not specified',
      biologicalProcess: uniprotData.goTerms.biologicalProcess.map(t => t.name).join('; ') || 'Not specified',
      molecularFunction: uniprotData.goTerms.molecularFunction.map(t => t.name).join('; ') || 'Not specified',
      cellularComponent: uniprotData.goTerms.cellularComponent.map(t => t.name).join('; ') || 'Not specified',
    };
  },

  /**
   * Get structural analysis data
   */
  async getStructuralAnalysis(protein) {
    // Get sequence length
    const sequenceLength = protein.sequence?.length || protein.sequence?.full?.length || 0;
    
    // For secondary structure, we'd need to parse PDB or use a prediction tool
    // For now, provide placeholder percentages (real implementation would use DSSP)
    const percentages = {
      helix: '30.0', // Placeholder - would be calculated from structure
      sheet: '20.0', // Placeholder - would be calculated from structure
      coil: '50.0', // Placeholder - would be calculated from structure
    };
    
    // If we have pLDDT, use it to describe tertiary structure
    const plddt = protein.metrics?.plddt;
    let tertiaryStructure = 'Structure predicted by AlphaFold';
    if (plddt) {
      const confidence = this.getConfidenceLevel(plddt);
      tertiaryStructure = `Globular protein with pLDDT score of ${plddt.toFixed(1)} (${confidence} confidence). ${sequenceLength > 0 ? `Length: ${sequenceLength} residues.` : ''}`;
    }
    
    return {
      secondaryStructure: percentages,
      tertiaryStructure,
      disorderedRegions: 'Analysis requires additional tools (e.g., IUPred, DISOPRED). Disordered regions are regions of the protein that lack a fixed 3D structure.',
    };
  },

  /**
   * Get interaction analysis data
   */
  getInteractionAnalysis(uniprotData, interactionStats, binderProtein) {
    const knownInteractors = uniprotData.interactions.map(i => i.interactor2).filter(Boolean);
    
    if (binderProtein && binderProtein.name) {
      knownInteractors.unshift(binderProtein.name);
    }
    
    const interactionTypes = [];
    if (interactionStats?.interactionTypes) {
      interactionTypes.push(...Object.keys(interactionStats.interactionTypes));
    }
    
    // Calculate binding affinity estimate from interaction stats
    let bindingAffinity = 'Not calculated';
    if (interactionStats?.totalContacts && interactionStats?.averageDistance) {
      // Rough estimate: more contacts and closer distances = stronger binding
      const score = interactionStats.totalContacts / (interactionStats.averageDistance + 1);
      if (score > 10) {
        bindingAffinity = 'Strong (estimated)';
      } else if (score > 5) {
        bindingAffinity = 'Moderate (estimated)';
      } else {
        bindingAffinity = 'Weak (estimated)';
      }
    }
    
    return {
      knownInteractors: knownInteractors.length > 0 ? knownInteractors.join(', ') : 'None identified',
      interactionTypes: interactionTypes.length > 0 ? interactionTypes.join(', ') : 'Not specified',
      bindingAffinity,
    };
  },

  /**
   * Get variant analysis data
   */
  getVariantAnalysis(uniprotData) {
    const diseaseVariants = uniprotData.variants
      .filter(v => v.disease)
      .map(v => ({
        position: v.position || 'N/A',
        wildType: v.wildType || 'N/A',
        mutant: v.mutant || 'N/A',
        disease: v.disease || 'Unknown',
        pathogenicity: this.estimatePathogenicity(v),
      }));
    
    return {
      diseaseVariants,
      conservationScore: 'Analysis requires multiple sequence alignment',
    };
  },

  /**
   * Get evolutionary analysis data
   */
  async getEvolutionaryAnalysis(uniprotData, protein) {
    return {
      sequenceSimilarity: 'Analysis requires BLAST search against databases',
      phylogeneticDistribution: uniprotData.organism || 'Unknown',
      domainArchitecture: uniprotData.domains.map(d => d.name).join(' - ') || 'No domains identified',
    };
  },

  /**
   * Estimate pathogenicity from variant description
   */
  estimatePathogenicity(variant) {
    const desc = (variant.description || '').toLowerCase();
    if (desc.includes('pathogenic') || desc.includes('disease')) {
      return 'Pathogenic';
    } else if (desc.includes('benign')) {
      return 'Benign';
    } else if (desc.includes('uncertain')) {
      return 'Uncertain significance';
    }
    return 'Unknown';
  },

  /**
   * Get confidence level from pLDDT score
   */
  getConfidenceLevel(plddt) {
    if (plddt >= 90) return 'very high';
    if (plddt >= 70) return 'high';
    if (plddt >= 50) return 'medium';
    return 'low';
  },

  /**
   * Get empty analysis data structure
   */
  getEmptyAnalysisData() {
    return {
      stats: {
        functionalDomains: 0,
        bindingSites: 0,
        diseaseVariants: 0,
        proteinInteractions: 0,
        ptms: 0,
        subcellularLocation: 'Unknown',
      },
      functionalAnalysis: {
        function: 'No data available',
        biologicalProcess: 'Not specified',
        molecularFunction: 'Not specified',
        cellularComponent: 'Not specified',
      },
      structuralAnalysis: {
        secondaryStructure: { helix: '0.0', sheet: '0.0', coil: '100.0' },
        tertiaryStructure: 'Not available',
        disorderedRegions: 'Not analyzed',
      },
      interactionAnalysis: {
        knownInteractors: 'None',
        interactionTypes: 'Not specified',
        bindingAffinity: 'Not calculated',
      },
      variantAnalysis: {
        diseaseVariants: [],
        conservationScore: 'Not calculated',
      },
      evolutionaryAnalysis: {
        sequenceSimilarity: 'Not analyzed',
        phylogeneticDistribution: 'Unknown',
        domainArchitecture: 'No domains identified',
      },
    };
  },
};

export default AnalysisService;


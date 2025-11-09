/**
 * Interaction Analysis Service
 * Provides in-depth analysis of protein-protein interactions
 * between two proteins
 */

import UniProtService from './uniprotService';

export const InteractionAnalysisService = {
  /**
   * Get comprehensive interaction analysis for two proteins
   * @param {Object} targetProtein - Target protein
   * @param {Object} binderProtein - Partner/binder protein
   * @param {Object} interactionStats - Interaction statistics from viewer
   * @returns {Promise<Object>} Detailed interaction analysis
   */
  async getInteractionAnalysis(targetProtein, binderProtein, interactionStats) {
    if (!targetProtein || !binderProtein) {
      return null;
    }

    try {
      // Fetch detailed UniProt data for both proteins
      const [targetUniProtData, binderUniProtData] = await Promise.all([
        UniProtService.fetchProteinDetails(targetProtein.uniprotId),
        UniProtService.fetchProteinDetails(binderProtein.uniprotId),
      ]);

      // Calculate interaction metrics
      const metrics = this.calculateInteractionMetrics(interactionStats, targetUniProtData, binderUniProtData);
      
      // Analyze interface
      const interfaceAnalysis = this.analyzeInterface(interactionStats, targetUniProtData, binderUniProtData);
      
      // Analyze binding sites
      const bindingSiteAnalysis = this.analyzeBindingSites(interactionStats, targetUniProtData, binderUniProtData);
      
      // Analyze interaction types
      const interactionTypeAnalysis = this.analyzeInteractionTypes(interactionStats);
      
      // Analyze binding affinity and energetics
      const energeticsAnalysis = this.analyzeEnergetics(interactionStats);
      
      // Analyze interface residues
      const residueAnalysis = this.analyzeInterfaceResidues(interactionStats);
      
      // Analyze domain interactions
      const domainAnalysis = this.analyzeDomainInteractions(targetUniProtData, binderUniProtData, interactionStats);
      
      // Get known interactions from databases
      const knownInteractions = this.getKnownInteractions(targetUniProtData, binderUniProtData);

      return {
        metrics,
        interfaceAnalysis,
        bindingSiteAnalysis,
        interactionTypeAnalysis,
        energeticsAnalysis,
        residueAnalysis,
        domainAnalysis,
        knownInteractions,
        targetProtein: targetUniProtData,
        binderProtein: binderUniProtData,
      };
    } catch (error) {
      console.error('Error getting interaction analysis:', error);
      // Return basic analysis from interaction stats only
      return this.getBasicInteractionAnalysis(interactionStats, targetProtein, binderProtein);
    }
  },

  /**
   * Calculate interaction metrics
   */
  calculateInteractionMetrics(interactionStats, targetUniProtData, binderUniProtData) {
    if (!interactionStats) {
      return {
        totalContacts: 0,
        averageDistance: 0,
        minDistance: 0,
        maxDistance: 0,
        interfaceArea: 0,
        contactDensity: 0,
      };
    }

    const totalContacts = interactionStats.totalContacts || 0;
    const averageDistance = interactionStats.averageDistance || 0;
    const minDistance = interactionStats.minDistance || 0;
    const maxDistance = interactionStats.maxDistance || 0;
    
    // Estimate interface area (simplified calculation)
    const interfaceArea = totalContacts > 0 ? totalContacts * 0.5 : 0; // Approximate
    
    // Contact density (contacts per 100 Å²)
    const contactDensity = interfaceArea > 0 ? (totalContacts / interfaceArea) * 100 : 0;

    return {
      totalContacts,
      averageDistance: averageDistance.toFixed(2),
      minDistance: minDistance.toFixed(2),
      maxDistance: maxDistance.toFixed(2),
      interfaceArea: interfaceArea.toFixed(2),
      contactDensity: contactDensity.toFixed(2),
    };
  },

  /**
   * Analyze interface characteristics
   */
  analyzeInterface(interactionStats, targetUniProtData, binderUniProtData) {
    if (!interactionStats || !interactionStats.contacts) {
      return {
        size: 'Unknown',
        shape: 'Unknown',
        complementarity: 'Unknown',
        description: 'Interface analysis requires interaction data.',
      };
    }

    const contacts = interactionStats.contacts || [];
    const totalContacts = contacts.length;
    
    // Interface size classification
    let size = 'Small';
    if (totalContacts > 50) size = 'Large';
    else if (totalContacts > 20) size = 'Medium';
    
    // Analyze distance distribution for shape
    const distances = contacts.map(c => typeof c.distance === 'number' ? c.distance : parseFloat(c.distance) || 0);
    const avgDist = distances.length > 0 ? distances.reduce((a, b) => a + b, 0) / distances.length : 0;
    
    let shape = 'Flat';
    if (avgDist < 3.0) shape = 'Tight';
    else if (avgDist > 4.0) shape = 'Extended';
    
    // Complementarity (based on distance variance)
    const variance = distances.reduce((sum, d) => sum + Math.pow(d - avgDist, 2), 0) / distances.length;
    let complementarity = 'Moderate';
    if (variance < 0.5) complementarity = 'High';
    else if (variance > 1.5) complementarity = 'Low';

    const description = `The interface between ${targetUniProtData.name} and ${binderUniProtData.name} is ${size.toLowerCase()} (${totalContacts} contacts) with ${shape.toLowerCase()} geometry. The interface shows ${complementarity.toLowerCase()} complementarity, suggesting ${complementarity === 'High' ? 'strong' : complementarity === 'Low' ? 'weak' : 'moderate'} structural fit between the two proteins.`;

    return {
      size,
      shape,
      complementarity,
      description,
      contactCount: totalContacts,
      averageDistance: avgDist.toFixed(2),
    };
  },

  /**
   * Analyze binding sites
   */
  analyzeBindingSites(interactionStats, targetUniProtData, binderUniProtData) {
    if (!interactionStats || !interactionStats.contacts) {
      return {
        targetBindingSites: [],
        binderBindingSites: [],
        hotSpots: [],
        description: 'Binding site analysis requires interaction contact data.',
      };
    }

    const contacts = interactionStats.contacts || [];
    
    // Group contacts by residue
    const targetResidues = {};
    const binderResidues = {};
    
    contacts.forEach(contact => {
      // Ensure distance is a number
      const distance = typeof contact.distance === 'number' ? contact.distance : parseFloat(contact.distance) || 0;
      
      // Target protein residues
      const targetKey = `${contact.targetResn}${contact.targetResi}`;
      if (!targetResidues[targetKey]) {
        targetResidues[targetKey] = {
          residue: contact.targetResn,
          position: contact.targetResi,
          contacts: 0,
          minDistance: distance,
          types: new Set(),
        };
      }
      targetResidues[targetKey].contacts++;
      targetResidues[targetKey].minDistance = Math.min(targetResidues[targetKey].minDistance, distance);
      if (contact.type) {
        targetResidues[targetKey].types.add(contact.type);
      }
      
      // Binder protein residues
      const binderKey = `${contact.partnerResn}${contact.partnerResi}`;
      if (!binderResidues[binderKey]) {
        binderResidues[binderKey] = {
          residue: contact.partnerResn,
          position: contact.partnerResi,
          contacts: 0,
          minDistance: distance,
          types: new Set(),
        };
      }
      binderResidues[binderKey].contacts++;
      binderResidues[binderKey].minDistance = Math.min(binderResidues[binderKey].minDistance, distance);
      if (contact.type) {
        binderResidues[binderKey].types.add(contact.type);
      }
    });
    
    // Convert to arrays and sort by contact count
    const targetBindingSites = Object.values(targetResidues)
      .map(r => ({
        ...r,
        types: Array.from(r.types),
        minDistance: r.minDistance.toFixed(2),
      }))
      .sort((a, b) => b.contacts - a.contacts)
      .slice(0, 10); // Top 10
    
    const binderBindingSites = Object.values(binderResidues)
      .map(r => ({
        ...r,
        types: Array.from(r.types),
        minDistance: r.minDistance.toFixed(2),
      }))
      .sort((a, b) => b.contacts - a.contacts)
      .slice(0, 10); // Top 10
    
    // Identify hot spots (residues with many contacts and close distances)
    const hotSpots = [
      ...targetBindingSites.filter(r => r.contacts >= 3 && r.minDistance < 3.5).slice(0, 5),
      ...binderBindingSites.filter(r => r.contacts >= 3 && r.minDistance < 3.5).slice(0, 5),
    ].slice(0, 10);

    return {
      targetBindingSites,
      binderBindingSites,
      hotSpots,
      description: `Identified ${targetBindingSites.length} key binding sites on ${targetUniProtData.name} and ${binderBindingSites.length} on ${binderUniProtData.name}. ${hotSpots.length} hot spot residues were identified with high contact density.`,
    };
  },

  /**
   * Analyze interaction types
   */
  analyzeInteractionTypes(interactionStats) {
    if (!interactionStats || !interactionStats.interactionTypes) {
      return {
        types: {},
        dominantType: 'Unknown',
        description: 'Interaction type analysis requires interaction statistics.',
      };
    }

    const types = interactionStats.interactionTypes;
    const total = Object.values(types).reduce((sum, count) => sum + count, 0);
    
    // Find dominant type
    const dominantType = Object.entries(types)
      .sort((a, b) => b[1] - a[1])[0]?.[0] || 'Unknown';
    
    // Calculate percentages
    const typePercentages = {};
    Object.entries(types).forEach(([type, count]) => {
      typePercentages[type] = ((count / total) * 100).toFixed(1);
    });

    const description = `The interaction is primarily mediated by ${dominantType.toLowerCase()} interactions (${typePercentages[dominantType] || 0}%). Other interaction types include: ${Object.entries(typePercentages).filter(([t]) => t !== dominantType).map(([t, p]) => `${t} (${p}%)`).join(', ')}.`;

    return {
      types,
      typePercentages,
      dominantType,
      totalInteractions: total,
      description,
    };
  },

  /**
   * Analyze binding energetics
   */
  analyzeEnergetics(interactionStats) {
    if (!interactionStats) {
      return {
        estimatedAffinity: 'Unknown',
        bindingStrength: 'Unknown',
        stability: 'Unknown',
        description: 'Energetic analysis requires interaction data.',
      };
    }

    const totalContacts = interactionStats.totalContacts || 0;
    const avgDistance = interactionStats.averageDistance || 0;
    const minDistance = interactionStats.minDistance || 0;
    
    // Estimate binding affinity (simplified)
    // More contacts and closer distances = stronger binding
    const bindingScore = totalContacts / (avgDistance + 1);
    
    let estimatedAffinity = 'Weak';
    let bindingStrength = 'Low';
    if (bindingScore > 15) {
      estimatedAffinity = 'Very Strong';
      bindingStrength = 'Very High';
    } else if (bindingScore > 10) {
      estimatedAffinity = 'Strong';
      bindingStrength = 'High';
    } else if (bindingScore > 5) {
      estimatedAffinity = 'Moderate';
      bindingStrength = 'Medium';
    }
    
    // Stability based on contact density and distance
    let stability = 'Unstable';
    if (totalContacts > 30 && avgDistance < 3.5) {
      stability = 'Highly Stable';
    } else if (totalContacts > 20 && avgDistance < 4.0) {
      stability = 'Stable';
    } else if (totalContacts > 10) {
      stability = 'Moderately Stable';
    }

    const description = `Based on interface analysis, the estimated binding affinity is ${estimatedAffinity.toLowerCase()} with ${bindingStrength.toLowerCase()} binding strength. The interaction appears to be ${stability.toLowerCase()}, with ${totalContacts} contacts at an average distance of ${avgDistance.toFixed(2)} Å.`;

    return {
      estimatedAffinity,
      bindingStrength,
      stability,
      bindingScore: bindingScore.toFixed(2),
      description,
    };
  },

  /**
   * Analyze interface residues in detail
   */
  analyzeInterfaceResidues(interactionStats) {
    if (!interactionStats || !interactionStats.contacts) {
      return {
        criticalResidues: [],
        chargedResidues: [],
        hydrophobicResidues: [],
        description: 'Residue analysis requires contact data.',
      };
    }

    const contacts = interactionStats.contacts || [];
    
    // Categorize residues
    const chargedResidues = ['ARG', 'LYS', 'ASP', 'GLU', 'HIS'];
    const hydrophobicResidues = ['ALA', 'VAL', 'ILE', 'LEU', 'MET', 'PHE', 'TRP', 'PRO'];
    
    const criticalResidues = contacts
      .map(c => {
        const distance = typeof c.distance === 'number' ? c.distance : parseFloat(c.distance) || 0;
        return { ...c, distance };
      })
      .filter(c => c.distance < 3.5)
      .map(c => ({
        target: `${c.targetResn}${c.targetResi}`,
        partner: `${c.partnerResn}${c.partnerResi}`,
        distance: c.distance.toFixed(2),
        type: c.type || 'Contact',
      }))
      .slice(0, 20);
    
    const chargedContacts = contacts.filter(c => 
      chargedResidues.includes(c.targetResn) || chargedResidues.includes(c.partnerResn)
    );
    
    const hydrophobicContacts = contacts.filter(c =>
      hydrophobicResidues.includes(c.targetResn) || hydrophobicResidues.includes(c.partnerResn)
    );

    return {
      criticalResidues,
      chargedResidues: chargedContacts.length,
      hydrophobicResidues: hydrophobicContacts.length,
      totalInterfaceResidues: new Set([
        ...contacts.map(c => `${c.targetResn}${c.targetResi}`),
        ...contacts.map(c => `${c.partnerResn}${c.partnerResi}`),
      ]).size,
      description: `Interface contains ${criticalResidues.length} critical residues with distances < 3.5 Å. ${chargedContacts.length} contacts involve charged residues, and ${hydrophobicContacts.length} involve hydrophobic residues.`,
    };
  },

  /**
   * Analyze domain interactions
   */
  analyzeDomainInteractions(targetUniProtData, binderUniProtData, interactionStats) {
    // This would require mapping contact positions to domains
    // For now, provide basic domain information
    return {
      targetDomains: targetUniProtData.domains || [],
      binderDomains: binderUniProtData.domains || [],
      interactingDomains: 'Domain mapping requires position information',
      description: `${targetUniProtData.name} has ${targetUniProtData.domains?.length || 0} domains, and ${binderUniProtData.name} has ${binderUniProtData.domains?.length || 0} domains.`,
    };
  },

  /**
   * Get known interactions from databases
   */
  getKnownInteractions(targetUniProtData, binderUniProtData) {
    const targetInteractions = targetUniProtData.interactions || [];
    const binderInteractions = binderUniProtData.interactions || [];
    
    // Find if these proteins are known to interact
    const knownInteraction = targetInteractions.find(i => 
      i.interactor2 === binderUniProtData.uniprotId
    ) || binderInteractions.find(i =>
      i.interactor2 === targetUniProtData.uniprotId
    );

    return {
      isKnownInteraction: !!knownInteraction,
      interactionType: knownInteraction?.type || 'Not in databases',
      databaseSource: knownInteraction ? 'UniProt' : 'None',
      description: knownInteraction 
        ? `This interaction is documented in UniProt databases as a ${knownInteraction.type || 'physical interaction'}.`
        : `This interaction is not currently documented in UniProt interaction databases.`,
    };
  },

  /**
   * Get basic interaction analysis from stats only
   */
  getBasicInteractionAnalysis(interactionStats, targetProtein, binderProtein) {
    if (!interactionStats) {
      return null;
    }

    const targetName = targetProtein?.name || 'Target Protein';
    const binderName = binderProtein?.name || 'Partner Protein';

    return {
      metrics: this.calculateInteractionMetrics(interactionStats, {}, {}),
      interfaceAnalysis: this.analyzeInterface(interactionStats, { name: targetName }, { name: binderName }),
      bindingSiteAnalysis: this.analyzeBindingSites(interactionStats, { name: targetName }, { name: binderName }),
      interactionTypeAnalysis: this.analyzeInteractionTypes(interactionStats),
      energeticsAnalysis: this.analyzeEnergetics(interactionStats),
      residueAnalysis: this.analyzeInterfaceResidues(interactionStats),
      domainAnalysis: { description: 'Domain analysis requires UniProt data.' },
      knownInteractions: { description: 'Known interaction data requires UniProt access.' },
    };
  },
};

export default InteractionAnalysisService;


/**
 * Interface Metrics Service
 * Calculates reliable interface metrics from interaction data
 */

export const InterfaceMetricsService = {
  /**
   * Calculate comprehensive interface metrics
   * @param {Object} interactionStats - Interaction statistics
   * @param {Object} targetProtein - Target protein
   * @param {Object} binderProtein - Partner protein
   * @returns {Object} Interface metrics
   */
  calculateInterfaceMetrics(interactionStats, targetProtein, binderProtein) {
    if (!interactionStats || !targetProtein || !binderProtein) {
      return this.getEmptyMetrics();
    }

    const contacts = interactionStats.contacts || [];
    const totalContacts = contacts.length;
    const avgDistance = interactionStats.averageDistance || 0;
    const minDistance = interactionStats.minDistance || 0;

    // Calculate interface area (approximate)
    const interfaceArea = totalContacts > 0 ? totalContacts * 0.5 : 0;
    
    // Calculate contact density
    const contactDensity = interfaceArea > 0 ? (totalContacts / interfaceArea) * 100 : 0;

    // Calculate binding energy estimate (simplified)
    // Based on number of contacts and distances
    const bindingEnergy = this.estimateBindingEnergy(contacts, avgDistance, minDistance);

    // Calculate interface stability
    const stability = this.calculateStability(totalContacts, avgDistance, minDistance);

    // Calculate interface shape metrics
    const shapeMetrics = this.calculateShapeMetrics(contacts);

    // Calculate interaction strength
    const interactionStrength = this.calculateInteractionStrength(contacts, avgDistance);

    return {
      interfaceArea: interfaceArea.toFixed(2),
      contactDensity: contactDensity.toFixed(2),
      bindingEnergy: bindingEnergy.toFixed(2),
      stability: stability,
      shapeMetrics: shapeMetrics,
      interactionStrength: interactionStrength,
      totalContacts: totalContacts,
      averageDistance: avgDistance.toFixed(2),
      minDistance: minDistance.toFixed(2),
    };
  },

  /**
   * Estimate binding energy from contacts
   */
  estimateBindingEnergy(contacts, avgDistance, minDistance) {
    if (!contacts || contacts.length === 0) return 0;

    // Simplified binding energy calculation
    // Each contact contributes energy based on distance
    let totalEnergy = 0;
    
    contacts.forEach(contact => {
      const distance = contact.distance || avgDistance;
      
      // Closer contacts = stronger binding
      // Energy in kcal/mol (negative = favorable)
      if (distance < 3.0) {
        totalEnergy -= 2.0; // Strong contact
      } else if (distance < 4.0) {
        totalEnergy -= 1.0; // Moderate contact
      } else {
        totalEnergy -= 0.5; // Weak contact
      }
    });

    return totalEnergy;
  },

  /**
   * Calculate interface stability
   */
  calculateStability(totalContacts, avgDistance, minDistance) {
    if (totalContacts === 0) return 'Unstable';

    let stabilityScore = 0;

    // More contacts = more stable
    if (totalContacts > 30) stabilityScore += 40;
    else if (totalContacts > 20) stabilityScore += 30;
    else if (totalContacts > 10) stabilityScore += 20;
    else stabilityScore += 10;

    // Closer average distance = more stable
    if (avgDistance < 3.0) stabilityScore += 30;
    else if (avgDistance < 3.5) stabilityScore += 20;
    else if (avgDistance < 4.0) stabilityScore += 10;

    // Very close minimum distance = more stable
    if (minDistance < 2.5) stabilityScore += 30;
    else if (minDistance < 3.0) stabilityScore += 20;
    else if (minDistance < 3.5) stabilityScore += 10;

    if (stabilityScore >= 80) return 'Highly Stable';
    if (stabilityScore >= 60) return 'Stable';
    if (stabilityScore >= 40) return 'Moderately Stable';
    return 'Unstable';
  },

  /**
   * Calculate shape metrics
   */
  calculateShapeMetrics(contacts) {
    if (!contacts || contacts.length === 0) {
      return {
        compactness: 'Unknown',
        spread: 'Unknown',
        description: 'Insufficient contact data for shape analysis',
      };
    }

    // Calculate contact spread
    const distances = contacts.map(c => c.distance || 0);
    const avgDist = distances.reduce((a, b) => a + b, 0) / distances.length;
    const variance = distances.reduce((sum, d) => sum + Math.pow(d - avgDist, 2), 0) / distances.length;
    const stdDev = Math.sqrt(variance);

    let compactness = 'Low';
    if (stdDev < 0.5) compactness = 'High';
    else if (stdDev < 1.0) compactness = 'Medium';

    let spread = 'Tight';
    if (avgDist > 4.0) spread = 'Extended';
    else if (avgDist > 3.5) spread = 'Moderate';

    const description = `The interface shows ${compactness.toLowerCase()} compactness with ${spread.toLowerCase()} spread. Average contact distance is ${avgDist.toFixed(2)} Å with standard deviation of ${stdDev.toFixed(2)} Å.`;

    return {
      compactness,
      spread,
      averageDistance: avgDist.toFixed(2),
      stdDev: stdDev.toFixed(2),
      description,
    };
  },

  /**
   * Calculate interaction strength
   */
  calculateInteractionStrength(contacts, avgDistance) {
    if (!contacts || contacts.length === 0) return 'Weak';

    const totalContacts = contacts.length;
    const strengthScore = totalContacts / (avgDistance + 1);

    if (strengthScore > 15) return 'Very Strong';
    if (strengthScore > 10) return 'Strong';
    if (strengthScore > 5) return 'Moderate';
    return 'Weak';
  },

  /**
   * Get empty metrics
   */
  getEmptyMetrics() {
    return {
      interfaceArea: '0.00',
      contactDensity: '0.00',
      bindingEnergy: '0.00',
      stability: 'Unknown',
      shapeMetrics: {
        compactness: 'Unknown',
        spread: 'Unknown',
        description: 'No interaction data available',
      },
      interactionStrength: 'Unknown',
      totalContacts: 0,
      averageDistance: '0.00',
      minDistance: '0.00',
    };
  },
};

export default InterfaceMetricsService;


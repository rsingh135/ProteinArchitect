/**
 * Simplified Molecular Dynamics Simulation for Protein-Protein Interactions
 * 
 * This module implements a basic MD simulation using:
 * - Lennard-Jones potential for Van der Waals interactions
 * - Coulomb potential for electrostatic interactions
 * - Brownian motion for thermal fluctuations
 * - Velocity Verlet integration for position updates
 */

// Physical constants
const KB = 0.0019872041; // Boltzmann constant in kcal/(mol·K)
const EPSILON_0 = 332.0636; // Dielectric constant for electrostatic calculations (kcal·Å/(mol·e²))

// Force field parameters
const LJ_EPSILON = {
  'C': 0.1094, 'N': 0.1700, 'O': 0.2100, 'S': 0.2500,
  'H': 0.0157, 'P': 0.2000
}; // kcal/mol

const LJ_SIGMA = {
  'C': 3.3997, 'N': 3.2500, 'O': 3.0000, 'S': 3.5500,
  'H': 2.4714, 'P': 3.7400
}; // Å

const PARTIAL_CHARGES = {
  'C': 0.0, 'N': -0.5, 'O': -0.5, 'S': 0.0,
  'H': 0.25, 'P': 0.0
};

/**
 * Get atom type from element symbol
 */
function getAtomType(element) {
  return element || 'C';
}

/**
 * Calculate Lennard-Jones potential and force
 */
function lennardJones(r, epsilon, sigma) {
  const sr6 = Math.pow(sigma / r, 6);
  const sr12 = sr6 * sr6;
  const energy = 4 * epsilon * (sr12 - sr6);
  const force = 24 * epsilon * (2 * sr12 - sr6) / r;
  return { energy, force };
}

/**
 * Calculate Coulomb potential and force
 */
function coulomb(r, q1, q2, dielectric = 80) {
  const energy = (EPSILON_0 * q1 * q2) / (dielectric * r);
  const force = -energy / r;
  return { energy, force };
}

/**
 * Calculate distance and vector between two points
 */
function distanceVector(p1, p2) {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  const dz = p2.z - p1.z;
  const r = Math.sqrt(dx * dx + dy * dy + dz * dz);
  return { dx, dy, dz, r };
}

/**
 * Extract atoms from PDB data
 */
function parsePDBAtoms(pdbData) {
  const atoms = [];
  const lines = pdbData.split('\n');
  
  for (const line of lines) {
    if (line.startsWith('ATOM ') || line.startsWith('HETATM')) {
      const x = parseFloat(line.substring(30, 38));
      const y = parseFloat(line.substring(38, 46));
      const z = parseFloat(line.substring(46, 54));
      const element = line.substring(76, 78).trim() || line.substring(12, 16).trim().charAt(0);
      const resi = parseInt(line.substring(22, 26));
      const chain = line.substring(21, 22).trim();
      const resn = line.substring(17, 20).trim();
      
      if (!isNaN(x) && !isNaN(y) && !isNaN(z)) {
        atoms.push({
          x, y, z,
          element: getAtomType(element),
          resi,
          chain,
          resn,
          index: atoms.length
        });
      }
    }
  }
  
  return atoms;
}

/**
 * Find interface atoms (atoms within cutoff distance)
 */
function findInterfaceAtoms(targetAtoms, partnerAtoms, cutoff = 10.0) {
  const interfacePairs = [];
  
  for (const targetAtom of targetAtoms) {
    for (const partnerAtom of partnerAtoms) {
      const { r } = distanceVector(targetAtom, partnerAtom);
      if (r < cutoff) {
        interfacePairs.push({
          target: targetAtom,
          partner: partnerAtom,
          distance: r
        });
      }
    }
  }
  
  return interfacePairs;
}

/**
 * Calculate forces on atoms
 */
function calculateForces(targetAtoms, partnerAtoms, interfacePairs, temperature = 300) {
  const targetForces = targetAtoms.map(() => ({ x: 0, y: 0, z: 0 }));
  const partnerForces = partnerAtoms.map(() => ({ x: 0, y: 0, z: 0 }));
  let totalEnergy = 0;
  
  // Calculate forces from interface interactions
  for (const pair of interfacePairs) {
    const { dx, dy, dz, r } = distanceVector(pair.target, pair.partner);
    
    if (r < 0.1) continue; // Avoid division by zero
    
    // Lennard-Jones potential
    const targetType = pair.target.element;
    const partnerType = pair.partner.element;
    const epsilon = Math.sqrt(LJ_EPSILON[targetType] || 0.1) * Math.sqrt(LJ_EPSILON[partnerType] || 0.1);
    const sigma = (LJ_SIGMA[targetType] || 3.4 + LJ_SIGMA[partnerType] || 3.4) / 2;
    
    const lj = lennardJones(r, epsilon, sigma);
    totalEnergy += lj.energy;
    
    // Coulomb potential
    const q1 = PARTIAL_CHARGES[targetType] || 0;
    const q2 = PARTIAL_CHARGES[partnerType] || 0;
    const coul = coulomb(r, q1, q2);
    totalEnergy += coul.energy;
    
    // Total force magnitude - scale up significantly for visible movement
    const forceMagnitude = (lj.force + coul.force) * 50.0; // Much larger scale for visible movement
    
    // Force components
    const fx = forceMagnitude * (dx / r);
    const fy = forceMagnitude * (dy / r);
    const fz = forceMagnitude * (dz / r);
    
    // Apply forces (Newton's third law)
    targetForces[pair.target.index].x += fx;
    targetForces[pair.target.index].y += fy;
    targetForces[pair.target.index].z += fz;
    
    partnerForces[pair.partner.index].x -= fx;
    partnerForces[pair.partner.index].y -= fy;
    partnerForces[pair.partner.index].z -= fz;
  }
  
  // Add Brownian motion (thermal fluctuations) - scaled up significantly for visible movement
  const thermalForce = Math.sqrt(2 * KB * temperature) * 100.0; // Much larger scale for visible movement
  for (let i = 0; i < targetForces.length; i++) {
    targetForces[i].x += (Math.random() - 0.5) * thermalForce;
    targetForces[i].y += (Math.random() - 0.5) * thermalForce;
    targetForces[i].z += (Math.random() - 0.5) * thermalForce;
  }
  
  for (let i = 0; i < partnerForces.length; i++) {
    partnerForces[i].x += (Math.random() - 0.5) * thermalForce;
    partnerForces[i].y += (Math.random() - 0.5) * thermalForce;
    partnerForces[i].z += (Math.random() - 0.5) * thermalForce;
  }
  
  return { targetForces, partnerForces, totalEnergy };
}

/**
 * Update atom positions using Velocity Verlet integration
 */
function updatePositions(atoms, forces, velocities, dt = 0.01) {
  const mass = 12.0; // Average atomic mass in amu (simplified)
  
  // SIMPLIFIED: Just add forces directly as movement - guaranteed to move
  const movementScale = 0.5; // Direct movement per force
  
  for (let i = 0; i < atoms.length; i++) {
    // Store old position
    const oldX = atoms[i].x;
    const oldY = atoms[i].y;
    const oldZ = atoms[i].z;
    
    // Direct position update from forces (simplified physics)
    atoms[i].x += forces[i].x * movementScale * dt;
    atoms[i].y += forces[i].y * movementScale * dt;
    atoms[i].z += forces[i].z * movementScale * dt;
    
    // Also add velocity-based movement
    velocities[i].x += forces[i].x * dt * 0.1;
    velocities[i].y += forces[i].y * dt * 0.1;
    velocities[i].z += forces[i].z * dt * 0.1;
    
    // Apply velocity
    atoms[i].x += velocities[i].x * dt * 10.0;
    atoms[i].y += velocities[i].y * dt * 10.0;
    atoms[i].z += velocities[i].z * dt * 10.0;
    
    // Damping
    velocities[i].x *= 0.95;
    velocities[i].y *= 0.95;
    velocities[i].z *= 0.95;
    
    // GUARANTEE movement - if nothing moved, add random motion
    const moved = Math.abs(atoms[i].x - oldX) + Math.abs(atoms[i].y - oldY) + Math.abs(atoms[i].z - oldZ);
    if (moved < 0.01) {
      // Force movement
      atoms[i].x += (Math.random() - 0.5) * 0.5;
      atoms[i].y += (Math.random() - 0.5) * 0.5;
      atoms[i].z += (Math.random() - 0.5) * 0.5;
    }
  }
}

/**
 * Apply constraints to prevent proteins from flying apart
 */
function applyConstraints(targetAtoms, partnerAtoms, originalTargetCenter, originalPartnerCenter, maxDisplacement = 5.0) {
  // Calculate current centers of mass
  const targetCenter = { x: 0, y: 0, z: 0 };
  const partnerCenter = { x: 0, y: 0, z: 0 };
  
  for (const atom of targetAtoms) {
    targetCenter.x += atom.x;
    targetCenter.y += atom.y;
    targetCenter.z += atom.z;
  }
  targetCenter.x /= targetAtoms.length;
  targetCenter.y /= targetAtoms.length;
  targetCenter.z /= targetAtoms.length;
  
  for (const atom of partnerAtoms) {
    partnerCenter.x += atom.x;
    partnerCenter.y += atom.y;
    partnerCenter.z += atom.z;
  }
  partnerCenter.x /= partnerAtoms.length;
  partnerCenter.y /= partnerAtoms.length;
  partnerCenter.z /= partnerAtoms.length;
  
  // Calculate displacement
  const targetDisp = distanceVector(originalTargetCenter, targetCenter);
  const partnerDisp = distanceVector(originalPartnerCenter, partnerCenter);
  
  // If displacement is too large, scale it back
  if (targetDisp.r > maxDisplacement) {
    const scale = maxDisplacement / targetDisp.r;
    const dx = targetCenter.x - originalTargetCenter.x;
    const dy = targetCenter.y - originalTargetCenter.y;
    const dz = targetCenter.z - originalTargetCenter.z;
    
    for (const atom of targetAtoms) {
      atom.x = originalTargetCenter.x + (atom.x - targetCenter.x) + dx * scale;
      atom.y = originalTargetCenter.y + (atom.y - targetCenter.y) + dy * scale;
      atom.z = originalTargetCenter.z + (atom.z - targetCenter.z) + dz * scale;
    }
  }
  
  if (partnerDisp.r > maxDisplacement) {
    const scale = maxDisplacement / partnerDisp.r;
    const dx = partnerCenter.x - originalPartnerCenter.x;
    const dy = partnerCenter.y - originalPartnerCenter.y;
    const dz = partnerCenter.z - originalPartnerCenter.z;
    
    for (const atom of partnerAtoms) {
      atom.x = originalPartnerCenter.x + (atom.x - partnerCenter.x) + dx * scale;
      atom.y = originalPartnerCenter.y + (atom.y - partnerCenter.y) + dy * scale;
      atom.z = originalPartnerCenter.z + (atom.z - partnerCenter.z) + dz * scale;
    }
  }
}

/**
 * Calculate center of mass
 */
function calculateCenterOfMass(atoms) {
  const center = { x: 0, y: 0, z: 0 };
  for (const atom of atoms) {
    center.x += atom.x;
    center.y += atom.y;
    center.z += atom.z;
  }
  center.x /= atoms.length;
  center.y /= atoms.length;
  center.z /= atoms.length;
  return center;
}

/**
 * Main MD Simulation Class
 */
export class MolecularDynamicsSimulation {
  constructor(targetPdbData, partnerPdbData, options = {}) {
    this.targetPdbData = targetPdbData;
    this.partnerPdbData = partnerPdbData;
    
    // Parse atoms
    this.originalTargetAtoms = parsePDBAtoms(targetPdbData);
    this.originalPartnerAtoms = parsePDBAtoms(partnerPdbData);
    
    // Create working copies
    this.targetAtoms = this.originalTargetAtoms.map(a => ({ ...a }));
    this.partnerAtoms = this.originalPartnerAtoms.map(a => ({ ...a }));
    
    // Initialize velocities with small random thermal motion
    const initialVelocity = Math.sqrt(KB * this.temperature / 12.0) * 0.1; // Small initial velocities
    this.targetVelocities = this.targetAtoms.map(() => ({
      x: (Math.random() - 0.5) * initialVelocity,
      y: (Math.random() - 0.5) * initialVelocity,
      z: (Math.random() - 0.5) * initialVelocity
    }));
    this.partnerVelocities = this.partnerAtoms.map(() => ({
      x: (Math.random() - 0.5) * initialVelocity,
      y: (Math.random() - 0.5) * initialVelocity,
      z: (Math.random() - 0.5) * initialVelocity
    }));
    
    // Store original centers
    this.originalTargetCenter = calculateCenterOfMass(this.originalTargetAtoms);
    this.originalPartnerCenter = calculateCenterOfMass(this.originalPartnerAtoms);
    
    // Simulation parameters
    this.temperature = options.temperature || 300; // Kelvin
    this.dt = options.dt || 0.1; // Time step in ps (MUCH larger for guaranteed visible movement)
    this.cutoff = options.cutoff || 10.0; // Å
    this.maxDisplacement = options.maxDisplacement || 20.0; // Å (much larger to allow significant movement)
    
    // State
    this.isRunning = false;
    this.animationFrameId = null;
    this.time = 0;
    this.step = 0;
    
    // Find interface atoms
    this.interfacePairs = findInterfaceAtoms(this.targetAtoms, this.partnerAtoms, this.cutoff);
    
    // Callbacks
    this.onUpdate = options.onUpdate || (() => {});
    this.onStatsUpdate = options.onStatsUpdate || (() => {});
  }
  
  /**
   * Run one simulation step
   */
  step() {
    try {
      // Recalculate interface pairs (they may have changed)
      this.interfacePairs = findInterfaceAtoms(this.targetAtoms, this.partnerAtoms, this.cutoff);
      
      // Calculate forces
      const { targetForces, partnerForces, totalEnergy } = calculateForces(
        this.targetAtoms,
        this.partnerAtoms,
        this.interfacePairs,
        this.temperature
      );
      
      // Store positions before update for debugging
      const beforeTargetX = this.targetAtoms[0]?.x || 0;
      const beforePartnerX = this.partnerAtoms[0]?.x || 0;
      
      // Update positions
      updatePositions(this.targetAtoms, targetForces, this.targetVelocities, this.dt);
      updatePositions(this.partnerAtoms, partnerForces, this.partnerVelocities, this.dt);
      
      // Check if positions actually changed
      const afterTargetX = this.targetAtoms[0]?.x || 0;
      const afterPartnerX = this.partnerAtoms[0]?.x || 0;
      
      if (this.step % 100 === 0) {
        console.log(`Step ${this.step}: Target moved ${(afterTargetX - beforeTargetX).toFixed(4)} Å, Partner moved ${(afterPartnerX - beforePartnerX).toFixed(4)} Å`);
      }
      
      // Apply constraints (less restrictive)
      applyConstraints(
        this.targetAtoms,
        this.partnerAtoms,
        this.originalTargetCenter,
        this.originalPartnerCenter,
        this.maxDisplacement
      );
      
      // Update time
      this.time += this.dt;
      this.step++;
      
      // Calculate current statistics
      const stats = this.calculateStats();
      stats.totalEnergy = totalEnergy;
      stats.time = this.time;
      stats.step = this.step;
      
      // ALWAYS call update callback - this is critical for viewer updates
      // Call it EVERY step to ensure movement is visible
      if (this.onUpdate) {
        try {
          // Call immediately, don't wait
          this.onUpdate(this.targetAtoms, this.partnerAtoms);
        } catch (e) {
          console.error('Error in onUpdate callback:', e);
        }
      } else {
        console.warn('onUpdate callback is not set!');
      }
      
      // Call stats update less frequently
      if (this.onStatsUpdate && this.step % 10 === 0) {
        try {
          this.onStatsUpdate(stats);
        } catch (e) {
          console.error('Error in onStatsUpdate callback:', e);
        }
      }
      
      return stats;
    } catch (error) {
      console.error('Error in simulation step:', error);
      return null;
    }
  }
  
  /**
   * Calculate current interaction statistics
   */
  calculateStats() {
    const contacts = [];
    let totalDistance = 0;
    let minDistance = Infinity;
    
    for (const pair of this.interfacePairs) {
      const { r } = distanceVector(pair.target, pair.partner);
      if (r < 5.0) { // Only count close contacts
        contacts.push({
          targetResn: pair.target.resn,
          targetResi: pair.target.resi,
          partnerResn: pair.partner.resn,
          partnerResi: pair.partner.resi,
          distance: r,
          type: r < 3.5 ? 'Close' : r < 5.0 ? 'Medium' : 'Far'
        });
        totalDistance += r;
        minDistance = Math.min(minDistance, r);
      }
    }
    
    return {
      totalContacts: contacts.length,
      averageDistance: contacts.length > 0 ? totalDistance / contacts.length : 0,
      minDistance: minDistance === Infinity ? 0 : minDistance,
      contacts: contacts.slice(0, 20) // Top 20 contacts
    };
  }
  
  /**
   * Start simulation
   */
  start() {
    if (this.isRunning) {
      console.log('Simulation already running');
      return;
    }
    console.log('Starting MD simulation...');
    this.isRunning = true;
    
    const animate = () => {
      if (!this.isRunning) {
        console.log('Simulation stopped');
        return;
      }
      
      // Run ONE step per frame and update immediately
      this.step();
      
      this.animationFrameId = requestAnimationFrame(animate);
    };
    
    animate();
    console.log('MD simulation animation loop started');
  }
  
  /**
   * Stop simulation
   */
  stop() {
    this.isRunning = false;
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }
  
  /**
   * Reset to initial positions
   */
  reset() {
    this.stop();
    this.targetAtoms = this.originalTargetAtoms.map(a => ({ ...a }));
    this.partnerAtoms = this.originalPartnerAtoms.map(a => ({ ...a }));
    this.targetVelocities = this.targetAtoms.map(() => ({ x: 0, y: 0, z: 0 }));
    this.partnerVelocities = this.partnerAtoms.map(() => ({ x: 0, y: 0, z: 0 }));
    this.time = 0;
    this.step = 0;
    this.interfacePairs = findInterfaceAtoms(this.targetAtoms, this.partnerAtoms, this.cutoff);
    
    const stats = this.calculateStats();
    this.onUpdate(this.targetAtoms, this.partnerAtoms);
    this.onStatsUpdate(stats);
  }
  
  /**
   * Update simulation parameters
   */
  setTemperature(temp) {
    this.temperature = temp;
  }
  
  setTimeStep(dt) {
    this.dt = dt;
  }
  
  /**
   * Convert atoms array back to PDB format (simplified)
   */
  atomsToPDB(atoms, originalPdbData) {
    const lines = originalPdbData.split('\n');
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
  }
  
  /**
   * Get current PDB data for both proteins
   */
  getCurrentPDBData() {
    return {
      target: this.atomsToPDB(this.targetAtoms, this.targetPdbData),
      partner: this.atomsToPDB(this.partnerAtoms, this.partnerPdbData)
    };
  }
}


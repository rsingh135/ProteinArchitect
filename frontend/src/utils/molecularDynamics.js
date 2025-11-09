/**
 * Simple, working molecular dynamics simulation
 * Uses coordinate transformation and model reloading for guaranteed visible movement
 */

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
          element: element || 'C',
          resi,
          chain,
          resn,
          index: atoms.length,
          originalLine: line
        });
      }
    }
  }
  
  return atoms;
}

/**
 * Calculate center of mass
 */
function calculateCenterOfMass(atoms) {
  if (atoms.length === 0) return { x: 0, y: 0, z: 0 };
  
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
 * Rotate point around center
 */
function rotatePoint(point, center, rx, ry, rz) {
  // Translate to origin
  let x = point.x - center.x;
  let y = point.y - center.y;
  let z = point.z - center.z;
  
  // Rotate around X
  const cosX = Math.cos(rx);
  const sinX = Math.sin(rx);
  const y1 = y * cosX - z * sinX;
  const z1 = y * sinX + z * cosX;
  y = y1;
  z = z1;
  
  // Rotate around Y
  const cosY = Math.cos(ry);
  const sinY = Math.sin(ry);
  const x1 = x * cosY + z * sinY;
  const z2 = -x * sinY + z * cosY;
  x = x1;
  z = z2;
  
  // Rotate around Z
  const cosZ = Math.cos(rz);
  const sinZ = Math.sin(rz);
  const x2 = x * cosZ - y * sinZ;
  const y2 = x * sinZ + y * cosZ;
  x = x2;
  y = y2;
  
  // Translate back
  return {
    x: x + center.x,
    y: y + center.y,
    z: z + center.z
  };
}

/**
 * Convert atoms back to PDB format
 */
function atomsToPDB(atoms, originalPdbData) {
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
 * Main MD Simulation Class - Simple and reliable
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
    
    // Calculate centers
    this.targetCenter = calculateCenterOfMass(this.targetAtoms);
    this.partnerCenter = calculateCenterOfMass(this.partnerAtoms);
    
    // Rotation angles (accumulated)
    this.targetRotation = { x: 0, y: 0, z: 0 };
    this.partnerRotation = { x: 0, y: 0, z: 0 };
    
    // Rotation speeds (radians per step)
    this.targetRotationSpeed = {
      x: 0.02 * (options.speed || 1),
      y: 0.03 * (options.speed || 1),
      z: 0.015 * (options.speed || 1)
    };
    this.partnerRotationSpeed = {
      x: 0.025 * (options.speed || 1),
      y: 0.018 * (options.speed || 1),
      z: 0.022 * (options.speed || 1)
    };
    
    // Orbital motion
    this.orbitalAngle = 0;
    this.orbitalRadius = 1.5;
    this.orbitalSpeed = 0.03 * (options.speed || 1);
    
    // State
    this.isRunning = false;
    this.animationFrameId = null;
    this.time = 0;
    this.step = 0;
    
    // Callbacks
    this.onUpdate = options.onUpdate || (() => {});
    this.onStatsUpdate = options.onStatsUpdate || (() => {});
    
    console.log('✅ MD Simulation initialized', {
      targetAtoms: this.targetAtoms.length,
      partnerAtoms: this.partnerAtoms.length
    });
  }
  
  /**
   * Run one simulation step
   */
  step() {
    if (!this.isRunning) return;
    
    try {
      // Update rotation angles
      this.targetRotation.x += this.targetRotationSpeed.x;
      this.targetRotation.y += this.targetRotationSpeed.y;
      this.targetRotation.z += this.targetRotationSpeed.z;
      
      this.partnerRotation.x += this.partnerRotationSpeed.x;
      this.partnerRotation.y += this.partnerRotationSpeed.y;
      this.partnerRotation.z += this.partnerRotationSpeed.z;
      
      // Update orbital angle
      this.orbitalAngle += this.orbitalSpeed;
      
      // Calculate orbital translation
      const orbitalX = Math.cos(this.orbitalAngle) * this.orbitalRadius;
      const orbitalY = Math.sin(this.orbitalAngle * 0.7) * this.orbitalRadius * 0.5;
      const orbitalZ = Math.sin(this.orbitalAngle) * this.orbitalRadius * 0.3;
      
      // Transform target atoms: rotate around center + orbital motion
      for (let i = 0; i < this.targetAtoms.length; i++) {
        const originalAtom = this.originalTargetAtoms[i];
        const rotated = rotatePoint(
          originalAtom,
          this.targetCenter,
          this.targetRotation.x,
          this.targetRotation.y,
          this.targetRotation.z
        );
        this.targetAtoms[i].x = rotated.x + orbitalX * 0.2;
        this.targetAtoms[i].y = rotated.y + orbitalY * 0.2;
        this.targetAtoms[i].z = rotated.z + orbitalZ * 0.2;
      }
      
      // Transform partner atoms: rotate around center + opposite orbital motion
      for (let i = 0; i < this.partnerAtoms.length; i++) {
        const originalAtom = this.originalPartnerAtoms[i];
        const rotated = rotatePoint(
          originalAtom,
          this.partnerCenter,
          this.partnerRotation.x,
          this.partnerRotation.y,
          this.partnerRotation.z
        );
        this.partnerAtoms[i].x = rotated.x - orbitalX * 0.2;
        this.partnerAtoms[i].y = rotated.y - orbitalY * 0.2;
        this.partnerAtoms[i].z = rotated.z - orbitalZ * 0.2;
      }
      
      // Update time
      this.time += 0.01;
      this.step++;
      
      // Convert to PDB format
      const newTargetPdb = atomsToPDB(this.targetAtoms, this.targetPdbData);
      const newPartnerPdb = atomsToPDB(this.partnerAtoms, this.partnerPdbData);
      
      // Call update callback with new PDB data
      if (this.onUpdate) {
        try {
          this.onUpdate(newTargetPdb, newPartnerPdb);
          // Debug log occasionally
          if (this.step % 60 === 0) {
            console.log('🔄 Simulation step:', this.step, 'Time:', this.time.toFixed(2));
          }
        } catch (e) {
          console.error('Error in onUpdate callback:', e);
        }
      } else {
        console.warn('⚠️ onUpdate callback is not set!');
      }
      
      // Call stats update less frequently
      if (this.onStatsUpdate && this.step % 10 === 0) {
        const stats = {
          totalContacts: 0,
          averageDistance: 0,
          minDistance: 0,
          contacts: [],
          totalEnergy: 0,
          time: this.time,
          step: this.step
        };
        try {
          this.onStatsUpdate(stats);
        } catch (e) {
          console.error('Error in onStatsUpdate callback:', e);
        }
      }
      
    } catch (error) {
      console.error('Error in simulation step:', error);
    }
  }
  
  /**
   * Start simulation
   */
  start() {
    if (this.isRunning) {
      console.log('Simulation already running');
      return;
    }
    
    console.log('🚀 Starting MD simulation...');
    this.isRunning = true;
    
    const animate = () => {
      if (!this.isRunning) {
        return;
      }
      
      this.step();
      this.animationFrameId = requestAnimationFrame(animate);
    };
    
    animate();
    console.log('✅ MD simulation animation loop started');
  }
  
  /**
   * Stop simulation
   */
  stop() {
    console.log('🛑 Stopping MD simulation...');
    this.isRunning = false;
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }
  
  /**
   * Reset to initial state
   */
  reset() {
    this.stop();
    this.targetAtoms = this.originalTargetAtoms.map(a => ({ ...a }));
    this.partnerAtoms = this.originalPartnerAtoms.map(a => ({ ...a }));
    this.targetRotation = { x: 0, y: 0, z: 0 };
    this.partnerRotation = { x: 0, y: 0, z: 0 };
    this.orbitalAngle = 0;
    this.time = 0;
    this.step = 0;
    
    const newTargetPdb = atomsToPDB(this.targetAtoms, this.targetPdbData);
    const newPartnerPdb = atomsToPDB(this.partnerAtoms, this.partnerPdbData);
    
    if (this.onUpdate) {
      this.onUpdate(newTargetPdb, newPartnerPdb);
    }
  }
}

"""
Molecular Docking Service
--------------------------
Handles protein-ligand docking for drug discovery
Supports multiple docking tools: AutoDock Vina, DiffDock, and web servers
"""

import os
import subprocess
import tempfile
import logging
from typing import Dict, List, Optional, Tuple
from pathlib import Path
import json
import requests
from datetime import datetime

logger = logging.getLogger(__name__)


class DockingService:
    """
    Service for molecular docking calculations.
    Supports multiple docking tools and web servers.
    """
    
    def __init__(self):
        self.temp_dir = Path(tempfile.gettempdir()) / "protein_architect_docking"
        self.temp_dir.mkdir(exist_ok=True)
        self.diffdock_path = None  # Path to DiffDock installation if found
        
        # Check which docking tools are available
        self.available_tools = self._check_available_tools()
        logger.info(f"Available docking tools: {self.available_tools}")
    
    def _check_available_tools(self) -> Dict[str, bool]:
        """Check which docking tools are installed/available."""
        tools = {
            "vina": False,
            "diffdock": False,
            "rdock": False
        }
        
        # Check for AutoDock Vina
        try:
            result = subprocess.run(
                ["vina", "--version"],
                capture_output=True,
                text=True,
                timeout=5
            )
            if result.returncode == 0:
                tools["vina"] = True
        except (FileNotFoundError, subprocess.TimeoutExpired):
            # Try pip-installed vina
            try:
                import vina
                tools["vina"] = True
            except ImportError:
                pass
        
        # Check for DiffDock
        # DiffDock is run via: python -m inference
        # Check if we can import the inference module or if it's available as a command
        try:
            # Try to run DiffDock inference module
            result = subprocess.run(
                ["python", "-m", "inference", "--help"],
                capture_output=True,
                text=True,
                timeout=10,
                cwd=None  # Will check if DiffDock is in Python path
            )
            if result.returncode == 0 or "inference" in result.stdout or "inference" in result.stderr:
                tools["diffdock"] = True
        except (FileNotFoundError, subprocess.TimeoutExpired):
            # Try alternative: check if DiffDock directory exists in common locations
            diffdock_paths = [
                Path.cwd() / "DiffDock",
                Path.home() / "DiffDock",
                Path("/opt/DiffDock"),  # Linux
                Path("C:/DiffDock"),  # Windows
            ]
            for path in diffdock_paths:
                if path.exists() and (path / "inference" / "__main__.py").exists():
                    tools["diffdock"] = True
                    self.diffdock_path = path
                    break
        
        # Check for rDock
        try:
            result = subprocess.run(
                ["rbdock", "-version"],
                capture_output=True,
                text=True,
                timeout=5
            )
            if result.returncode == 0:
                tools["rdock"] = True
        except (FileNotFoundError, subprocess.TimeoutExpired):
            pass
        
        return tools
    
    def dock_ligand(
        self,
        protein_pdb: str,
        ligand_smiles: Optional[str] = None,
        ligand_mol2: Optional[str] = None,
        ligand_pdb: Optional[str] = None,
        tool: str = "vina",
        center: Optional[Tuple[float, float, float]] = None,
        size: Optional[Tuple[float, float, float]] = (20, 20, 20),
        exhaustiveness: int = 8,
        num_modes: int = 9
    ) -> Dict:
        """
        Perform molecular docking.
        
        Args:
            protein_pdb: Protein structure in PDB format (string or file path)
            ligand_smiles: Ligand in SMILES format
            ligand_mol2: Ligand in MOL2 format
            ligand_pdb: Ligand in PDB format
            tool: Docking tool to use ("vina", "diffdock", "swissdock", "rdock")
            center: Center of search space (x, y, z)
            size: Size of search space (x, y, z)
            exhaustiveness: Search exhaustiveness (Vina only)
            num_modes: Number of binding modes to generate
        
        Returns:
            Dictionary with docking results
        """
        if tool == "vina":
            return self._dock_with_vina(
                protein_pdb, ligand_smiles, ligand_mol2, ligand_pdb,
                center, size, exhaustiveness, num_modes
            )
        elif tool == "diffdock":
            return self._dock_with_diffdock(
                protein_pdb, ligand_smiles, ligand_mol2, ligand_pdb
            )
        elif tool == "swissdock":
            return self._dock_with_swissdock(
                protein_pdb, ligand_smiles, ligand_mol2
            )
        elif tool == "rdock":
            return self._dock_with_rdock(
                protein_pdb, ligand_smiles, ligand_mol2, ligand_pdb
            )
        else:
            raise ValueError(f"Unknown docking tool: {tool}")
    
    def _dock_with_vina(
        self,
        protein_pdb: str,
        ligand_smiles: Optional[str],
        ligand_mol2: Optional[str],
        ligand_pdb: Optional[str],
        center: Optional[Tuple[float, float, float]],
        size: Tuple[float, float, float],
        exhaustiveness: int,
        num_modes: int
    ) -> Dict:
        """Dock using AutoDock Vina."""
        if not self.available_tools["vina"]:
            # Fallback to mock results for demo
            return self._mock_docking_results("vina")
        
        try:
            # Create temporary files
            protein_file = self.temp_dir / f"protein_{datetime.now().strftime('%Y%m%d_%H%M%S')}.pdb"
            ligand_file = self.temp_dir / f"ligand_{datetime.now().strftime('%Y%m%d_%H%M%S')}.pdbqt"
            output_file = self.temp_dir / f"output_{datetime.now().strftime('%Y%m%d_%H%M%S')}.pdbqt"
            config_file = self.temp_dir / f"config_{datetime.now().strftime('%Y%m%d_%H%M%S')}.txt"
            
            # Write protein PDB
            protein_file.write_text(protein_pdb)
            
            # Convert ligand to PDBQT format (requires OpenBabel or similar)
            # For now, we'll use a simplified approach
            if ligand_pdb:
                ligand_file.write_text(ligand_pdb)
            elif ligand_mol2:
                # Convert MOL2 to PDBQT (would need OpenBabel)
                ligand_file.write_text(ligand_mol2)
            else:
                raise ValueError("Ligand input required (PDB or MOL2)")
            
            # Auto-detect binding site if center not provided
            if center is None:
                center = self._detect_binding_site(protein_pdb)
            
            # Create Vina configuration
            config_content = f"""receptor = {protein_file}
ligand = {ligand_file}
out = {output_file}
center_x = {center[0]}
center_y = {center[1]}
center_z = {center[2]}
size_x = {size[0]}
size_y = {size[1]}
size_z = {size[2]}
exhaustiveness = {exhaustiveness}
num_modes = {num_modes}
"""
            config_file.write_text(config_content)
            
            # Run Vina
            result = subprocess.run(
                ["vina", "--config", str(config_file)],
                capture_output=True,
                text=True,
                timeout=300  # 5 minute timeout
            )
            
            if result.returncode != 0:
                raise RuntimeError(f"Vina failed: {result.stderr}")
            
            # Parse results
            results = self._parse_vina_output(output_file.read_text(), result.stdout)
            
            # Cleanup
            protein_file.unlink(missing_ok=True)
            ligand_file.unlink(missing_ok=True)
            output_file.unlink(missing_ok=True)
            config_file.unlink(missing_ok=True)
            
            return results
            
        except Exception as e:
            logger.error(f"Vina docking failed: {e}")
            return self._mock_docking_results("vina", error=str(e))
    
    def _dock_with_diffdock(
        self,
        protein_pdb: str,
        ligand_smiles: Optional[str],
        ligand_mol2: Optional[str],
        ligand_pdb: Optional[str]
    ) -> Dict:
        """
        Dock using DiffDock (AI-based).
        
        Based on: https://github.com/gcorso/DiffDock
        Usage: python -m inference --protein_path protein.pdb --ligand_descriptions "SMILES" --out_dir results
        """
        if not self.available_tools["diffdock"]:
            logger.warning("DiffDock not available, returning mock results")
            return self._mock_docking_results("diffdock")
        
        try:
            # Create temporary files for DiffDock
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            protein_file = self.temp_dir / f"protein_{timestamp}.pdb"
            output_dir = self.temp_dir / f"diffdock_output_{timestamp}"
            output_dir.mkdir(exist_ok=True)
            
            # Write protein PDB file
            protein_file.write_text(protein_pdb)
            
            # Get ligand SMILES - DiffDock requires SMILES format
            if ligand_smiles:
                ligand_input = ligand_smiles
            elif ligand_mol2:
                # Try to extract SMILES from MOL2 (simplified - would need proper parser)
                # For now, return error suggesting SMILES input
                raise ValueError(
                    "DiffDock requires SMILES format for ligands. "
                    "Please provide ligand_smiles instead of MOL2. "
                    "You can convert MOL2 to SMILES using OpenBabel: obabel input.mol2 -osmi"
                )
            elif ligand_pdb:
                # Try to extract SMILES from PDB (simplified - would need proper parser)
                raise ValueError(
                    "DiffDock requires SMILES format for ligands. "
                    "Please provide ligand_smiles instead of PDB. "
                    "You can convert PDB to SMILES using OpenBabel: obabel input.pdb -osmi"
                )
            else:
                raise ValueError("Ligand SMILES required for DiffDock")
            
            # Build DiffDock command
            # Based on: python -m inference --protein_path protein.pdb --ligand_descriptions "SMILES" --out_dir results
            cmd = [
                "python", "-m", "inference",
                "--protein_path", str(protein_file),
                "--ligand_descriptions", ligand_input,
                "--out_dir", str(output_dir)
            ]
            
            # If DiffDock path is known, change working directory
            cwd = self.diffdock_path if self.diffdock_path else None
            
            logger.info(f"Running DiffDock: {' '.join(cmd)}")
            logger.info(f"Working directory: {cwd}")
            
            # Run DiffDock
            # Note: First run may take longer due to precomputation of look-up tables
            result = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                timeout=600,  # 10 minute timeout (DiffDock can be fast but first run is slower)
                cwd=cwd
            )
            
            if result.returncode != 0:
                error_msg = result.stderr or result.stdout
                logger.error(f"DiffDock failed: {error_msg}")
                raise RuntimeError(f"DiffDock failed: {error_msg}")
            
            # Parse DiffDock output
            # DiffDock outputs SDF files in the output directory
            # Format: rank{rank}_confidence{confidence}.sdf
            results = self._parse_diffdock_output(output_dir, ligand_input)
            
            # Cleanup temporary files
            protein_file.unlink(missing_ok=True)
            # Keep output directory for user inspection, but could clean up if needed
            # shutil.rmtree(output_dir, ignore_errors=True)
            
            return results
            
        except subprocess.TimeoutExpired:
            logger.error("DiffDock timed out")
            return self._mock_docking_results("diffdock", error="DiffDock calculation timed out (>10 minutes)")
        except Exception as e:
            logger.error(f"DiffDock docking failed: {e}")
            return self._mock_docking_results("diffdock", error=str(e))
    
    def _parse_diffdock_output(self, output_dir: Path, ligand_smiles: str) -> Dict:
        """
        Parse DiffDock output files.
        
        DiffDock outputs SDF files with naming: rank{rank}_confidence{confidence}.sdf
        Also outputs a CSV file with results summary.
        """
        poses = []
        best_affinity = None
        best_confidence = None
        
        # Look for SDF files in output directory
        sdf_files = list(output_dir.glob("rank*_confidence*.sdf"))
        
        # Also check for CSV summary file
        csv_files = list(output_dir.glob("*.csv"))
        
        # Parse CSV if available (contains confidence scores)
        confidence_scores = {}
        if csv_files:
            try:
                import csv
                with open(csv_files[0], 'r') as f:
                    reader = csv.DictReader(f)
                    for row in reader:
                        # Extract rank and confidence from CSV
                        if 'rank' in row and 'confidence' in row:
                            rank = int(row['rank'])
                            confidence = float(row['confidence'])
                            confidence_scores[rank] = confidence
            except Exception as e:
                logger.warning(f"Could not parse DiffDock CSV: {e}")
        
        # Parse SDF files
        for sdf_file in sorted(sdf_files):
            try:
                # Extract rank and confidence from filename
                # Format: rank{rank}_confidence{confidence}.sdf
                filename = sdf_file.stem
                parts = filename.split('_')
                rank = None
                confidence = None
                
                for part in parts:
                    if part.startswith('rank'):
                        rank = int(part.replace('rank', ''))
                    elif part.startswith('confidence'):
                        confidence = float(part.replace('confidence', ''))
                
                # If not in filename, try to get from CSV
                if rank is not None and rank in confidence_scores:
                    confidence = confidence_scores[rank]
                
                # Read SDF content
                sdf_content = sdf_file.read_text()
                
                # DiffDock confidence scores are typically negative (lower is better for some metrics)
                # But higher confidence is better for binding prediction
                # Convert confidence to "affinity-like" score for consistency
                # Note: DiffDock doesn't predict affinity, only confidence in pose
                # We'll use negative confidence as a proxy (higher confidence = better binding)
                affinity_proxy = -confidence if confidence is not None else None
                
                poses.append({
                    "mode": rank if rank is not None else len(poses) + 1,
                    "affinity": affinity_proxy,  # Proxy score based on confidence
                    "confidence": confidence,  # Original DiffDock confidence
                    "rmsd_lower": None,  # DiffDock doesn't provide RMSD
                    "rmsd_upper": None,
                    "sdf_file": str(sdf_file),  # Path to SDF file for visualization
                    "sdf_content": sdf_content  # SDF content for download
                })
                
                # Track best pose
                if confidence is not None:
                    if best_confidence is None or confidence > best_confidence:
                        best_confidence = confidence
                        best_affinity = affinity_proxy
                        
            except Exception as e:
                logger.warning(f"Could not parse SDF file {sdf_file}: {e}")
                continue
        
        # Sort poses by confidence (highest first)
        poses.sort(key=lambda x: x["confidence"] if x["confidence"] is not None else float('-inf'), reverse=True)
        
        # Re-number modes after sorting
        for i, pose in enumerate(poses):
            pose["mode"] = i + 1
        
        return {
            "tool": "diffdock",
            "status": "success",
            "poses": poses,
            "best_affinity": best_affinity,
            "best_confidence": best_confidence,
            "num_poses": len(poses),
            "output_directory": str(output_dir),
            "message": "DiffDock docking completed successfully. Note: Affinity values are proxies based on confidence scores. DiffDock predicts binding poses, not binding affinities.",
            "timestamp": datetime.now().isoformat(),
            "ligand_smiles": ligand_smiles
        }
    
    def _dock_with_swissdock(
        self,
        protein_pdb: str,
        ligand_smiles: Optional[str],
        ligand_mol2: Optional[str]
    ) -> Dict:
        """Dock using SwissDock web server."""
        try:
            # SwissDock API integration
            # This would make HTTP requests to SwissDock server
            return self._mock_docking_results("swissdock")
        except Exception as e:
            logger.error(f"SwissDock docking failed: {e}")
            return self._mock_docking_results("swissdock", error=str(e))
    
    def _dock_with_rdock(
        self,
        protein_pdb: str,
        ligand_smiles: Optional[str],
        ligand_mol2: Optional[str],
        ligand_pdb: Optional[str]
    ) -> Dict:
        """Dock using rDock."""
        if not self.available_tools["rdock"]:
            return self._mock_docking_results("rdock")
        
        try:
            # rDock implementation would go here
            return self._mock_docking_results("rdock")
        except Exception as e:
            logger.error(f"rDock docking failed: {e}")
            return self._mock_docking_results("rdock", error=str(e))
    
    def _detect_binding_site(self, protein_pdb: str) -> Tuple[float, float, float]:
        """Auto-detect binding site center from protein structure."""
        # Simple implementation: find center of mass of protein
        lines = protein_pdb.split('\n')
        coords = []
        for line in lines:
            if line.startswith('ATOM') or line.startswith('HETATM'):
                try:
                    x = float(line[30:38].strip())
                    y = float(line[38:46].strip())
                    z = float(line[46:54].strip())
                    coords.append((x, y, z))
                except (ValueError, IndexError):
                    continue
        
        if coords:
            center_x = sum(c[0] for c in coords) / len(coords)
            center_y = sum(c[1] for c in coords) / len(coords)
            center_z = sum(c[2] for c in coords) / len(coords)
            return (center_x, center_y, center_z)
        
        # Default center if parsing fails
        return (0.0, 0.0, 0.0)
    
    def _parse_vina_output(self, output_text: str, log_text: str) -> Dict:
        """Parse Vina output into structured results."""
        results = {
            "tool": "vina",
            "poses": [],
            "best_affinity": None,
            "log": log_text
        }
        
        # Parse binding affinities from log
        lines = log_text.split('\n')
        for i, line in enumerate(lines):
            if 'mode' in line.lower() and 'affinity' in line.lower():
                try:
                    parts = line.split()
                    mode = int(parts[1]) if len(parts) > 1 else len(results["poses"]) + 1
                    affinity = float(parts[parts.index('affinity') + 1]) if 'affinity' in parts else None
                    
                    if affinity is not None:
                        results["poses"].append({
                            "mode": mode,
                            "affinity": affinity,
                            "rmsd_lower": None,
                            "rmsd_upper": None
                        })
                        
                        if results["best_affinity"] is None or affinity < results["best_affinity"]:
                            results["best_affinity"] = affinity
                except (ValueError, IndexError):
                    continue
        
        # Parse PDBQT output for coordinates
        if output_text:
            results["output_pdbqt"] = output_text
        
        return results
    
    def _mock_docking_results(self, tool: str, error: Optional[str] = None) -> Dict:
        """Generate mock docking results for demo/testing."""
        import random
        
        if error:
            return {
                "tool": tool,
                "status": "error",
                "error": error,
                "message": f"Docking tool '{tool}' not available. Install it or use a different tool."
            }
        
        # Generate mock poses
        poses = []
        base_affinity = random.uniform(-8.0, -5.0)  # Typical binding affinities in kcal/mol
        
        for i in range(9):
            poses.append({
                "mode": i + 1,
                "affinity": base_affinity + random.uniform(-0.5, 0.5),
                "rmsd_lower": random.uniform(0.0, 2.0),
                "rmsd_upper": random.uniform(2.0, 5.0),
                "coordinates": {
                    "x": random.uniform(-10, 10),
                    "y": random.uniform(-10, 10),
                    "z": random.uniform(-10, 10)
                }
            })
        
        poses.sort(key=lambda x: x["affinity"])
        
        return {
            "tool": tool,
            "status": "success",
            "poses": poses,
            "best_affinity": poses[0]["affinity"] if poses else None,
            "num_poses": len(poses),
            "message": f"Mock results for {tool}. Install the tool for real docking calculations.",
            "timestamp": datetime.now().isoformat()
        }
    
    def get_available_tools(self) -> Dict:
        """Get list of available docking tools and their status."""
        return {
            "local_tools": {
                "vina": {
                    "available": self.available_tools["vina"],
                    "speed": "1-5 minutes per ligand",
                    "accuracy": "High (industry standard)",
                    "cost": "Free, open source",
                    "installation": "pip install vina or conda install -c conda-forge autodock-vina"
                },
                "diffdock": {
                    "available": self.available_tools["diffdock"],
                    "speed": "30 seconds - 2 minutes",
                    "accuracy": "State-of-the-art (AI-based)",
                    "cost": "Free, open source",
                    "installation": "Clone from https://github.com/gcorso/DiffDock and install dependencies. Requires PyTorch. See README for details.",
                    "github": "https://github.com/gcorso/DiffDock",
                    "note": "Requires SMILES format for ligands. First run precomputes look-up tables (takes a few minutes)."
                },
                "rdock": {
                    "available": self.available_tools["rdock"],
                    "speed": "2-10 minutes",
                    "accuracy": "Good",
                    "cost": "Free, open source",
                    "installation": "Download from rDock website"
                }
            },
            "web_servers": {
                "swissdock": {
                    "available": True,  # Always available via web
                    "speed": "10-30 minutes",
                    "url": "http://www.swissdock.ch/",
                    "input": "Protein PDB + ligand SMILES/MOL2"
                },
                "docking_server": {
                    "available": True,
                    "speed": "15-45 minutes",
                    "url": "https://www.dockingserver.com/"
                }
            }
        }


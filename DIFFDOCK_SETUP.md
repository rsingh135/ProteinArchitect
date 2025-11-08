# DiffDock Integration Setup Guide

## Overview

DiffDock has been integrated into the docking service. This guide explains how to install and use it.

**DiffDock GitHub**: https://github.com/gcorso/DiffDock

## Installation

### Step 1: Clone DiffDock Repository

```bash
# Clone the repository
git clone https://github.com/gcorso/DiffDock.git
cd DiffDock
```

### Step 2: Install Dependencies

```bash
# Create a virtual environment (recommended)
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install torch torchvision torchaudio  # PyTorch
pip install -r requirements.txt  # DiffDock requirements
```

### Step 3: Download Model Weights

DiffDock will automatically download model weights on first run, or you can download them manually following the repository instructions.

### Step 4: Verify Installation

```bash
# Test DiffDock
python -m inference --help
```

If this works, DiffDock is ready to use!

## Integration with Protein Architect

The docking service automatically detects DiffDock if:

1. **DiffDock is in Python path**: If `python -m inference` works from anywhere
2. **DiffDock is in common locations**:
   - Current directory: `./DiffDock`
   - Home directory: `~/DiffDock`
   - `/opt/DiffDock` (Linux)
   - `C:/DiffDock` (Windows)

### Setting DiffDock Path

If DiffDock is installed in a custom location, you can:

1. Add it to Python path:
   ```python
   import sys
   sys.path.append('/path/to/DiffDock')
   ```

2. Or modify `docking_service.py` to add your custom path to the `diffdock_paths` list in `_check_available_tools()`.

## Usage

### Via API

```python
POST /dock_ligand
{
  "protein_pdb": "...",  # PDB content
  "ligand_smiles": "CCO",  # SMILES string (required for DiffDock)
  "tool": "diffdock"
}
```

### Important Notes

1. **SMILES Format Required**: DiffDock requires ligands in SMILES format. If you have MOL2 or PDB, convert them first:
   ```bash
   # Using OpenBabel
   obabel input.mol2 -osmi -O output.smi
   obabel input.pdb -osmi -O output.smi
   ```

2. **First Run**: The first time DiffDock runs, it precomputes look-up tables (takes a few minutes). Subsequent runs are faster.

3. **GPU Recommended**: DiffDock runs significantly faster on GPU. CPU is supported but slower.

4. **Output**: DiffDock outputs:
   - SDF files with binding poses: `rank{rank}_confidence{confidence}.sdf`
   - CSV file with confidence scores
   - Results are parsed and returned via API

## Confidence Scores

DiffDock provides confidence scores (not binding affinities). According to the [DiffDock documentation](https://github.com/gcorso/DiffDock):

- **c > 0**: High confidence
- **-1.5 < c < 0**: Moderate confidence  
- **c < -1.5**: Low confidence

The API converts confidence to an "affinity proxy" for consistency with other docking tools, but remember: **DiffDock predicts binding poses, not binding affinities**.

## Example Workflow

```python
from services.docking_service import DockingService

# Initialize service
docking = DockingService()

# Check if DiffDock is available
tools = docking.get_available_tools()
print(f"DiffDock available: {tools['local_tools']['diffdock']['available']}")

# Run docking
results = docking.dock_ligand(
    protein_pdb=protein_pdb_content,
    ligand_smiles="CCO",  # Ethanol example
    tool="diffdock"
)

# Access results
print(f"Best confidence: {results['best_confidence']}")
print(f"Number of poses: {results['num_poses']}")

for pose in results['poses']:
    print(f"Mode {pose['mode']}: Confidence {pose['confidence']}")
    # SDF content available in pose['sdf_content']
```

## Troubleshooting

### DiffDock Not Detected

1. **Check installation**: Run `python -m inference --help` manually
2. **Check path**: Ensure DiffDock is in one of the common locations
3. **Check Python environment**: Make sure you're using the same Python environment

### Import Errors

```bash
# Install missing dependencies
pip install torch torchvision torchaudio
pip install -r DiffDock/requirements.txt
```

### Slow Performance

- **First run**: Normal - precomputes look-up tables
- **Subsequent runs**: Should be fast (30s-2min)
- **Use GPU**: Install CUDA-enabled PyTorch for faster performance

### SMILES Format Errors

- Ensure ligand is in SMILES format
- Validate SMILES string (use RDKit or similar)
- Convert from other formats using OpenBabel

## References

- **DiffDock GitHub**: https://github.com/gcorso/DiffDock
- **DiffDock Paper**: https://arxiv.org/abs/2210.01776
- **Quick Start Guide**: https://github.com/gcorso/DiffDock?tab=readme-ov-file#quickstart

## API Response Format

```json
{
  "tool": "diffdock",
  "status": "success",
  "poses": [
    {
      "mode": 1,
      "affinity": -0.5,  // Proxy based on confidence
      "confidence": 0.5,  // Original DiffDock confidence
      "rmsd_lower": null,
      "rmsd_upper": null,
      "sdf_file": "/path/to/rank1_confidence0.5.sdf",
      "sdf_content": "..."
    }
  ],
  "best_affinity": -0.5,
  "best_confidence": 0.5,
  "num_poses": 9,
  "output_directory": "/tmp/diffdock_output_...",
  "message": "DiffDock docking completed successfully...",
  "timestamp": "2025-01-XX...",
  "ligand_smiles": "CCO"
}
```


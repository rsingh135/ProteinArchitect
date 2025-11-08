# Molecular Docking Integration Guide

## Overview

The molecular docking system has been integrated into Protein Architect to enable drug discovery workflows. Users can now simulate protein-ligand interactions directly from the frontend.

## Architecture

### Backend Components

1. **`services/docking_service.py`** - Main docking service
   - Supports multiple docking tools (Vina, DiffDock, SwissDock, rDock)
   - Handles file format conversions
   - Auto-detects binding sites
   - Returns structured docking results

2. **API Endpoints** (`main.py`)
   - `POST /dock_ligand` - Perform docking calculation
   - `GET /docking_tools` - Get available tools and their status

### Frontend Components

1. **`components/DockingView.jsx`** - Main docking interface
   - Protein structure input (PDB)
   - Ligand input (SMILES, MOL2, or PDB)
   - Tool selection and configuration
   - Results visualization

2. **`components/DockingView.css`** - Styling for docking interface

## Integration Points

### 1. With Protein Generation Pipeline

After generating a protein, users can:
1. Get the predicted 3D structure (PDB) from AlphaFold/ESMFold
2. Use that PDB directly in the docking interface
3. Dock potential drug molecules to the generated protein

**Example Flow:**
```
Generate Protein → Predict Structure (PDB) → Dock Ligand → Analyze Binding
```

### 2. With Protein Visualization

Docking results can be visualized alongside protein structures:
- Show binding poses in 3D viewer
- Highlight binding site
- Display affinity scores

### 3. With Manufacturing Pipeline

After docking:
- Identify promising drug candidates
- Generate manufacturing protocols for selected ligands
- Estimate production costs

## Usage

### Backend API

```python
# Example API call
POST /dock_ligand
{
  "protein_pdb": "...",  # PDB content
  "ligand_smiles": "CCO",  # Ethanol example
  "tool": "vina",
  "center": [0, 0, 0],
  "size": [20, 20, 20],
  "exhaustiveness": 8,
  "num_modes": 9
}
```

### Frontend Integration

Add to `App.jsx`:

```jsx
import DockingView from './components/DockingView';

// Add to navigation/routing
<DockingView />
```

## Docking Tools Supported

### 1. AutoDock Vina (Recommended)
- **Speed**: 1-5 minutes per ligand
- **Accuracy**: High (industry standard)
- **Installation**: 
  ```bash
  pip install vina
  # OR
  conda install -c conda-forge autodock-vina
  ```
- **Best for**: Drug-like small molecules

### 2. DiffDock (AI-based)
- **Speed**: 30 seconds - 2 minutes
- **Accuracy**: State-of-the-art
- **Installation**: Requires PyTorch and DiffDock
- **Best for**: Fast, accurate drug docking

### 3. SwissDock (Web Server)
- **Speed**: 10-30 minutes
- **Accuracy**: High
- **Installation**: None (web-based)
- **Best for**: When local tools aren't available

### 4. rDock
- **Speed**: 2-10 minutes
- **Accuracy**: Good
- **Installation**: Download from rDock website
- **Best for**: Fragment-based drug design

## Installation Steps

### 1. Install AutoDock Vina (Recommended)

**Windows:**
```powershell
# Using conda (recommended)
conda install -c conda-forge autodock-vina

# OR download binary from:
# https://github.com/ccsb-scripps/AutoDock-Vina/releases
```

**Mac/Linux:**
```bash
# Using conda
conda install -c conda-forge autodock-vina

# OR using pip (if available)
pip install vina
```

### 2. Install OpenBabel (for format conversion)

```bash
# Using conda
conda install -c conda-forge openbabel

# OR using pip
pip install openbabel
```

### 3. Verify Installation

```bash
# Check Vina
vina --version

# Check OpenBabel
obabel --version
```

## Example Workflow

### 1. Generate or Load Protein

```python
# From protein generation
protein_pdb = generate_protein_structure(sequence)

# OR load from file
with open('protein.pdb', 'r') as f:
    protein_pdb = f.read()
```

### 2. Prepare Ligand

```python
# Option 1: SMILES string
ligand_smiles = "CCO"  # Ethanol

# Option 2: MOL2 file
with open('ligand.mol2', 'r') as f:
    ligand_mol2 = f.read()

# Option 3: PDB file
with open('ligand.pdb', 'r') as f:
    ligand_pdb = f.read()
```

### 3. Run Docking

```python
from services.docking_service import DockingService

docking = DockingService()
results = docking.dock_ligand(
    protein_pdb=protein_pdb,
    ligand_smiles=ligand_smiles,
    tool="vina",
    exhaustiveness=8,
    num_modes=9
)
```

### 4. Analyze Results

```python
print(f"Best affinity: {results['best_affinity']} kcal/mol")
print(f"Number of poses: {results['num_poses']}")

for pose in results['poses']:
    print(f"Mode {pose['mode']}: {pose['affinity']} kcal/mol")
```

## Frontend Integration Steps

### 1. Add to Navigation

Update your main navigation to include a "Docking" tab:

```jsx
// In MainLayout.jsx or Navbar.jsx
<nav>
  <Link to="/design">Design</Link>
  <Link to="/docking">Docking</Link>
  <Link to="/manufacturing">Manufacturing</Link>
</nav>
```

### 2. Add Route

```jsx
// In App.jsx or router
import DockingView from './components/DockingView';

<Route path="/docking" element={<DockingView />} />
```

### 3. Connect to Protein Store

If you want to use generated proteins:

```jsx
// In DockingView.jsx
import { useProteinStore } from '../store/proteinStore';

const { currentProtein } = useProteinStore();

// Auto-populate protein PDB if available
useEffect(() => {
  if (currentProtein?.pdbStructure) {
    setProteinPdb(currentProtein.pdbStructure);
  }
}, [currentProtein]);
```

## Testing

### Test with Mock Data

The service includes mock results when tools aren't installed:

```python
# Returns mock results for testing
results = docking_service.dock_ligand(
    protein_pdb="...",
    ligand_smiles="CCO",
    tool="vina"
)
# Returns mock binding poses and affinities
```

### Test API Endpoint

```bash
curl -X POST http://localhost:8000/dock_ligand \
  -H "Content-Type: application/json" \
  -d '{
    "protein_pdb": "ATOM 1 N ...",
    "ligand_smiles": "CCO",
    "tool": "vina"
  }'
```

## Next Steps

1. **Install Docking Tools**: Install AutoDock Vina for real calculations
2. **Add 3D Visualization**: Integrate docking poses into molecular viewer
3. **Batch Docking**: Add support for docking multiple ligands
4. **Binding Site Prediction**: Auto-detect binding sites from protein structure
5. **Drug-Likeness Filters**: Add filters for drug-like properties

## Troubleshooting

### Vina Not Found
- Install using conda: `conda install -c conda-forge autodock-vina`
- Add to PATH if using binary
- Check installation: `vina --version`

### Format Conversion Issues
- Install OpenBabel for SMILES/MOL2 conversion
- Use PDB format directly if possible

### Slow Performance
- Reduce `exhaustiveness` parameter
- Reduce `num_modes` parameter
- Use smaller search space (`size` parameter)

## References

- [AutoDock Vina Documentation](https://vina.scripps.edu/)
- [DiffDock Paper](https://github.com/gcorso/DiffDock)
- [SwissDock Server](http://www.swissdock.ch/)
- [rDock Documentation](http://rdock.sourceforge.net/)


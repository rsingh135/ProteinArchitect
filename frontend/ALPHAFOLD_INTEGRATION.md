# AlphaFold API Integration

## Overview

The search functionality now uses the **AlphaFold Database API** to fetch protein structures and metadata. This integration is **modular and easy to swap** with your own model when ready.

## How It Works

### 1. User Searches for a Protein

Users can search by:
- **UniProt ID** (e.g., `P01308` for human insulin)
- **Protein name** (e.g., `human insulin`)

### 2. Data Flow

```
SearchBar.jsx → ProteinService.js → AlphaFold API → Store → UI Components
```

1. **SearchBar** captures user input
2. **ProteinService** queries AlphaFold API
3. Fetches PDB structure file
4. Updates **Zustand store** with protein data
5. **UI components** automatically update with new data

### 3. What Gets Updated

When a protein is loaded, the following components update automatically:

- **Target Protein section** in DualViewer (left panel)
  - UniProt ID
  - Confidence score
  - Length, Mass, pLDDT metrics
  
- **Protein Overview** sidebar
  - Protein name
  - Organism
  - Sequence
  - All metrics
  - External resource links
  
- **3D Viewer** (MolecularViewer)
  - Receives PDB data for rendering
  - Shows "Structure Loaded" state

## File Structure

```
frontend/src/
├── services/
│   └── proteinService.js          # ⭐ Main service layer - SWAP HERE
├── store/
│   └── proteinStore.js             # Zustand state management
├── components/
│   ├── layout/
│   │   └── SearchBar.jsx           # Search UI
│   ├── viewer/
│   │   ├── DualViewer.jsx          # Main viewer layout
│   │   └── MolecularViewer.jsx     # 3D rendering
│   └── shared/
│       └── ProteinOverview.jsx     # Protein details sidebar
```

## How to Swap with Your Own Model

### Option 1: Quick Switch (Recommended)

**Edit `frontend/src/services/proteinService.js`:**

```javascript
// Line 11 - Change this constant:
const ACTIVE_PROVIDER = 'custom'; // Was: 'alphafold'
```

Then implement your API in the `customProvider` object (line 95-130):

```javascript
const customProvider = {
  name: 'Custom Model',
  
  async searchProtein(query) {
    // Replace with your API endpoint
    const response = await fetch('YOUR_API_ENDPOINT', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query }),
    });
    
    const data = await response.json();
    return this.transformData(data);
  },
  
  transformData(data) {
    // Transform your model's response to standard format
    return {
      id: data.id,
      name: data.protein_name,
      organism: data.organism,
      uniprotId: data.uniprot_id,
      
      structure: {
        pdbUrl: data.pdb_url,
        // Your structure URLs
      },
      
      sequence: {
        full: data.sequence,
        length: data.sequence.length,
      },
      
      metrics: {
        plddt: data.confidence_score,
        confidence: data.confidence_level,
        modelVersion: 'v1.0',
        // Your metrics
      },
      
      metadata: {
        // Additional data
      },
      
      _raw: data,
      _provider: 'custom',
    };
  },
  
  async fetchPDBStructure(proteinData) {
    // Fetch PDB file from your model
    const response = await fetch(proteinData.structure.pdbUrl);
    return await response.text();
  },
};
```

### Option 2: Add New Provider

Create a new provider in `proteinService.js`:

```javascript
const myModelProvider = {
  name: 'My ML Model',
  
  async searchProtein(query) {
    // Your implementation
  },
  
  transformData(data) {
    // Your transformation
  },
  
  async fetchPDBStructure(proteinData) {
    // Your PDB fetching
  },
};

// Add to providers registry:
const providers = {
  alphafold: alphafoldProvider,
  custom: customProvider,
  mymodel: myModelProvider, // Add here
};

// Then change ACTIVE_PROVIDER to 'mymodel'
```

### Option 3: Fallback Strategy

The service has built-in fallback:

```javascript
// If your custom provider fails, it falls back to AlphaFold
try {
  return await customProvider.searchProtein(query);
} catch (error) {
  // Automatically falls back to AlphaFold
  return await alphafoldProvider.searchProtein(query);
}
```

## Standard Data Format

All providers must return data in this format:

```javascript
{
  id: string,                    // Unique identifier
  name: string,                  // Protein name
  organism: string,              // Scientific name
  uniprotId: string,             // UniProt accession
  
  structure: {
    pdbUrl: string,              // URL to PDB file
    cifUrl: string,              // (optional) CIF file
    bcifUrl: string,             // (optional) Binary CIF
  },
  
  sequence: {
    full: string,                // Full amino acid sequence
    length: number,              // Sequence length
  },
  
  metrics: {
    plddt: number,               // Average confidence (0-100)
    confidence: string,          // 'very-high' | 'high' | 'medium' | 'low'
    modelVersion: string,        // Model version
    modelDate: string | null,    // (optional) Creation date
  },
  
  metadata: {
    // Any additional data your model provides
  },
  
  _raw: object,                  // Original API response
  _provider: string,             // Provider name
}
```

## Testing Your Integration

### 1. Test AlphaFold (Current)

```bash
# In browser console at http://localhost:3000
# Search for: P01308
# Expected: Human Insulin loads successfully
```

### 2. Test Your Custom Model

```javascript
// 1. Change ACTIVE_PROVIDER to 'custom'
// 2. Implement customProvider methods
// 3. Search for a protein
// 4. Check browser console for logs
```

### 3. Debug

Enable debug mode in `proteinService.js`:

```javascript
// The service logs everything to console:
console.log('🔍 Searching for protein using', provider.name, query);
console.log('✅ Found protein:', result.name);
```

Check browser Developer Tools → Console for detailed logs.

## API Examples

### AlphaFold API

```bash
# Get protein by UniProt ID
curl "https://alphafold.ebi.ac.uk/api/prediction/P01308"

# Response:
[
  {
    "entryId": "AF-P01308-F1",
    "uniprotId": "P01308",
    "uniprotDescription": "Insulin",
    "pdbUrl": "https://alphafold.ebi.ac.uk/files/AF-P01308-F1-model_v4.pdb",
    "cifUrl": "https://alphafold.ebi.ac.uk/files/AF-P01308-F1-model_v4.cif",
    "globalMetricValue": 92.34,
    ...
  }
]
```

### Your Custom API (Example)

```bash
# Your model endpoint
curl -X POST "YOUR_API_ENDPOINT/search" \
  -H "Content-Type: application/json" \
  -d '{"query": "P01308"}'

# Your response format (can be anything - transform it in customProvider)
{
  "protein_id": "P01308",
  "name": "Human Insulin",
  "confidence": 0.92,
  "structure_url": "https://your-server.com/structures/P01308.pdb",
  ...
}
```

## Features Implemented

✅ Search by UniProt ID  
✅ Search by protein name (via UniProt API)  
✅ Fetch AlphaFold structures  
✅ Display all protein metadata  
✅ Show confidence scores  
✅ Calculate molecular weight  
✅ Update all UI components  
✅ Error handling with user feedback  
✅ Loading states  
✅ Easy provider switching  
✅ Fallback to AlphaFold  

## Known Limitations

### Current

- **3D Visualization**: MolecularViewer shows a placeholder. Full 3Dmol.js integration available if needed.
- **PPI Suggestions**: Currently shows mock data. Can be integrated with STRING DB or your own predictions.
- **AI Insights**: Shows generic insights. Can be connected to GPT-4 or your model.

### To Add Full 3D Visualization

```bash
# Install 3Dmol.js
npm install 3dmol

# Update MolecularViewer.jsx
import $3Dmol from '3dmol';

const viewer = $3Dmol.createViewer(viewerRef.current, {
  backgroundColor: 'white',
});

viewer.addModel(pdbData, 'pdb');
viewer.setStyle({}, { cartoon: { color: 'spectrum' } });
viewer.zoomTo();
viewer.render();
```

## Troubleshooting

### "Protein not found"

- **Check UniProt ID format**: Should be like `P01308` or `Q9Y6K9`
- **Try AlphaFold directly**: https://alphafold.ebi.ac.uk/entry/YOUR_ID
- **Search by name**: Try `human insulin` instead of ID

### "Failed to fetch structure"

- **Check CORS**: AlphaFold API allows CORS
- **Network issue**: Check browser console for errors
- **Invalid PDB**: Structure might not be available

### Components not updating

- **Check Zustand store**: Open Redux DevTools to inspect state
- **Verify data format**: Console should show protein data structure
- **Re-render issue**: Try clicking between tabs

## Quick Reference

### Files to Edit When Swapping Models

1. **`frontend/src/services/proteinService.js`** - Main file
   - Change `ACTIVE_PROVIDER` constant
   - Implement `customProvider` methods
   
2. That's it! Everything else updates automatically.

### What NOT to Change

- `proteinStore.js` - State management works with any provider
- `SearchBar.jsx` - UI component, provider-agnostic
- `ProteinOverview.jsx` - Reads from store
- `DualViewer.jsx` - Reads from store

## Summary

✨ **The AlphaFold integration is working!**

🔄 **To switch to your model:**
1. Edit `proteinService.js`
2. Change `ACTIVE_PROVIDER = 'custom'`
3. Implement the 3 methods in `customProvider`
4. Done!

📝 **Your implementation needs to provide:**
- Protein name, organism, UniProt ID
- Amino acid sequence
- PDB structure file (text or URL)
- Confidence/quality metrics

🎯 **Everything else is handled automatically:**
- UI updates
- State management
- Error handling
- Loading states
- Fallback logic

---

## Example Test

Try these in the search bar at http://localhost:3000:

- `P01308` - Human Insulin (works!)
- `P04637` - Tumor Protein p53
- `P69905` - Hemoglobin Alpha
- `human insulin` - Search by name

All metrics and structure data will load automatically! 🚀

/**
 * Builds comprehensive context for voice assistant based on current protein viewing state
 */

export const buildProteinContext = (protein, selectedResidue = null, viewerState = {}) => {
  if (!protein) {
    return 'No protein currently loaded.';
  }

  // Calculate additional metrics
  const sequenceLength = protein.sequence?.length || 0;
  const molecularMass = sequenceLength > 0 ? (sequenceLength * 110 / 1000).toFixed(1) : 'N/A';
  const plddt = protein.metrics?.plddt;

  // Determine confidence level
  let confidenceLevel = 'Unknown';
  if (plddt >= 90) confidenceLevel = 'Very High';
  else if (plddt >= 70) confidenceLevel = 'High';
  else if (plddt >= 50) confidenceLevel = 'Medium';
  else if (plddt < 50) confidenceLevel = 'Low';

  // Build system prompt
  const contextParts = [];

  // Base protein information
  contextParts.push(`You are an expert protein structure analysis assistant helping a researcher analyze protein ${protein.uniprotId || 'structure'}.

CURRENT PROTEIN:
- UniProt ID: ${protein.uniprotId || 'Not available'}
- Protein Name: ${protein.name || 'Unknown'}
- Sequence Length: ${sequenceLength} amino acids
- Molecular Mass: ${molecularMass} kDa
- AlphaFold pLDDT Score: ${plddt ? plddt.toFixed(1) : 'N/A'} (${confidenceLevel} confidence)
- Function: ${protein.function || 'Function not specified'}
`);

  // Add selected residue information if available
  if (selectedResidue) {
    contextParts.push(`
CURRENTLY SELECTED RESIDUE:
The user is currently viewing residue ${selectedResidue.resn} (${getAminoAcidFullName(selectedResidue.resn)}) at position ${selectedResidue.resi} in chain ${selectedResidue.chain || 'A'}.
This residue is highlighted in the 3D visualization and the user may ask specific questions about it.
`);
  }

  // Add visible interactions information
  if (viewerState.showDisulfides || viewerState.showHBonds || viewerState.showLabels) {
    contextParts.push(`
VISIBLE INTERACTIONS IN 3D VIEW:
- Disulfide Bonds (S-S): ${viewerState.showDisulfides ? 'Visible - yellow connections between cysteine residues' : 'Hidden'}
- Hydrogen Bonds (H-Bond): ${viewerState.showHBonds ? 'Visible - blue dotted lines showing hydrogen bonding interactions' : 'Hidden'}
- Residue Labels: ${viewerState.showLabels ? 'Visible - residue identifiers displayed on structure' : 'Hidden'}
`);
  }

  // Add structure information if available
  if (protein.structureInfo) {
    contextParts.push(`
STRUCTURE DETAILS:
- Total Atoms: ${protein.structureInfo.totalAtoms || 'N/A'}
- Total Residues: ${protein.structureInfo.totalResidues || sequenceLength}
- Chains: ${protein.structureInfo.chains?.join(', ') || 'A'}
`);
  }

  // Add guidance for the assistant
  contextParts.push(`
INSTRUCTIONS:
- The user can see the 3D structure in real-time and may reference what they're looking at
- Be concise and clear in your explanations (aim for 2-3 sentences unless asked for more detail)
- Use scientific terminology but explain complex concepts accessibly
- When discussing specific residues, reference their position and role in the structure
- If asked about structure confidence, explain pLDDT scores (0-100 scale, >70 is reliable)
- You can discuss:
  * Structural features (alpha helices, beta sheets, loops)
  * Functional domains and active sites
  * Binding sites and interaction interfaces
  * Stability and confidence scores
  * Evolutionary conservation
  * Potential mutations and their effects

Be helpful, accurate, and scientifically rigorous while remaining conversational.
`);

  return contextParts.join('\n');
};

/**
 * Get full amino acid name from three-letter code
 */
const getAminoAcidFullName = (threeLetterCode) => {
  const aminoAcids = {
    ALA: 'Alanine',
    ARG: 'Arginine',
    ASN: 'Asparagine',
    ASP: 'Aspartic Acid',
    CYS: 'Cysteine',
    GLN: 'Glutamine',
    GLU: 'Glutamic Acid',
    GLY: 'Glycine',
    HIS: 'Histidine',
    ILE: 'Isoleucine',
    LEU: 'Leucine',
    LYS: 'Lysine',
    MET: 'Methionine',
    PHE: 'Phenylalanine',
    PRO: 'Proline',
    SER: 'Serine',
    THR: 'Threonine',
    TRP: 'Tryptophan',
    TYR: 'Tyrosine',
    VAL: 'Valine',
  };

  return aminoAcids[threeLetterCode?.toUpperCase()] || threeLetterCode;
};

/**
 * Build a condensed context for quick queries (shorter system prompt)
 */
export const buildCondensedContext = (protein, selectedResidue = null) => {
  if (!protein) return 'No protein loaded.';

  let context = `Analyzing protein ${protein.uniprotId || 'structure'} (${protein.sequence?.length || 0} aa, pLDDT: ${protein.metrics?.plddt?.toFixed(1) || 'N/A'}).`;

  if (selectedResidue) {
    context += ` User selected ${selectedResidue.resn} ${selectedResidue.resi}.`;
  }

  return context;
};

export default buildProteinContext;

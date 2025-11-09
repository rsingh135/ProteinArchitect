import React from 'react';
import { ExternalLink } from 'lucide-react';
import { useProteinStore } from '../../store/proteinStore';
import { useThemeStore } from '../../store/themeStore';
import { ProteinService } from '../../services/proteinService';

const ProteinOverview = ({ showPPISuggestions = false }) => {
  const { targetProtein, confidenceScores } = useProteinStore();
  const { theme } = useThemeStore();
  
  // Mock PPI suggestions (can be replaced with actual data later)
  const ppiSuggestions = [
    { id: 'P01308', name: 'Insulin Receptor', confidence: 0.98, source: 'STRING' },
    { id: 'P62942', name: 'Fructose-1,6-bisphosphatase', confidence: 0.85, source: 'BioGRID' },
    { id: 'P00533', name: 'EGFR', confidence: 0.78, source: 'IntAct' },
    { id: 'P04626', name: 'ErbB2', confidence: 0.72, source: 'STRING' },
  ];

  // Use fetched protein data or show placeholder
  const proteinName = targetProtein?.name || 'No protein loaded';
  const uniprotId = targetProtein?.uniprotId || '---';
  const organism = targetProtein?.organism || 'Unknown';
  const sequence = targetProtein?.sequence?.full || '';
  const sequenceLength = targetProtein?.sequence?.length || 0;
  const plddt = targetProtein?.metrics?.plddt || confidenceScores?.average || 0;
  const confidence = targetProtein?.metrics?.confidence || confidenceScores?.confidence || 'unknown';
  const molecularWeight = targetProtein ? ProteinService.calculateMolecularWeight(sequence) : 0;

  // Generate a short description if we have the protein
  const getDescription = () => {
    if (!targetProtein) {
      return 'Search for a protein to view its details';
    }
    if (targetProtein.metadata?.gene) {
      return `Gene: ${targetProtein.metadata.gene}. Predicted structure from AlphaFold.`;
    }
    return 'Protein structure predicted by AlphaFold database.';
  };

  // Get confidence badge color
  const getConfidenceBadge = () => {
    if (theme === 'dark') {
      if (plddt >= 90) return { color: 'bg-green-900/30 text-green-400', label: 'Very High' };
      if (plddt >= 70) return { color: 'bg-blue-900/30 text-blue-400', label: 'High' };
      if (plddt >= 50) return { color: 'bg-yellow-900/30 text-yellow-400', label: 'Medium' };
      return { color: 'bg-red-900/30 text-red-400', label: 'Low' };
    } else {
      if (plddt >= 90) return { color: 'bg-green-100 text-green-700', label: 'Very High' };
      if (plddt >= 70) return { color: 'bg-blue-100 text-blue-700', label: 'High' };
      if (plddt >= 50) return { color: 'bg-yellow-100 text-yellow-700', label: 'Medium' };
      return { color: 'bg-red-100 text-red-700', label: 'Low' };
    }
  };

  const confidenceBadge = getConfidenceBadge();

  return (
    <div className={`w-96 border-l overflow-y-auto transition-colors ${
      theme === 'dark'
        ? 'border-gray-700 bg-gray-800'
        : 'border-gray-200 bg-white'
    }`}>
      <div className="p-6 space-y-6">
        {/* Protein Overview */}
        <div>
          <h3 className={`text-xs font-display font-bold uppercase tracking-wider mb-4 ${
            theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
          }`}>
            Target Protein
          </h3>

          <div className="space-y-4">
            <div>
              <p className={`text-xs mb-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Name</p>
              <p className={`text-base font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{proteinName}</p>
            </div>

            <div>
              <p className={`text-xs mb-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>UniProt ID</p>
              <div className="flex items-center justify-between">
                <p className={`text-base font-mono ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{uniprotId}</p>
                {targetProtein && (
                  <span className={`px-2 py-1 text-xs font-semibold rounded ${confidenceBadge.color}`}>
                    {confidenceBadge.label}
                  </span>
                )}
              </div>
            </div>

            <div>
              <p className={`text-xs mb-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Organism</p>
              <p className={`text-base italic ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{organism}</p>
            </div>

            {targetProtein && (
              <div>
                <p className={`text-xs mb-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Description</p>
                <p className={`text-sm leading-relaxed ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                  {getDescription()}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Metrics */}
        {targetProtein && (
          <div className={`pt-6 border-t ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
            <h3 className={`text-xs font-display font-bold uppercase tracking-wider mb-3 ${
              theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
            }`}>
              Structure Metrics
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div className={`rounded-lg p-3 border transition-colors ${
                theme === 'dark'
                  ? 'bg-gray-700/50 border-gray-600'
                  : 'bg-gray-50 border-gray-200'
              }`}>
                <p className={`text-xs mb-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Length</p>
                <p className={`text-lg font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{sequenceLength} aa</p>
              </div>
              <div className={`rounded-lg p-3 border transition-colors ${
                theme === 'dark'
                  ? 'bg-gray-700/50 border-gray-600'
                  : 'bg-gray-50 border-gray-200'
              }`}>
                <p className={`text-xs mb-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Mass</p>
                <p className={`text-lg font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{molecularWeight.toFixed(1)} kDa</p>
              </div>
              <div className={`rounded-lg p-3 border col-span-2 transition-colors ${
                theme === 'dark'
                  ? 'bg-gray-700/50 border-gray-600'
                  : 'bg-gray-50 border-gray-200'
              }`}>
                <p className={`text-xs mb-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Average pLDDT</p>
                <div className="flex items-center justify-between">
                  <p className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{plddt.toFixed(1)}</p>
                  <div className="flex-1 ml-3">
                    <div className={`h-2 rounded-full overflow-hidden ${
                      theme === 'dark' ? 'bg-gray-600' : 'bg-gray-200'
                    }`}>
                      <div 
                        className={`h-full ${plddt >= 70 ? 'bg-green-500' : plddt >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`}
                        style={{ width: `${plddt}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
            {targetProtein.metrics?.modelVersion && (
              <p className={`text-xs mt-2 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                Model: AlphaFold {targetProtein.metrics.modelVersion}
              </p>
            )}
          </div>
        )}

        {/* Sequence Preview */}
        {targetProtein && sequence && (
          <div className={`pt-6 border-t ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
            <h3 className={`text-xs font-display font-bold uppercase tracking-wider mb-3 ${
              theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
            }`}>
              Sequence
            </h3>
            <div className={`rounded-lg p-4 border transition-colors ${
              theme === 'dark'
                ? 'bg-gray-700/50 border-gray-600'
                : 'bg-gray-50 border-gray-200'
            }`}>
              <p className={`font-mono text-xs leading-relaxed break-all ${
                theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
              }`}>
                {sequence.substring(0, 200)}{sequence.length > 200 ? '...' : ''}
              </p>
              <p className={`text-xs mt-2 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>{sequenceLength} amino acids</p>
            </div>
          </div>
        )}

        {/* PPI Suggestions - Only shown in 3D Viewer */}
        {showPPISuggestions && targetProtein && (
          <div className={`pt-6 border-t ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
            <h3 className={`text-xs font-display font-bold uppercase tracking-wider mb-3 ${
              theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
            }`}>
              Protein Interactions
            </h3>
            <p className={`text-xs mb-4 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
              Suggested binding partners based on experimental data
            </p>
            <div className="space-y-2">
              {ppiSuggestions.map((ppi, index) => (
                <button
                  key={index}
                  className={`w-full text-left p-3 rounded-lg border transition-all group ${
                    theme === 'dark'
                      ? 'border-gray-700 hover:border-blue-600 hover:bg-gray-700/50'
                      : 'border-gray-200 hover:border-primary-300 hover:bg-primary-50'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className={`text-sm font-medium group-hover:text-primary-700 ${
                        theme === 'dark' ? 'text-white' : 'text-gray-900'
                      }`}>
                        {ppi.name}
                      </p>
                      <p className={`text-xs font-mono mt-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>{ppi.id}</p>
                      <div className="flex items-center gap-3 mt-2">
                        <span className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                          Confidence: <span className={`font-semibold ${
                            theme === 'dark' ? 'text-green-400' : 'text-green-600'
                          }`}>{(ppi.confidence * 100).toFixed(0)}%</span>
                        </span>
                        <span className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                          Source: <span className="font-medium">{ppi.source}</span>
                        </span>
                      </div>
                    </div>
                    <ExternalLink className={`w-4 h-4 flex-shrink-0 ml-2 group-hover:text-primary-600 ${
                      theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
                    }`} />
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* AI Insights - Only shown in Analysis Dashboard */}
        {!showPPISuggestions && targetProtein && (
          <div className={`pt-6 border-t ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
            <div className="flex items-center justify-between mb-3">
              <h3 className={`text-xs font-semibold uppercase tracking-wider ${
                theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
              }`}>
                AI Insights
              </h3>
              <span className={`px-2 py-1 text-xs font-semibold rounded ${
                theme === 'dark'
                  ? 'bg-purple-900/30 text-purple-400'
                  : 'bg-purple-100 text-purple-700'
              }`}>
                GPT-4
              </span>
            </div>

            <div className="space-y-3">
              <div className={`rounded-lg p-4 border transition-colors ${
                theme === 'dark'
                  ? 'bg-gradient-to-br from-purple-900/20 to-blue-900/20 border-purple-800/50'
                  : 'bg-gradient-to-br from-purple-50 to-blue-50 border-purple-100'
              }`}>
                <h4 className={`text-sm font-semibold mb-2 ${
                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                }`}>🧬 Key Structural Features</h4>
                <ul className={`text-sm space-y-1.5 ${
                  theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  <li>• High confidence prediction (pLDDT: {plddt.toFixed(1)})</li>
                  <li>• {sequenceLength} amino acid residues</li>
                  <li>• AlphaFold {targetProtein.metrics?.modelVersion} prediction</li>
                </ul>
              </div>

              <div className={`rounded-lg p-4 border transition-colors ${
                theme === 'dark'
                  ? 'bg-green-900/20 border-green-800/50'
                  : 'bg-green-50 border-green-100'
              }`}>
                <h4 className={`text-sm font-semibold mb-2 ${
                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                }`}>✓ Quality Assessment</h4>
                <p className={`text-sm ${
                  theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Model confidence: {confidenceBadge.label} (pLDDT: {plddt.toFixed(1)}). 
                  {plddt >= 70 ? ' Suitable for detailed structural analysis.' : ' Consider experimental validation.'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* External Resources */}
        {targetProtein && (
          <div className={`pt-6 border-t ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
            <h3 className={`text-xs font-semibold uppercase tracking-wider mb-3 ${
              theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
            }`}>
              External Resources
            </h3>
            <div className="space-y-2">
              {[
                { name: 'UniProt', url: `https://www.uniprot.org/uniprotkb/${uniprotId}` },
                { name: 'AlphaFold DB', url: `https://alphafold.ebi.ac.uk/entry/${uniprotId}` },
                { name: 'PDB', url: `https://www.rcsb.org/search?q=${uniprotId}` },
                { name: 'KEGG', url: `https://www.genome.jp/entry/${uniprotId}` },
              ].map((resource, index) => (
                <a
                  key={index}
                  href={resource.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`flex items-center justify-between p-3 rounded-lg border transition-colors group ${
                    theme === 'dark'
                      ? 'bg-gray-700/50 hover:bg-gray-700 border-gray-600'
                      : 'bg-gray-50 hover:bg-gray-100 border-gray-200'
                  }`}
                >
                  <span className={`text-sm font-medium group-hover:text-primary-600 ${
                    theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    {resource.name}
                  </span>
                  <ExternalLink className={`w-4 h-4 group-hover:text-primary-600 ${
                    theme === 'dark' ? 'text-gray-400' : 'text-gray-400'
                  }`} />
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {!targetProtein && (
          <div className={`pt-6 border-t text-center ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
            <div className={`rounded-lg p-8 border-2 border-dashed transition-colors ${
              theme === 'dark'
                ? 'bg-gray-700/50 border-gray-600'
                : 'bg-gray-50 border-gray-300'
            }`}>
              <p className={`text-sm mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>No protein loaded</p>
              <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Use the search bar above to load a protein structure</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProteinOverview;

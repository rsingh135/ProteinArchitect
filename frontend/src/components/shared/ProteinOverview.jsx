import React from 'react';
import { ExternalLink } from 'lucide-react';
import { useProteinStore } from '../../store/proteinStore';
import { ProteinService } from '../../services/proteinService';

const ProteinOverview = ({ showPPISuggestions = false }) => {
  const { targetProtein, confidenceScores } = useProteinStore();
  
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
    if (plddt >= 90) return { color: 'bg-green-100 text-green-700', label: 'Very High' };
    if (plddt >= 70) return { color: 'bg-blue-100 text-blue-700', label: 'High' };
    if (plddt >= 50) return { color: 'bg-yellow-100 text-yellow-700', label: 'Medium' };
    return { color: 'bg-red-100 text-red-700', label: 'Low' };
  };

  const confidenceBadge = getConfidenceBadge();

  return (
    <div className="w-96 border-l border-gray-200 bg-white overflow-y-auto">
      <div className="p-6 space-y-6">
        {/* Protein Overview */}
        <div>
          <h3 className="text-xs font-display font-bold text-gray-500 uppercase tracking-wider mb-4">
            Target Protein
          </h3>

          <div className="space-y-4">
            <div>
              <p className="text-xs text-gray-600 mb-1">Name</p>
              <p className="text-base font-semibold text-gray-900">{proteinName}</p>
            </div>

            <div>
              <p className="text-xs text-gray-600 mb-1">UniProt ID</p>
              <div className="flex items-center justify-between">
                <p className="text-base font-mono text-gray-900">{uniprotId}</p>
                {targetProtein && (
                  <span className={`px-2 py-1 text-xs font-semibold rounded ${confidenceBadge.color}`}>
                    {confidenceBadge.label}
                  </span>
                )}
              </div>
            </div>

            <div>
              <p className="text-xs text-gray-600 mb-1">Organism</p>
              <p className="text-base italic text-gray-900">{organism}</p>
            </div>

            {targetProtein && (
              <div>
                <p className="text-xs text-gray-600 mb-1">Description</p>
                <p className="text-sm text-gray-700 leading-relaxed">
                  {getDescription()}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Metrics */}
        {targetProtein && (
          <div className="pt-6 border-t border-gray-200">
            <h3 className="text-xs font-display font-bold text-gray-500 uppercase tracking-wider mb-3">
              Structure Metrics
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                <p className="text-xs text-gray-600 mb-1">Length</p>
                <p className="text-lg font-bold text-gray-900">{sequenceLength} aa</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                <p className="text-xs text-gray-600 mb-1">Mass</p>
                <p className="text-lg font-bold text-gray-900">{molecularWeight.toFixed(1)} kDa</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3 border border-gray-200 col-span-2">
                <p className="text-xs text-gray-600 mb-1">Average pLDDT</p>
                <div className="flex items-center justify-between">
                  <p className="text-2xl font-bold text-gray-900">{plddt.toFixed(1)}</p>
                  <div className="flex-1 ml-3">
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
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
              <p className="text-xs text-gray-500 mt-2">
                Model: AlphaFold {targetProtein.metrics.modelVersion}
              </p>
            )}
          </div>
        )}

        {/* Sequence Preview */}
        {targetProtein && sequence && (
          <div className="pt-6 border-t border-gray-200">
            <h3 className="text-xs font-display font-bold text-gray-500 uppercase tracking-wider mb-3">
              Sequence
            </h3>
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <p className="font-mono text-xs text-gray-700 leading-relaxed break-all">
                {sequence.substring(0, 200)}{sequence.length > 200 ? '...' : ''}
              </p>
              <p className="text-xs text-gray-500 mt-2">{sequenceLength} amino acids</p>
            </div>
          </div>
        )}

        {/* PPI Suggestions - Only shown in 3D Viewer */}
        {showPPISuggestions && targetProtein && (
          <div className="pt-6 border-t border-gray-200">
            <h3 className="text-xs font-display font-bold text-gray-500 uppercase tracking-wider mb-3">
              Protein Interactions
            </h3>
            <p className="text-xs text-gray-600 mb-4">
              Suggested binding partners based on experimental data
            </p>
            <div className="space-y-2">
              {ppiSuggestions.map((ppi, index) => (
                <button
                  key={index}
                  className="w-full text-left p-3 rounded-lg border border-gray-200 hover:border-primary-300 hover:bg-primary-50 transition-all group"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900 group-hover:text-primary-700">
                        {ppi.name}
                      </p>
                      <p className="text-xs text-gray-600 font-mono mt-1">{ppi.id}</p>
                      <div className="flex items-center gap-3 mt-2">
                        <span className="text-xs text-gray-500">
                          Confidence: <span className="font-semibold text-green-600">{(ppi.confidence * 100).toFixed(0)}%</span>
                        </span>
                        <span className="text-xs text-gray-500">
                          Source: <span className="font-medium">{ppi.source}</span>
                        </span>
                      </div>
                    </div>
                    <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-primary-600 flex-shrink-0 ml-2" />
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* AI Insights - Only shown in Analysis Dashboard */}
        {!showPPISuggestions && targetProtein && (
          <div className="pt-6 border-t border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                AI Insights
              </h3>
              <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs font-semibold rounded">
                GPT-4
              </span>
            </div>

            <div className="space-y-3">
              <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-lg p-4 border border-purple-100">
                <h4 className="text-sm font-semibold text-gray-900 mb-2">🧬 Key Structural Features</h4>
                <ul className="text-sm text-gray-700 space-y-1.5">
                  <li>• High confidence prediction (pLDDT: {plddt.toFixed(1)})</li>
                  <li>• {sequenceLength} amino acid residues</li>
                  <li>• AlphaFold {targetProtein.metrics?.modelVersion} prediction</li>
                </ul>
              </div>

              <div className="bg-green-50 rounded-lg p-4 border border-green-100">
                <h4 className="text-sm font-semibold text-gray-900 mb-2">✓ Quality Assessment</h4>
                <p className="text-sm text-gray-700">
                  Model confidence: {confidenceBadge.label} (pLDDT: {plddt.toFixed(1)}). 
                  {plddt >= 70 ? ' Suitable for detailed structural analysis.' : ' Consider experimental validation.'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* External Resources */}
        {targetProtein && (
          <div className="pt-6 border-t border-gray-200">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
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
                  className="flex items-center justify-between p-3 rounded-lg bg-gray-50 hover:bg-gray-100 border border-gray-200 transition-colors group"
                >
                  <span className="text-sm font-medium text-gray-700 group-hover:text-primary-600">
                    {resource.name}
                  </span>
                  <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-primary-600" />
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {!targetProtein && (
          <div className="pt-6 border-t border-gray-200 text-center">
            <div className="bg-gray-50 rounded-lg p-8 border-2 border-dashed border-gray-300">
              <p className="text-sm text-gray-600 mb-2">No protein loaded</p>
              <p className="text-xs text-gray-500">Use the search bar above to load a protein structure</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProteinOverview;

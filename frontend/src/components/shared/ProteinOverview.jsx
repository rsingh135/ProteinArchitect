import React from 'react';
import { ExternalLink } from 'lucide-react';

const ProteinOverview = ({ showPPISuggestions = false }) => {
  // Mock PPI suggestions
  const ppiSuggestions = [
    { id: 'P01308', name: 'Insulin Receptor', confidence: 0.98, source: 'STRING' },
    { id: 'P62942', name: 'Fructose-1,6-bisphosphatase', confidence: 0.85, source: 'BioGRID' },
    { id: 'P00533', name: 'EGFR', confidence: 0.78, source: 'IntAct' },
    { id: 'P04626', name: 'ErbB2', confidence: 0.72, source: 'STRING' },
  ];

  return (
    <div className="w-96 border-l border-gray-200 bg-white overflow-y-auto">
      <div className="p-6 space-y-6">
        {/* Protein Overview */}
        <div>
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">
            Protein Overview
          </h3>

          <div className="space-y-4">
            <div>
              <p className="text-xs text-gray-600 mb-1">Name</p>
              <p className="text-base font-semibold text-gray-900">Human Insulin</p>
            </div>

            <div>
              <p className="text-xs text-gray-600 mb-1">UniProt ID</p>
              <p className="text-base font-mono text-gray-900">P01308</p>
            </div>

            <div>
              <p className="text-xs text-gray-600 mb-1">Organism</p>
              <p className="text-base italic text-gray-900">Homo sapiens</p>
            </div>

            <div>
              <p className="text-xs text-gray-600 mb-1">Function</p>
              <p className="text-sm text-gray-700 leading-relaxed">
                Insulin decreases blood glucose concentration. It increases cell permeability to monosaccharides, amino acids and fatty acids.
              </p>
            </div>
          </div>
        </div>

        {/* Sequence Preview */}
        <div className="pt-6 border-t border-gray-200">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
            Sequence
          </h3>
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <p className="font-mono text-xs text-gray-700 leading-relaxed break-all">
              MALWMRLLPL LALLALWGPD PAAAFVNQHL CGSHLVEALY LVCGERGFFY TPKTRREAED LQVGQVELGG GPGAGSLQPL ALEGSLQKRG IVEQCCTSIC SLYQLENYCN
            </p>
            <p className="text-xs text-gray-500 mt-2">110 amino acids</p>
          </div>
        </div>

        {/* PPI Suggestions - Only shown in 3D Viewer */}
        {showPPISuggestions && (
          <div className="pt-6 border-t border-gray-200">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
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
        {!showPPISuggestions && (
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
                  <li>• Contains 3 disulfide bonds critical for stability</li>
                  <li>• High α-helix content (42%) in core regions</li>
                  <li>• Conserved binding interface at residues 45-68</li>
                </ul>
              </div>

              <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
                <h4 className="text-sm font-semibold text-gray-900 mb-2">💊 Therapeutic Potential</h4>
                <p className="text-sm text-gray-700">
                  High druggability score (0.92). Binding pocket suitable for small molecule inhibitors.
                </p>
              </div>

              <div className="bg-amber-50 rounded-lg p-4 border border-amber-100">
                <h4 className="text-sm font-semibold text-gray-900 mb-2">⚠️ Mutation Hotspots</h4>
                <p className="text-sm text-gray-700">
                  Residues 24, 56, and 89 show high mutation sensitivity affecting protein stability.
                </p>
              </div>

              <div className="bg-green-50 rounded-lg p-4 border border-green-100">
                <h4 className="text-sm font-semibold text-gray-900 mb-2">✓ Quality Assessment</h4>
                <p className="text-sm text-gray-700">
                  Model confidence: Very High (pLDDT: 92.3). Suitable for detailed structural analysis.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* External Resources */}
        <div className="pt-6 border-t border-gray-200">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
            External Resources
          </h3>
          <div className="space-y-2">
            {[
              { name: 'UniProt', url: 'https://www.uniprot.org/uniprotkb/P01308' },
              { name: 'AlphaFold DB', url: 'https://alphafold.ebi.ac.uk/entry/P01308' },
              { name: 'PDB', url: 'https://www.rcsb.org/search?q=P01308' },
              { name: 'KEGG', url: 'https://www.genome.jp/entry/P01308' },
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
      </div>
    </div>
  );
};

export default ProteinOverview;

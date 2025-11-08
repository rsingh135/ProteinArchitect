import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Zap, Activity, Target } from 'lucide-react';
import ConfidencePanel from './ConfidencePanel';
import PAEPlot from './PAEPlot';

const AnalysisDashboard = () => {
  const quickStats = [
    {
      label: 'Global Confidence',
      value: '92.3%',
      trend: '+5.2%',
      icon: TrendingUp,
      color: 'green',
    },
    {
      label: 'Interface Quality',
      value: '87.5',
      trend: 'Excellent',
      icon: Zap,
      color: 'blue',
    },
    {
      label: 'Binding Affinity',
      value: '-12.4 kcal/mol',
      trend: 'Strong',
      icon: Activity,
      color: 'purple',
    },
    {
      label: 'Contact Residues',
      value: '24',
      trend: '8 critical',
      icon: Target,
      color: 'amber',
    },
  ];

  const colorClasses = {
    green: { bg: 'bg-green-50', text: 'text-green-600', icon: 'bg-green-100' },
    blue: { bg: 'bg-blue-50', text: 'text-blue-600', icon: 'bg-blue-100' },
    purple: { bg: 'bg-purple-50', text: 'text-purple-600', icon: 'bg-purple-100' },
    amber: { bg: 'bg-amber-50', text: 'text-amber-600', icon: 'bg-amber-100' },
  };

  return (
    <div className="flex h-full overflow-hidden">
      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gray-50">
        {/* Quick Stats */}
        <div className="grid grid-cols-4 gap-4">
          {quickStats.map((stat, index) => {
            const Icon = stat.icon;
            const colors = colorClasses[stat.color];

            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-lg border border-gray-200 shadow-sm p-5"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-xs font-medium text-gray-600 mb-1">{stat.label}</p>
                    <p className={`text-2xl font-bold text-gray-900`}>
                      {stat.value}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">{stat.trend}</p>
                  </div>
                  <div className={`p-2.5 rounded-lg ${colors.icon}`}>
                    <Icon className={`w-5 h-5 ${colors.text}`} />
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Main Analysis Panels */}
        <div className="grid grid-cols-2 gap-6">
          <ConfidencePanel />
          <PAEPlot />
        </div>

        {/* Interface Contacts */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Target className="w-5 h-5 mr-2 text-primary-600" />
            Interface Contact Residues
          </h3>

          <div className="space-y-2">
            {[
              { residue: 'TYR-23', partner: 'GLU-45', distance: '2.8 Å', type: 'Hydrogen Bond', energy: '-3.2' },
              { residue: 'ARG-67', partner: 'ASP-102', distance: '3.1 Å', type: 'Salt Bridge', energy: '-4.5' },
              { residue: 'PHE-89', partner: 'TRP-134', distance: '3.6 Å', type: 'π-π Stacking', energy: '-2.8' },
              { residue: 'LYS-112', partner: 'GLU-156', distance: '2.9 Å', type: 'Ionic', energy: '-3.9' },
            ].map((contact, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors border border-gray-100"
              >
                <div className="flex items-center space-x-4">
                  <div className="font-mono text-sm text-gray-900">
                    <span className="font-semibold">{contact.residue}</span>
                    <span className="text-gray-400 mx-2">↔</span>
                    <span className="font-semibold">{contact.partner}</span>
                  </div>
                  <span className="text-xs px-2 py-1 rounded bg-white border border-gray-200 text-gray-600">
                    {contact.distance}
                  </span>
                </div>
                <div className="flex items-center space-x-3">
                  <span className="text-xs text-gray-600">{contact.type}</span>
                  <span className="text-sm font-semibold text-green-600">
                    {contact.energy} kcal/mol
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Sidebar - Protein Info & AI Insights */}
      <div className="w-96 border-l border-gray-200 bg-white overflow-y-auto">
        <div className="p-6 space-y-6">
          {/* Protein Overview */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-3 uppercase tracking-wide">Protein Overview</h3>
            <div className="space-y-3">
              <div>
                <p className="text-xs text-gray-600 mb-1">Name</p>
                <p className="text-sm font-semibold text-gray-900">Human Insulin</p>
              </div>
              <div>
                <p className="text-xs text-gray-600 mb-1">UniProt ID</p>
                <p className="text-sm font-mono text-primary-600">P01308</p>
              </div>
              <div>
                <p className="text-xs text-gray-600 mb-1">Organism</p>
                <p className="text-sm text-gray-900 italic">Homo sapiens</p>
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
            <h3 className="text-sm font-semibold text-gray-900 mb-3 uppercase tracking-wide">Sequence</h3>
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <p className="text-xs font-mono text-gray-700 leading-relaxed break-all">
                MALWMRLLPL LALLALWGPD PAAAFVNQHL CGSHLVEALY LVCGERGFFY TPKTRREAED LQVGQVELGG GPGAGSLQPL ALEGSLQKRG IVEQCCTSIC SLYQLENYCN
              </p>
              <p className="text-xs text-gray-500 mt-2">110 amino acids</p>
            </div>
          </div>

          {/* AI Insights */}
          <div className="pt-6 border-t border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">AI Insights</h3>
              <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs font-medium rounded">GPT-4</span>
            </div>
            <div className="space-y-4">
              <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-lg p-4 border border-purple-100">
                <h4 className="text-sm font-semibold text-gray-900 mb-2">🧬 Key Structural Features</h4>
                <ul className="text-sm text-gray-700 space-y-1.5">
                  <li className="flex items-start">
                    <span className="text-purple-600 mr-2">•</span>
                    <span>Contains 3 disulfide bonds critical for stability</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-purple-600 mr-2">•</span>
                    <span>High α-helix content (~50%) indicates strong secondary structure</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-purple-600 mr-2">•</span>
                    <span>Conserved binding pocket shows 98% sequence identity across mammals</span>
                  </li>
                </ul>
              </div>

              <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
                <h4 className="text-sm font-semibold text-gray-900 mb-2">💡 Therapeutic Potential</h4>
                <p className="text-sm text-gray-700 leading-relaxed">
                  The predicted structure shows excellent druggability with 2 distinct binding pockets. Consider targeting residues 23-45 for small molecule inhibitors.
                </p>
              </div>

              <div className="bg-amber-50 rounded-lg p-4 border border-amber-100">
                <h4 className="text-sm font-semibold text-gray-900 mb-2">⚠️ Mutation Hotspots</h4>
                <p className="text-sm text-gray-700 leading-relaxed">
                  Residues R67 and K112 are mutation-sensitive. 12 known pathogenic variants affect binding affinity by &gt;50%.
                </p>
              </div>

              <div className="bg-green-50 rounded-lg p-4 border border-green-100">
                <h4 className="text-sm font-semibold text-gray-900 mb-2">✓ Quality Assessment</h4>
                <p className="text-sm text-gray-700 leading-relaxed">
                  Model confidence is excellent (92.3% pLDDT). Core regions show very high reliability. Interface predictions are trustworthy for experimental validation.
                </p>
              </div>
            </div>
          </div>

          {/* External Links */}
          <div className="pt-6 border-t border-gray-200">
            <h3 className="text-sm font-semibold text-gray-900 mb-3 uppercase tracking-wide">External Resources</h3>
            <div className="space-y-2">
              {[
                { name: 'UniProt', url: 'P01308' },
                { name: 'AlphaFold DB', url: 'P01308' },
                { name: 'PDB', url: '1A7F' },
                { name: 'KEGG', url: 'hsa:3630' },
              ].map((link, index) => (
                <a
                  key={index}
                  href="#"
                  className="flex items-center justify-between p-2.5 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors text-sm text-gray-900 border border-gray-200"
                >
                  <span className="font-medium">{link.name}</span>
                  <span className="text-xs font-mono text-gray-500">{link.url}</span>
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalysisDashboard;

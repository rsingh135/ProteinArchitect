import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Zap, Activity, Target } from 'lucide-react';
import ConfidencePanel from './ConfidencePanel';
import PAEPlot from './PAEPlot';
import ProteinOverview from '../shared/ProteinOverview';

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

      {/* Right Sidebar - Protein Overview with AI Insights */}
      <ProteinOverview showPPISuggestions={false} />
    </div>
  );
};

export default AnalysisDashboard;

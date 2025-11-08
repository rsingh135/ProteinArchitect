import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Zap, Activity, Target } from 'lucide-react';
import GlassCard from '../shared/GlassCard';
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
      color: 'cyan',
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
      color: 'magenta',
    },
  ];

  return (
    <div className="h-full overflow-y-auto p-6 space-y-6">
      {/* Quick Stats */}
      <div className="grid grid-cols-4 gap-4">
        {quickStats.map((stat, index) => {
          const Icon = stat.icon;
          const colorClasses = {
            green: 'text-neon-green border-neon-green/30 shadow-neon-green',
            cyan: 'text-neon-cyan border-neon-cyan/30 shadow-neon-cyan',
            purple: 'text-neon-purple border-neon-purple/30 shadow-neon-purple',
            magenta: 'text-neon-magenta border-neon-magenta/30 shadow-neon-magenta',
          };

          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <GlassCard className={`border ${colorClasses[stat.color]}`}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-xs text-gray-400 mb-1">{stat.label}</p>
                    <p className={`text-2xl font-bold ${colorClasses[stat.color].split(' ')[0]}`}>
                      {stat.value}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">{stat.trend}</p>
                  </div>
                  <div className={`p-2 rounded-lg bg-dark-surface/50`}>
                    <Icon className={`w-5 h-5 ${colorClasses[stat.color].split(' ')[0]}`} />
                  </div>
                </div>
              </GlassCard>
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
      <GlassCard neonBorder neonColor="cyan">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
          <Target className="w-5 h-5 mr-2 text-neon-cyan" />
          Interface Contact Residues
        </h3>

        <div className="space-y-3">
          {[
            { residue: 'TYR-23', partner: 'GLU-45', distance: '2.8 Å', type: 'Hydrogen Bond', energy: '-3.2' },
            { residue: 'ARG-67', partner: 'ASP-102', distance: '3.1 Å', type: 'Salt Bridge', energy: '-4.5' },
            { residue: 'PHE-89', partner: 'TRP-134', distance: '3.6 Å', type: 'π-π Stacking', energy: '-2.8' },
            { residue: 'LYS-112', partner: 'GLU-156', distance: '2.9 Å', type: 'Ionic', energy: '-3.9' },
          ].map((contact, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 rounded-lg bg-dark-surface/50 hover:bg-dark-hover transition-colors"
            >
              <div className="flex items-center space-x-4">
                <div className="font-mono text-sm">
                  <span className="text-neon-cyan">{contact.residue}</span>
                  <span className="text-gray-500 mx-2">↔</span>
                  <span className="text-neon-magenta">{contact.partner}</span>
                </div>
                <span className="text-xs px-2 py-1 rounded bg-dark-elevated text-gray-400">
                  {contact.distance}
                </span>
              </div>
              <div className="flex items-center space-x-3">
                <span className="text-xs text-gray-400">{contact.type}</span>
                <span className="text-sm font-semibold text-neon-green">
                  {contact.energy} kcal/mol
                </span>
              </div>
            </div>
          ))}
        </div>
      </GlassCard>
    </div>
  );
};

export default AnalysisDashboard;

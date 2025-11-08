import React from 'react'
import { motion } from 'framer-motion'
import { 
  MessageSquare, 
  Code, 
  TrendingUp, 
  Box, 
  FlaskConical, 
  FileText, 
  Database,
  Cloud,
  Eye,
  Settings
} from 'lucide-react'

const steps = [
  {
    number: 1,
    title: 'Component Specification',
    icon: MessageSquare,
    description: 'Specify the components your organism needs—proteins, organelles (like chloroplasts), or specific structures',
    details: ['Define required components and their functions', 'Set environmental constraints and conditions', 'Specify organism type and target environment', 'Input functional requirements for each component'],
    color: 'from-primary-400 to-primary-500'
  },
  {
    number: 2,
    title: 'Component Sequence Generation',
    icon: Code,
    description: 'AI generates optimized protein sequences for each specified component based on your requirements',
    details: ['ESMFold-based sequence generation for each component', 'Trained on UniProt & PDB data', 'Outputs optimized amino acid sequences', 'Generates sequences for proteins, organelles, and structures'],
    color: 'from-primary-500 to-primary-600'
  },
  {
    number: 3,
    title: 'RL Optimization',
    icon: TrendingUp,
    description: 'Multi-objective reinforcement learning optimizes protein sequences',
    details: ['PPO algorithm for sequence refinement', 'Binding score optimization', 'Stability prediction', 'Function matching'],
    color: 'from-primary-600 to-primary-700'
  },
  {
    number: 4,
    title: 'Structure Prediction',
    icon: Box,
    description: 'AlphaFold2/ESMFold predicts 3D protein conformations',
    details: ['PDB file generation', 'Confidence metrics (pLDDT, RMSD)', '3D structure visualization'],
    color: 'from-primary-300 to-primary-500'
  },
  {
    number: 5,
    title: 'Survivability & Cost Analysis',
    icon: FlaskConical,
    description: 'GNN predicts manufacturability, cost, and organism survivability metrics',
    details: ['Organism survivability predictions', 'Manufacturability probability for each component', 'Cost estimation per component ($/g)', 'Yield predictions and host cell recommendations'],
    color: 'from-primary-500 to-primary-700'
  },
  {
    number: 6,
    title: 'Manufacturing Protocol',
    icon: FileText,
    description: 'AI agent generates industrial production recipes',
    details: ['Host cell selection', 'Expression system design', 'Fermentation parameters', 'Complete production workflow'],
    color: 'from-primary-400 to-primary-600'
  },
  {
    number: 7,
    title: 'Backend Orchestration',
    icon: Settings,
    description: 'FastAPI routes coordinate all pipeline steps',
    details: ['Modular API endpoints', 'S3 storage for intermediates', 'DynamoDB metadata', 'Cloud integration'],
    color: 'from-primary-600 to-primary-800'
  },
  {
    number: 8,
    title: '3D Visualization',
    icon: Eye,
    description: 'Interactive organism and protein structure viewers',
    details: ['3Dmol.js protein viewer', 'Three.js organism mockup', 'Multi-scale visualization', 'Interactive exploration'],
    color: 'from-primary-300 to-primary-600'
  },
  {
    number: 9,
    title: 'Model Training',
    icon: Database,
    description: 'Continuous learning from verified sequences',
    details: ['Fine-tuning pipelines', 'AWS SageMaker training', 'Auto-retrain triggers', 'Performance monitoring'],
    color: 'from-primary-500 to-primary-800'
  },
  {
    number: 10,
    title: 'Cloud Deployment',
    icon: Cloud,
    description: 'Scalable infrastructure for production workloads',
    details: ['Docker containerization', 'Lambda triggers', 'SageMaker endpoints', 'Auto-scaling'],
    color: 'from-primary-400 to-primary-700'
  }
]

const Process = () => {
  return (
    <section id="process" className="py-24 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            <span className="text-gradient">10-Step Component Design Pipeline</span>
          </h2>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            From component specification to analysis and manufacturing protocol
          </p>
        </motion.div>

        <div className="space-y-8">
          {steps.map((step, index) => {
            const Icon = step.icon
            return (
              <motion.div
                key={step.number}
                initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ 
                  duration: 0.6, 
                  delay: index * 0.1,
                  type: "spring",
                  stiffness: 100
                }}
                whileHover={{ 
                  scale: 1.02,
                  y: -4,
                  transition: { duration: 0.2 }
                }}
                className="glass rounded-2xl p-6 md:p-8 hover:bg-white/10 transition-all cursor-pointer"
              >
                <div className="flex flex-col md:flex-row items-start gap-6">
                  <motion.div 
                    className="flex-shrink-0"
                    whileHover={{ scale: 1.1, rotate: [0, -5, 5, -5, 0] }}
                    transition={{ duration: 0.5 }}
                  >
                    <motion.div 
                      className={`w-16 h-16 rounded-xl bg-gradient-to-br ${step.color} flex items-center justify-center`}
                      animate={{ 
                        boxShadow: [
                          '0 0 0px rgba(79, 70, 229, 0.4)',
                          '0 0 20px rgba(79, 70, 229, 0.6)',
                          '0 0 0px rgba(79, 70, 229, 0.4)'
                        ]
                      }}
                      transition={{ 
                        duration: 2 + (index * 0.3), 
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                    >
                      <Icon className="w-8 h-8 text-white" />
                    </motion.div>
                  </motion.div>
                  <div className="flex-1">
                    <motion.div 
                      className="flex items-center gap-3 mb-3"
                      whileHover={{ x: 3 }}
                    >
                      <motion.span 
                        className="text-sm font-semibold text-primary-400"
                        animate={{ 
                          opacity: [0.7, 1, 0.7]
                        }}
                        transition={{ 
                          duration: 2 + (index * 0.2),
                          repeat: Infinity,
                          ease: "easeInOut"
                        }}
                      >
                        Step {step.number}
                      </motion.span>
                      <motion.h3 
                        className="text-2xl font-bold text-gray-100"
                        whileHover={{ scale: 1.02 }}
                      >
                        {step.title}
                      </motion.h3>
                    </motion.div>
                    <p className="text-gray-300 mb-4 text-lg">{step.description}</p>
                    <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {step.details.map((detail, i) => (
                        <li key={i} className="flex items-start gap-2 text-gray-400">
                          <span className="text-primary-400 mt-1">•</span>
                          <span>{detail}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

export default Process


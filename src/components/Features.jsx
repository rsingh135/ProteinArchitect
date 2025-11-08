import React from 'react'
import { motion } from 'framer-motion'
import { 
  Zap, 
  Shield, 
  Layers, 
  Cpu, 
  GitBranch, 
  BarChart3,
  FileCode,
  Globe
} from 'lucide-react'

const features = [
  {
    icon: Zap,
    title: 'Lightning Fast',
    description: 'Generate component sequences and get analysis results in minutes',
    gradient: 'from-primary-400 to-primary-500'
  },
  {
    icon: Shield,
    title: 'Comprehensive Analysis',
    description: 'Get survivability, cost, and manufacturability metrics for each component',
    gradient: 'from-primary-500 to-primary-600'
  },
  {
    icon: Layers,
    title: 'Component-Based Design',
    description: 'Specify proteins, organelles, and structures—from atoms to assemblies',
    gradient: 'from-primary-300 to-primary-500'
  },
  {
    icon: Cpu,
    title: 'Advanced ML Models',
    description: 'LLMs, Transformers, RL agents, and GNNs working in harmony',
    gradient: 'from-primary-600 to-primary-700'
  },
  {
    icon: GitBranch,
    title: 'Iterative Optimization',
    description: 'Reinforcement learning continuously improves component designs',
    gradient: 'from-primary-400 to-primary-600'
  },
  {
    icon: BarChart3,
    title: 'Detailed Metrics',
    description: 'Track survivability, cost, yield, and manufacturability in real-time',
    gradient: 'from-primary-500 to-primary-700'
  },
  {
    icon: FileCode,
    title: 'Open Standards',
    description: 'FASTA, PDB, JSON formats for seamless integration',
    gradient: 'from-primary-300 to-primary-600'
  },
  {
    icon: Globe,
    title: 'Cloud-Native',
    description: 'Scalable AWS infrastructure handles any workload',
    gradient: 'from-primary-600 to-primary-800'
  }
]

const Features = () => {
  return (
    <section id="features" className="py-24 px-4 sm:px-6 lg:px-8 bg-dark-900/50">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            <span className="text-gradient">Powerful Features</span>
          </h2>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Everything you need to specify, generate, and analyze organism components
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => {
            const Icon = feature.icon
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20, rotate: -2 }}
                whileInView={{ opacity: 1, y: 0, rotate: 0 }}
                viewport={{ once: true }}
                transition={{ 
                  duration: 0.6, 
                  delay: index * 0.08,
                  type: "spring",
                  stiffness: 80
                }}
                whileHover={{ 
                  scale: 1.05,
                  rotate: [0, -1, 1, -1, 0],
                  y: -8,
                  transition: { duration: 0.3 }
                }}
                className="glass rounded-xl p-6 hover:bg-white/10 transition-all group"
              >
                <motion.div 
                  className={`w-12 h-12 rounded-lg bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-4`}
                  animate={{ 
                    rotate: [0, 5, -5, 0],
                    scale: [1, 1.1, 1]
                  }}
                  transition={{ 
                    duration: 3 + (index * 0.5),
                    repeat: Infinity,
                    repeatDelay: 2,
                    ease: "easeInOut"
                  }}
                  whileHover={{ 
                    scale: 1.2,
                    rotate: 360,
                    transition: { duration: 0.5 }
                  }}
                >
                  <Icon className="w-6 h-6 text-white" />
                </motion.div>
                <h3 className="text-xl font-semibold mb-2 text-gray-100">{feature.title}</h3>
                <p className="text-gray-400">{feature.description}</p>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

export default Features


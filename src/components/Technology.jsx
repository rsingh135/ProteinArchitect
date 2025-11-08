import React from 'react'
import { motion } from 'framer-motion'
import { Brain, Database, Cloud, Code } from 'lucide-react'

const technologies = [
  {
    category: 'AI Models',
    icon: Brain,
    items: [
      { name: 'GPT-4o / Claude / Gemini', purpose: 'Blueprint generation & constraint extraction' },
      { name: 'ESMFold Transformer', purpose: 'Protein sequence generation' },
      { name: 'PPO RL Agent', purpose: 'Sequence optimization' },
      { name: 'Expressibility GNN', purpose: 'Manufacturability prediction' }
    ],
    gradient: 'from-primary-500 to-primary-600'
  },
  {
    category: 'Structure Prediction',
    icon: Code,
    items: [
      { name: 'AlphaFold2', purpose: '3D protein structure prediction' },
      { name: 'ESMFold', purpose: 'Fast structure generation' },
      { name: 'BioPython', purpose: 'Sequence manipulation' },
      { name: 'PyMOL API', purpose: 'Complex assembly' }
    ],
    gradient: 'from-primary-400 to-primary-500'
  },
  {
    category: 'Data Sources',
    icon: Database,
    items: [
      { name: 'UniProt', purpose: 'Protein sequence database' },
      { name: 'PDB', purpose: '3D structure repository' },
      { name: 'Addgene', purpose: 'Plasmid compatibility' },
      { name: 'PubChem / KEGG', purpose: 'Biochemical constraints' }
    ],
    gradient: 'from-primary-600 to-primary-700'
  },
  {
    category: 'Infrastructure',
    icon: Cloud,
    items: [
      { name: 'AWS SageMaker', purpose: 'Model training & inference' },
      { name: 'S3 + DynamoDB', purpose: 'Storage & metadata' },
      { name: 'Lambda', purpose: 'Auto-retrain triggers' },
      { name: 'Docker', purpose: 'Containerized deployment' }
    ],
    gradient: 'from-primary-300 to-primary-600'
  }
]

const Technology = () => {
  return (
    <section id="technology" className="py-24 px-4 sm:px-6 lg:px-8 bg-dark-900/50">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            <span className="text-gradient">Technology Stack</span>
          </h2>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Built with cutting-edge AI, bioinformatics, and cloud technologies
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {technologies.map((tech, index) => {
            const Icon = tech.icon
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20, rotate: index % 2 === 0 ? -1 : 1 }}
                whileInView={{ opacity: 1, y: 0, rotate: 0 }}
                viewport={{ once: true }}
                transition={{ 
                  duration: 0.6, 
                  delay: index * 0.1,
                  type: "spring",
                  stiffness: 100
                }}
                whileHover={{ 
                  scale: 1.03,
                  y: -6,
                  rotate: index % 2 === 0 ? 1 : -1,
                  transition: { duration: 0.2 }
                }}
                className="glass rounded-2xl p-8 cursor-pointer"
              >
                <motion.div 
                  className="flex items-center gap-4 mb-6"
                  whileHover={{ x: 5 }}
                >
                  <motion.div 
                    className={`w-14 h-14 rounded-xl bg-gradient-to-br ${tech.gradient} flex items-center justify-center`}
                    animate={{ 
                      rotate: [0, 5, -5, 0],
                      scale: [1, 1.05, 1]
                    }}
                    transition={{ 
                      duration: 4 + (index * 0.5),
                      repeat: Infinity,
                      repeatDelay: 3,
                      ease: "easeInOut"
                    }}
                    whileHover={{ 
                      rotate: 360,
                      scale: 1.15,
                      transition: { duration: 0.6 }
                    }}
                  >
                    <Icon className="w-7 h-7 text-white" />
                  </motion.div>
                  <h3 className="text-2xl font-bold text-gray-100">{tech.category}</h3>
                </motion.div>
                <div className="space-y-4">
                  {tech.items.map((item, i) => (
                    <div key={i} className="border-l-2 border-primary-500/30 pl-4">
                      <h4 className="font-semibold text-gray-200 mb-1">{item.name}</h4>
                      <p className="text-sm text-gray-400">{item.purpose}</p>
                    </div>
                  ))}
                </div>
              </motion.div>
            )
          })}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-16 glass rounded-2xl p-8 text-center"
        >
          <h3 className="text-2xl font-bold mb-4 text-gray-100">Frontend & Backend</h3>
          <div className="flex flex-wrap justify-center gap-4 text-gray-300">
            <span className="px-4 py-2 bg-primary-500/20 rounded-lg">React</span>
            <span className="px-4 py-2 bg-primary-500/20 rounded-lg">FastAPI</span>
            <span className="px-4 py-2 bg-primary-500/20 rounded-lg">3Dmol.js</span>
            <span className="px-4 py-2 bg-primary-500/20 rounded-lg">Three.js</span>
            <span className="px-4 py-2 bg-primary-500/20 rounded-lg">TensorFlow</span>
            <span className="px-4 py-2 bg-primary-500/20 rounded-lg">PyTorch</span>
            <span className="px-4 py-2 bg-primary-500/20 rounded-lg">PyTorch Geometric</span>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

export default Technology


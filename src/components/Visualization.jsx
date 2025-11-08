import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Eye, Dna, Box, Layers, ChevronRight } from 'lucide-react'

const visualizationFeatures = [
  {
    title: 'Atomic-Level Protein View',
    description: 'Explore every atom of your designed proteins with interactive 3D visualization',
    icon: Dna,
    details: [
      'Rotate, zoom, and explore protein structures in real-time',
      'Color by hydrophobicity or secondary structure',
      'View confidence metrics (pLDDT) for each prediction',
      'Export to PDB format for further analysis'
    ]
  },
  {
    title: 'Complete Organism Assembly',
    description: 'See how proteins come together to form functional organisms',
    icon: Layers,
    details: [
      'Multi-scale visualization from molecules to cells',
      'Interactive protein positioning and organization',
      'Color-coded functional modules and pathways',
      'Real-time rendering with Three.js'
    ]
  },
  {
    title: 'AI-Powered Structure Prediction',
    description: 'Accurate 3D folding predictions using AlphaFold2 and ESMFold',
    icon: Box,
    details: [
      'Automated structure prediction for all designed proteins',
      'Multi-protein complex assembly and docking',
      'Superstructure visualization and analysis',
      'Export to GLTF/OBJ for advanced rendering'
    ]
  }
]

const Visualization = () => {
  const [activeFeature, setActiveFeature] = useState(0)

  return (
    <section id="visualization" className="py-24 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 mb-6">
            <Eye className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            <span className="text-gradient">See Your Designs Come to Life</span>
          </h2>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Visualize your generated components in stunning 3D. From atomic protein structures to complete assemblies—explore every detail of your designed components before manufacturing.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          <div className="space-y-4">
            {visualizationFeatures.map((feature, index) => {
              const Icon = feature.icon
              const isActive = activeFeature === index
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20, rotate: -1 }}
                  whileInView={{ opacity: 1, x: 0, rotate: 0 }}
                  viewport={{ once: true }}
                  transition={{ 
                    duration: 0.6, 
                    delay: index * 0.1,
                    type: "spring",
                    stiffness: 100
                  }}
                  whileHover={{ 
                    scale: 1.02,
                    x: 5,
                    transition: { duration: 0.2 }
                  }}
                  onClick={() => setActiveFeature(index)}
                  className={`glass rounded-xl p-6 cursor-pointer transition-all ${
                    isActive ? 'bg-primary-500/20 border-primary-500/50' : 'hover:bg-white/10'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <motion.div 
                      className={`w-12 h-12 rounded-lg bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center flex-shrink-0`}
                      animate={isActive ? {
                        scale: [1, 1.15, 1.1],
                        rotate: [0, 10, -10, 0]
                      } : {
                        scale: 1,
                        rotate: 0
                      }}
                      transition={{ 
                        duration: 2,
                        repeat: isActive ? Infinity : 0,
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
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-xl font-semibold text-gray-100">{feature.title}</h3>
                        <ChevronRight className={`w-5 h-5 text-primary-400 transition-transform ${
                          isActive ? 'rotate-90' : ''
                        }`} />
                      </div>
                      <p className="text-gray-400 mb-3">{feature.description}</p>
                      <AnimatePresence>
                        {isActive && (
                          <motion.ul
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="space-y-2 overflow-hidden"
                          >
                            {feature.details.map((detail, i) => (
                              <li key={i} className="flex items-start gap-2 text-sm text-gray-300">
                                <span className="text-primary-400 mt-1">✓</span>
                                <span>{detail}</span>
                              </li>
                            ))}
                          </motion.ul>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="relative"
          >
            <div className="glass rounded-2xl p-8 aspect-square flex items-center justify-center">
              <div className="relative w-full h-full">
                {/* 3D visualization placeholder */}
                <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-primary-500/20 to-primary-600/20 flex items-center justify-center">
                  <div className="text-center">
                    <Dna className="w-24 h-24 text-primary-400 mx-auto mb-4 animate-pulse-slow" />
                    <p className="text-gray-400">Interactive 3D Viewer</p>
                    <p className="text-sm text-gray-500 mt-2">3Dmol.js / Three.js</p>
                  </div>
                </div>
                
                {/* Floating elements representing proteins */}
                {[1, 2, 3, 4].map((i) => (
                  <motion.div
                    key={i}
                    className="absolute w-16 h-16 rounded-full bg-gradient-to-br from-primary-400/40 to-primary-600/40 blur-xl"
                    style={{
                      top: `${20 + i * 20}%`,
                      left: `${15 + i * 15}%`,
                    }}
                    animate={{
                      y: [0, -20, 0],
                      x: [0, 10, 0],
                      scale: [1, 1.2, 1],
                    }}
                    transition={{
                      duration: 3 + i,
                      repeat: Infinity,
                      delay: i * 0.5,
                    }}
                  />
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}

export default Visualization


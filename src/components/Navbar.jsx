import React, { useState, useEffect } from 'react'
import { Dna, Menu, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const smoothScrollTo = (targetId) => {
    if (targetId === 'top') {
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      })
    } else {
      const element = document.getElementById(targetId)
      if (element) {
        const offset = 80 // Account for fixed navbar
        const elementPosition = element.getBoundingClientRect().top
        const offsetPosition = elementPosition + window.pageYOffset - offset

        window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth'
        })
      }
    }
    setMobileMenuOpen(false) // Close mobile menu after clicking
  }

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? 'glass py-3' : 'py-5'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          <button
            onClick={() => smoothScrollTo('top')}
            className="flex items-center space-x-2 hover:opacity-80 transition-opacity cursor-pointer"
          >
            <Dna className="w-8 h-8 text-primary-400" />
            <span className="text-2xl font-bold text-gradient">GenLab</span>
          </button>

          <div className="hidden md:flex items-center space-x-8">
            <button 
              onClick={() => smoothScrollTo('process')} 
              className="text-gray-300 hover:text-primary-400 transition-colors bg-transparent border-none cursor-pointer"
            >
              Process
            </button>
            <button 
              onClick={() => smoothScrollTo('features')} 
              className="text-gray-300 hover:text-primary-400 transition-colors bg-transparent border-none cursor-pointer"
            >
              Features
            </button>
            <button 
              onClick={() => smoothScrollTo('visualization')} 
              className="text-gray-300 hover:text-primary-400 transition-colors bg-transparent border-none cursor-pointer"
            >
              3D View
            </button>
            <button 
              onClick={() => smoothScrollTo('technology')} 
              className="text-gray-300 hover:text-primary-400 transition-colors bg-transparent border-none cursor-pointer"
            >
              Technology
            </button>
            <button className="px-6 py-2 bg-primary-500 hover:bg-primary-600 rounded-lg transition-colors font-medium">
              Get Started
            </button>
          </div>

          <button
            className="md:hidden text-gray-300"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden glass border-t border-white/10"
          >
            <div className="px-4 py-4 space-y-4">
              <button 
                onClick={() => smoothScrollTo('process')} 
                className="block w-full text-left text-gray-300 hover:text-primary-400 transition-colors bg-transparent border-none cursor-pointer"
              >
                Process
              </button>
              <button 
                onClick={() => smoothScrollTo('features')} 
                className="block w-full text-left text-gray-300 hover:text-primary-400 transition-colors bg-transparent border-none cursor-pointer"
              >
                Features
              </button>
              <button 
                onClick={() => smoothScrollTo('visualization')} 
                className="block w-full text-left text-gray-300 hover:text-primary-400 transition-colors bg-transparent border-none cursor-pointer"
              >
                3D View
              </button>
              <button 
                onClick={() => smoothScrollTo('technology')} 
                className="block w-full text-left text-gray-300 hover:text-primary-400 transition-colors bg-transparent border-none cursor-pointer"
              >
                Technology
              </button>
              <button className="w-full px-6 py-2 bg-primary-500 hover:bg-primary-600 rounded-lg transition-colors font-medium">
                Get Started
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  )
}

export default Navbar


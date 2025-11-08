import React from 'react'
import { Dna, Github, Twitter, Linkedin, Mail } from 'lucide-react'

const Footer = () => {
  return (
    <footer className="border-t border-white/10 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <Dna className="w-6 h-6 text-primary-400" />
              <span className="text-xl font-bold text-gradient">GenLab</span>
            </div>
            <p className="text-gray-400 text-sm">
              AI-powered synthetic organism design platform. From concept to manufacturing.
            </p>
          </div>
          
          <div>
            <h3 className="font-semibold text-gray-200 mb-4">Product</h3>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><a href="#process" className="hover:text-primary-400 transition-colors">Features</a></li>
              <li><a href="#visualization" className="hover:text-primary-400 transition-colors">3D Viewer</a></li>
              <li><a href="#technology" className="hover:text-primary-400 transition-colors">Technology</a></li>
              <li><a href="#" className="hover:text-primary-400 transition-colors">Pricing</a></li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-semibold text-gray-200 mb-4">Resources</h3>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><a href="#" className="hover:text-primary-400 transition-colors">Documentation</a></li>
              <li><a href="#" className="hover:text-primary-400 transition-colors">API Reference</a></li>
              <li><a href="#" className="hover:text-primary-400 transition-colors">Tutorials</a></li>
              <li><a href="#" className="hover:text-primary-400 transition-colors">Blog</a></li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-semibold text-gray-200 mb-4">Connect</h3>
            <div className="flex space-x-4">
              <a href="#" className="text-gray-400 hover:text-primary-400 transition-colors">
                <Github className="w-5 h-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-primary-400 transition-colors">
                <Twitter className="w-5 h-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-primary-400 transition-colors">
                <Linkedin className="w-5 h-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-primary-400 transition-colors">
                <Mail className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>
        
        <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center text-sm text-gray-400">
          <p>© 2024 GenLab. All rights reserved.</p>
          <div className="flex space-x-6 mt-4 md:mt-0">
            <a href="#" className="hover:text-primary-400 transition-colors">Privacy</a>
            <a href="#" className="hover:text-primary-400 transition-colors">Terms</a>
            <a href="#" className="hover:text-primary-400 transition-colors">Security</a>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer


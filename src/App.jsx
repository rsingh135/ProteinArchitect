import React from 'react'
import Hero from './components/Hero'
import Process from './components/Process'
import Features from './components/Features'
import Visualization from './components/Visualization'
import Technology from './components/Technology'
import CTA from './components/CTA'
import Navbar from './components/Navbar'
import Footer from './components/Footer'

function App() {
  return (
    <div className="min-h-screen bg-dark-950">
      <Navbar />
      <Hero />
      <Visualization />
      <Process />
      <Features />
      <Technology />
      <CTA />
      <Footer />
    </div>
  )
}

export default App


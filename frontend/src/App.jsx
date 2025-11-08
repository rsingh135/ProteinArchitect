import React, { useState } from 'react'
import ProteinDesignForm from './components/ProteinDesignForm'
import ProteinVisualization from './components/ProteinVisualization'
import ManufacturingView from './components/ManufacturingView'
import RefinementDialog from './components/RefinementDialog'
import './App.css'

function App() {
  const [designResult, setDesignResult] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('design')
  const [showRefinement, setShowRefinement] = useState(false)

  const handleDesignSubmit = async (formData) => {
    setIsLoading(true)
    try {
      const response = await fetch('http://localhost:8000/generate_protein', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })
      const data = await response.json()
      setDesignResult(data)
      setActiveTab('visualization')
    } catch (error) {
      console.error('Error generating protein:', error)
      alert('Error generating protein. Make sure the backend is running.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleRefinement = async (refinementPrompt) => {
    if (!designResult) return
    
    setIsLoading(true)
    try {
      const response = await fetch('http://localhost:8000/refine_protein', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sequence: designResult.sequence,
          refinement_prompt: refinementPrompt,
        }),
      })
      const data = await response.json()
      setDesignResult({
        ...designResult,
        sequence: data.refined_sequence,
        oracle_results: data.refined_prediction,
        refinement_explanation: data.refinement_explanation,
      })
      setShowRefinement(false)
    } catch (error) {
      console.error('Error refining protein:', error)
      alert('Error refining protein.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>🧬 Protein Architect</h1>
        <p>Expressibility-Aware Therapeutic Protein Designer</p>
      </header>

      <nav className="tabs">
        <button
          className={activeTab === 'design' ? 'active' : ''}
          onClick={() => setActiveTab('design')}
        >
          Design
        </button>
        <button
          className={activeTab === 'visualization' ? 'active' : ''}
          onClick={() => setActiveTab('visualization')}
          disabled={!designResult}
        >
          3D Structure
        </button>
        <button
          className={activeTab === 'manufacturing' ? 'active' : ''}
          onClick={() => setActiveTab('manufacturing')}
          disabled={!designResult}
        >
          Manufacturing
        </button>
      </nav>

      <main className="app-main">
        {activeTab === 'design' && (
          <ProteinDesignForm
            onSubmit={handleDesignSubmit}
            isLoading={isLoading}
            onRefine={() => setShowRefinement(true)}
            hasResult={!!designResult}
          />
        )}

        {activeTab === 'visualization' && designResult && (
          <ProteinVisualization
            sequence={designResult.sequence}
            oracleResults={designResult.oracle_results}
          />
        )}

        {activeTab === 'manufacturing' && designResult && (
          <ManufacturingView
            protocol={designResult.manufacturing_protocol}
            oracleResults={designResult.oracle_results}
          />
        )}
      </main>

      {designResult && (
        <div className="results-summary">
          <div className="result-card">
            <h3>Generated Sequence</h3>
            <p className="sequence">{designResult.sequence}</p>
            <div className="metrics">
              <span>Length: {designResult.length} aa</span>
              <span>Stability: {designResult.oracle_results.stability_score}/100</span>
              <span>Yield: {designResult.oracle_results.yield_prediction} g/L</span>
            </div>
          </div>
        </div>
      )}

      {showRefinement && designResult && (
        <RefinementDialog
          currentSequence={designResult.sequence}
          onRefine={handleRefinement}
          onClose={() => setShowRefinement(false)}
        />
      )}

      {isLoading && (
        <div className="loading-overlay">
          <div className="spinner"></div>
          <p>Generating protein design...</p>
        </div>
      )}
    </div>
  )
}

export default App


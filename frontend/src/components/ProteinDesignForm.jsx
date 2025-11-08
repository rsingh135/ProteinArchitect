import React, { useState } from 'react'
import './ProteinDesignForm.css'

function ProteinDesignForm({ onSubmit, isLoading, onRefine, hasResult }) {
  const [formData, setFormData] = useState({
    target_name: '',
    max_length: 200,
    max_cysteines: 5,
    functional_constraint: '',
    additional_constraints: '',
  })

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit(formData)
  }

  return (
    <div className="design-form-container">
      <div className="form-card">
        <h2>Design Your Therapeutic Protein</h2>
        <p className="form-description">
          Specify your target protein and constraints. Our AI will generate an
          optimized sequence with guaranteed expressibility.
        </p>

        <form onSubmit={handleSubmit} className="design-form">
          <div className="form-group">
            <label htmlFor="target_name">Target Name *</label>
            <input
              type="text"
              id="target_name"
              name="target_name"
              value={formData.target_name}
              onChange={handleChange}
              required
              placeholder="e.g., Anti-TNF-alpha Antibody"
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="max_length">Max Length (amino acids)</label>
              <input
                type="number"
                id="max_length"
                name="max_length"
                value={formData.max_length}
                onChange={handleChange}
                min="50"
                max="500"
              />
            </div>

            <div className="form-group">
              <label htmlFor="max_cysteines">Max Cysteines</label>
              <input
                type="number"
                id="max_cysteines"
                name="max_cysteines"
                value={formData.max_cysteines}
                onChange={handleChange}
                min="0"
                max="20"
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="functional_constraint">Functional Constraint</label>
            <textarea
              id="functional_constraint"
              name="functional_constraint"
              value={formData.functional_constraint}
              onChange={handleChange}
              rows="3"
              placeholder="e.g., Must bind to receptor X with high affinity"
            />
          </div>

          <div className="form-group">
            <label htmlFor="additional_constraints">Additional Constraints</label>
            <textarea
              id="additional_constraints"
              name="additional_constraints"
              value={formData.additional_constraints}
              onChange={handleChange}
              rows="2"
              placeholder="e.g., Reduce immunogenicity, optimize for stability"
            />
          </div>

          <div className="form-actions">
            <button type="submit" className="btn-primary" disabled={isLoading}>
              {isLoading ? 'Generating...' : 'Generate Protein'}
            </button>
            {hasResult && (
              <button
                type="button"
                className="btn-secondary"
                onClick={onRefine}
              >
                Refine Design
              </button>
            )}
          </div>
        </form>
      </div>

      <div className="info-card">
        <h3>How It Works</h3>
        <ul>
          <li>
            <strong>Generative Design:</strong> Our RL-based AI generates novel
            protein sequences optimized for your constraints
          </li>
          <li>
            <strong>Expressibility Oracle:</strong> Every design is validated
            for stability and manufacturability using our GNN model
          </li>
          <li>
            <strong>Cost Optimization:</strong> Unstable designs automatically
            receive cost penalties, guiding the AI toward viable solutions
          </li>
          <li>
            <strong>Interactive Refinement:</strong> Use natural language to
            refine your designs with our LLM agent
          </li>
        </ul>
      </div>
    </div>
  )
}

export default ProteinDesignForm


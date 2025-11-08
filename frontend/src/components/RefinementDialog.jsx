import React, { useState } from 'react'
import './RefinementDialog.css'

function RefinementDialog({ currentSequence, onRefine, onClose }) {
  const [refinementPrompt, setRefinementPrompt] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    if (refinementPrompt.trim()) {
      onRefine(refinementPrompt)
      setRefinementPrompt('')
    }
  }

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  return (
    <div className="dialog-overlay" onClick={handleOverlayClick} onKeyDown={(e) => { if (e.key === 'Escape') onClose() }} role="dialog" tabIndex={-1}>
      <div className="dialog-content" onClick={(e) => e.stopPropagation()}>
        <div className="dialog-header">
          <h2>Refine Protein Design</h2>
          <button className="close-button" onClick={onClose} aria-label="Close dialog">
            ×
          </button>
        </div>

        <div className="dialog-body">
          <p className="dialog-description">
            Use natural language to refine your protein design. Our LLM agent
            will analyze your request and suggest improvements.
          </p>

          <div className="current-sequence">
            <label htmlFor="sequence-display">Current Sequence:</label>
            <div id="sequence-display" className="sequence-display">{currentSequence}</div>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="refinement-prompt">Refinement Request:</label>
              <textarea
                id="refinement-prompt"
                value={refinementPrompt}
                onChange={(e) => setRefinementPrompt(e.target.value)}
                placeholder="e.g., Reduce predicted immunogenicity by 20%, Optimize for higher stability, Reduce cysteine content"
                rows="4"
                required
              />
            </div>

            <div className="example-prompts">
              <p>Example prompts:</p>
            <ul>
              <li>"Reduce predicted immunogenicity by 20%"</li>
              <li>"Optimize for higher stability"</li>
              <li>"Reduce cysteine content to minimize disulfide bond issues"</li>
              <li>"Increase predicted yield by improving expressibility"</li>
            </ul>
          </div>

            <div className="dialog-actions">
              <button type="button" className="btn-cancel" onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className="btn-refine">
                Refine Design
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default RefinementDialog


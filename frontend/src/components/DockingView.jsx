import React, { useState, useEffect } from 'react';
import { FlaskConical, Upload, Play, Download, AlertCircle, CheckCircle2 } from 'lucide-react';
import './DockingView.css';

const API_URL = 'http://localhost:8000';

function DockingView() {
  const [proteinPdb, setProteinPdb] = useState('');
  const [ligandInput, setLigandInput] = useState('');
  const [ligandType, setLigandType] = useState('smiles'); // smiles, mol2, pdb
  const [selectedTool, setSelectedTool] = useState('vina');
  const [availableTools, setAvailableTools] = useState({});
  const [dockingParams, setDockingParams] = useState({
    center: [0, 0, 0],
    size: [20, 20, 20],
    exhaustiveness: 8,
    num_modes: 9
  });
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchAvailableTools();
  }, []);

  const fetchAvailableTools = async () => {
    try {
      const response = await fetch(`${API_URL}/docking_tools`);
      const data = await response.json();
      setAvailableTools(data);
    } catch (err) {
      console.error('Failed to fetch docking tools:', err);
    }
  };

  const handleFileUpload = (event, type) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (type === 'protein') {
          setProteinPdb(e.target.result);
        } else {
          setLigandInput(e.target.result);
          setLigandType(type === 'ligand' ? 'pdb' : type);
        }
      };
      reader.readAsText(file);
    }
  };

  const handleDocking = async () => {
    if (!proteinPdb.trim()) {
      setError('Please provide a protein structure (PDB format)');
      return;
    }

    if (!ligandInput.trim()) {
      setError('Please provide a ligand structure');
      return;
    }

    setLoading(true);
    setError(null);
    setResults(null);

    try {
      const requestBody = {
        protein_pdb: proteinPdb,
        tool: selectedTool,
        exhaustiveness: dockingParams.exhaustiveness,
        num_modes: dockingParams.num_modes,
        center: dockingParams.center,
        size: dockingParams.size
      };

      // Add ligand based on type
      if (ligandType === 'smiles') {
        requestBody.ligand_smiles = ligandInput;
      } else if (ligandType === 'mol2') {
        requestBody.ligand_mol2 = ligandInput;
      } else {
        requestBody.ligand_pdb = ligandInput;
      }

      const response = await fetch(`${API_URL}/dock_ligand`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error(`Docking failed: ${response.statusText}`);
      }

      const data = await response.json();
      setResults(data);
    } catch (err) {
      setError(err.message);
      console.error('Docking error:', err);
    } finally {
      setLoading(false);
    }
  };

  const downloadResults = () => {
    if (!results) return;
    
    const dataStr = JSON.stringify(results, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `docking_results_${Date.now()}.json`;
    link.click();
  };

  return (
    <div className="docking-view">
      <div className="docking-header">
        <FlaskConical className="w-6 h-6" />
        <h2>Molecular Docking</h2>
        <p className="text-sm text-gray-600">Simulate protein-ligand interactions for drug discovery</p>
      </div>

      <div className="docking-container">
        {/* Input Section */}
        <div className="docking-input-section">
          <div className="input-group">
            <label>
              <Upload className="w-4 h-4" />
              Protein Structure (PDB)
            </label>
            <textarea
              value={proteinPdb}
              onChange={(e) => setProteinPdb(e.target.value)}
              placeholder="Paste PDB content or upload file..."
              rows={8}
              className="pdb-textarea"
            />
            <input
              type="file"
              accept=".pdb"
              onChange={(e) => handleFileUpload(e, 'protein')}
              className="file-input"
            />
          </div>

          <div className="input-group">
            <label>
              <FlaskConical className="w-4 h-4" />
              Ligand Structure
            </label>
            <div className="ligand-type-selector">
              <button
                onClick={() => setLigandType('smiles')}
                className={ligandType === 'smiles' ? 'active' : ''}
              >
                SMILES
              </button>
              <button
                onClick={() => setLigandType('mol2')}
                className={ligandType === 'mol2' ? 'active' : ''}
              >
                MOL2
              </button>
              <button
                onClick={() => setLigandType('pdb')}
                className={ligandType === 'pdb' ? 'active' : ''}
              >
                PDB
              </button>
            </div>
            <textarea
              value={ligandInput}
              onChange={(e) => setLigandInput(e.target.value)}
              placeholder={`Paste ${ligandType.toUpperCase()} content or upload file...`}
              rows={6}
              className="ligand-textarea"
            />
            <input
              type="file"
              accept={ligandType === 'smiles' ? '.smi,.txt' : ligandType === 'mol2' ? '.mol2' : '.pdb'}
              onChange={(e) => handleFileUpload(e, ligandType)}
              className="file-input"
            />
          </div>
        </div>

        {/* Configuration Section */}
        <div className="docking-config-section">
          <h3>Docking Configuration</h3>
          
          <div className="config-group">
            <label>Docking Tool</label>
            <select
              value={selectedTool}
              onChange={(e) => setSelectedTool(e.target.value)}
              className="tool-select"
            >
              <option value="vina">AutoDock Vina (Fast, Accurate)</option>
              <option value="diffdock">DiffDock (AI-based, Very Fast)</option>
              <option value="swissdock">SwissDock (Web Server)</option>
              <option value="rdock">rDock (Fragment-based)</option>
            </select>
            {availableTools.local_tools?.[selectedTool] && (
              <div className="tool-info">
                <span className={availableTools.local_tools[selectedTool].available ? 'available' : 'unavailable'}>
                  {availableTools.local_tools[selectedTool].available ? '✓ Available' : '⚠ Not Installed'}
                </span>
                <span className="tool-speed">{availableTools.local_tools[selectedTool].speed}</span>
              </div>
            )}
          </div>

          <div className="config-row">
            <div className="config-item">
              <label>Search Space Center (X, Y, Z)</label>
              <div className="coord-inputs">
                <input
                  type="number"
                  value={dockingParams.center[0]}
                  onChange={(e) => setDockingParams({
                    ...dockingParams,
                    center: [parseFloat(e.target.value) || 0, dockingParams.center[1], dockingParams.center[2]]
                  })}
                  step="0.1"
                />
                <input
                  type="number"
                  value={dockingParams.center[1]}
                  onChange={(e) => setDockingParams({
                    ...dockingParams,
                    center: [dockingParams.center[0], parseFloat(e.target.value) || 0, dockingParams.center[2]]
                  })}
                  step="0.1"
                />
                <input
                  type="number"
                  value={dockingParams.center[2]}
                  onChange={(e) => setDockingParams({
                    ...dockingParams,
                    center: [dockingParams.center[0], dockingParams.center[1], parseFloat(e.target.value) || 0]
                  })}
                  step="0.1"
                />
              </div>
            </div>

            <div className="config-item">
              <label>Search Space Size (X, Y, Z)</label>
              <div className="coord-inputs">
                <input
                  type="number"
                  value={dockingParams.size[0]}
                  onChange={(e) => setDockingParams({
                    ...dockingParams,
                    size: [parseFloat(e.target.value) || 20, dockingParams.size[1], dockingParams.size[2]]
                  })}
                  step="1"
                />
                <input
                  type="number"
                  value={dockingParams.size[1]}
                  onChange={(e) => setDockingParams({
                    ...dockingParams,
                    size: [dockingParams.size[0], parseFloat(e.target.value) || 20, dockingParams.size[2]]
                  })}
                  step="1"
                />
                <input
                  type="number"
                  value={dockingParams.size[2]}
                  onChange={(e) => setDockingParams({
                    ...dockingParams,
                    size: [dockingParams.size[0], dockingParams.size[1], parseFloat(e.target.value) || 20]
                  })}
                  step="1"
                />
              </div>
            </div>
          </div>

          <div className="config-row">
            <div className="config-item">
              <label>Exhaustiveness</label>
              <input
                type="number"
                value={dockingParams.exhaustiveness}
                onChange={(e) => setDockingParams({
                  ...dockingParams,
                  exhaustiveness: parseInt(e.target.value) || 8
                })}
                min="1"
                max="32"
              />
            </div>

            <div className="config-item">
              <label>Number of Modes</label>
              <input
                type="number"
                value={dockingParams.num_modes}
                onChange={(e) => setDockingParams({
                  ...dockingParams,
                  num_modes: parseInt(e.target.value) || 9
                })}
                min="1"
                max="20"
              />
            </div>
          </div>

          <button
            onClick={handleDocking}
            disabled={loading || !proteinPdb || !ligandInput}
            className="dock-button"
          >
            {loading ? (
              <>
                <div className="spinner" />
                Running Docking...
              </>
            ) : (
              <>
                <Play className="w-4 h-4" />
                Run Docking
              </>
            )}
          </button>
        </div>

        {/* Results Section */}
        {error && (
          <div className="error-message">
            <AlertCircle className="w-5 h-5" />
            <span>{error}</span>
          </div>
        )}

        {results && (
          <div className="docking-results">
            <div className="results-header">
              <h3>
                <CheckCircle2 className="w-5 h-5 text-green-500" />
                Docking Results
              </h3>
              <button onClick={downloadResults} className="download-button">
                <Download className="w-4 h-4" />
                Download Results
              </button>
            </div>

            {results.status === 'error' && (
              <div className="error-message">
                <AlertCircle className="w-5 h-5" />
                <span>{results.error || results.message}</span>
              </div>
            )}

            {results.status === 'success' && (
              <>
                <div className="results-summary">
                  <div className="summary-item">
                    <span className="label">Best Affinity:</span>
                    <span className="value">{results.best_affinity?.toFixed(2)} kcal/mol</span>
                  </div>
                  <div className="summary-item">
                    <span className="label">Number of Poses:</span>
                    <span className="value">{results.num_poses || results.poses?.length}</span>
                  </div>
                  <div className="summary-item">
                    <span className="label">Tool Used:</span>
                    <span className="value">{results.tool.toUpperCase()}</span>
                  </div>
                </div>

                <div className="poses-table">
                  <table>
                    <thead>
                      <tr>
                        <th>Mode</th>
                        <th>Affinity (kcal/mol)</th>
                        <th>RMSD Lower</th>
                        <th>RMSD Upper</th>
                      </tr>
                    </thead>
                    <tbody>
                      {results.poses?.map((pose, index) => (
                        <tr key={index}>
                          <td>{pose.mode}</td>
                          <td className={pose.affinity < -7 ? 'strong-binding' : ''}>
                            {pose.affinity?.toFixed(2)}
                          </td>
                          <td>{pose.rmsd_lower?.toFixed(2) || 'N/A'}</td>
                          <td>{pose.rmsd_upper?.toFixed(2) || 'N/A'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {results.message && (
                  <div className="info-message">
                    <span>{results.message}</span>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default DockingView;


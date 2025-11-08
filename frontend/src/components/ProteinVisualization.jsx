import React, { useRef, useEffect } from 'react'
import * as THREE from 'three'
import './ProteinVisualization.css'

function ProteinVisualization({ sequence, oracleResults }) {
  const mountRef = useRef(null)
  const sceneRef = useRef(null)

  useEffect(() => {
    if (!mountRef.current) return

    // Create scene
    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x1a1a2e)
    sceneRef.current = scene

    // Create camera
    const camera = new THREE.PerspectiveCamera(
      75,
      mountRef.current.clientWidth / mountRef.current.clientHeight,
      0.1,
      1000
    )
    camera.position.set(0, 0, 50)

    // Create renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight)
    mountRef.current.appendChild(renderer.domElement)

    // Add lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6)
    scene.add(ambientLight)

    const directionalLight1 = new THREE.DirectionalLight(0xffffff, 0.8)
    directionalLight1.position.set(10, 10, 10)
    scene.add(directionalLight1)

    const directionalLight2 = new THREE.DirectionalLight(0xffffff, 0.4)
    directionalLight2.position.set(-10, -10, -10)
    scene.add(directionalLight2)

    // Generate protein structure visualization
    // In production, this would load from a PDB file or use AlphaFold API
    const proteinGeometry = generateProteinStructure(sequence)
    scene.add(proteinGeometry)

    // Add controls for rotation
    let mouseDown = false
    let mouseX = 0
    let mouseY = 0

    const onMouseDown = (event) => {
      mouseDown = true
      mouseX = event.clientX
      mouseY = event.clientY
    }

    const onMouseUp = () => {
      mouseDown = false
    }

    const onMouseMove = (event) => {
      if (!mouseDown) return

      const deltaX = event.clientX - mouseX
      const deltaY = event.clientY - mouseY

      proteinGeometry.rotation.y += deltaX * 0.01
      proteinGeometry.rotation.x += deltaY * 0.01

      mouseX = event.clientX
      mouseY = event.clientY
    }

    renderer.domElement.addEventListener('mousedown', onMouseDown)
    renderer.domElement.addEventListener('mouseup', onMouseUp)
    renderer.domElement.addEventListener('mousemove', onMouseMove)

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate)
      renderer.render(scene, camera)
    }
    animate()

    // Handle resize
    const handleResize = () => {
      if (!mountRef.current) return
      camera.aspect = mountRef.current.clientWidth / mountRef.current.clientHeight
      camera.updateProjectionMatrix()
      renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight)
    }
    window.addEventListener('resize', handleResize)

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize)
      renderer.domElement.removeEventListener('mousedown', onMouseDown)
      renderer.domElement.removeEventListener('mouseup', onMouseUp)
      renderer.domElement.removeEventListener('mousemove', onMouseMove)
      if (mountRef.current && renderer.domElement.parentNode) {
        renderer.domElement.remove()
      }
      renderer.dispose()
    }
  }, [sequence])

  // Generate a simplified protein structure visualization
  const generateProteinStructure = (sequence) => {
    const group = new THREE.Group()

    // Color mapping for amino acids
    const aminoAcidColors = {
      A: 0x8b4513, // Brown
      C: 0xffff00, // Yellow
      D: 0xff0000, // Red
      E: 0xff0000, // Red
      F: 0x0000ff, // Blue
      G: 0x808080, // Gray
      H: 0x00ffff, // Cyan
      I: 0x8b4513, // Brown
      K: 0x0000ff, // Blue
      L: 0x8b4513, // Brown
      M: 0x8b4513, // Brown
      N: 0xff00ff, // Magenta
      P: 0xffff00, // Yellow
      Q: 0xff00ff, // Magenta
      R: 0x0000ff, // Blue
      S: 0xffa500, // Orange
      T: 0xffa500, // Orange
      V: 0x8b4513, // Brown
      W: 0x0000ff, // Blue
      Y: 0x00ffff, // Cyan
    }

    // Create a simplified alpha helix representation
    const radius = 2
    const rise = 1.5 // Angstroms per residue

    for (let i = 0; i < sequence.length; i++) {
      const angle = (i / 3.6) * Math.PI * 2
      const x = Math.cos(angle) * radius
      const y = (i * rise) - (sequence.length * rise) / 2
      const z = Math.sin(angle) * radius

      // Create sphere for each amino acid
      const geometry = new THREE.SphereGeometry(0.8, 16, 16)
      const color = aminoAcidColors[sequence[i]] || 0xffffff
      const material = new THREE.MeshPhongMaterial({ color })
      const sphere = new THREE.Mesh(geometry, material)
      sphere.position.set(x, y, z)
      group.add(sphere)

      // Add connections between adjacent residues
      if (i > 0) {
        const prevAngle = ((i - 1) / 3.6) * Math.PI * 2
        const prevX = Math.cos(prevAngle) * radius
        const prevY = ((i - 1) * rise) - (sequence.length * rise) / 2
        const prevZ = Math.sin(prevAngle) * radius

        const lineGeometry = new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(prevX, prevY, prevZ),
          new THREE.Vector3(x, y, z),
        ])
        const lineMaterial = new THREE.LineBasicMaterial({ color: 0x888888 })
        const line = new THREE.Line(lineGeometry, lineMaterial)
        group.add(line)
      }
    }

    return group
  }

  return (
    <div className="visualization-container">
      <div className="visualization-header">
        <h2>3D Protein Structure</h2>
        <p className="visualization-hint">
          Click and drag to rotate • Scroll to zoom
        </p>
      </div>

      <div className="visualization-wrapper">
        <div ref={mountRef} className="protein-viewer" />

        <div className="structure-info">
          <h3>Structure Properties</h3>
          <div className="info-grid">
            <div className="info-item">
              <span className="info-label">Sequence Length:</span>
              <span className="info-value">{sequence.length} aa</span>
            </div>
            <div className="info-item">
              <span className="info-label">Stability Score:</span>
              <span className="info-value">{oracleResults.stability_score}/100</span>
            </div>
            <div className="info-item">
              <span className="info-label">Instability Index:</span>
              <span className="info-value">{oracleResults.instability_index}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Structure Type:</span>
              <span className="info-value">Alpha Helix (Predicted)</span>
            </div>
          </div>

          <div className="color-legend">
            <h4>Color Legend</h4>
            <div className="legend-items">
              <div className="legend-item">
                <span className="legend-color" style={{ background: '#8b4513' }}></span>
                <span>Hydrophobic (A, I, L, M, V)</span>
              </div>
              <div className="legend-item">
                <span className="legend-color" style={{ background: '#ff0000' }}></span>
                <span>Acidic (D, E)</span>
              </div>
              <div className="legend-item">
                <span className="legend-color" style={{ background: '#0000ff' }}></span>
                <span>Basic (K, R, H)</span>
              </div>
              <div className="legend-item">
                <span className="legend-color" style={{ background: '#ffff00' }}></span>
                <span>Special (C, P)</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="note">
        <p>
          <strong>Note:</strong> This is a simplified visualization. In production,
          the structure would be predicted using AlphaFold/ESMFold API and displayed
          with full atomic detail.
        </p>
      </div>
    </div>
  )
}

export default ProteinVisualization


import React, { useRef, useEffect } from 'react'
import * as THREE from 'three'
import './ManufacturingView.css'

function ManufacturingView({ protocol, oracleResults }) {
  const mountRef = useRef(null)
  const sceneRef = useRef(null)

  useEffect(() => {
    if (!mountRef.current) return

    // Create scene
    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x0a1929)
    sceneRef.current = scene

    // Create camera
    const camera = new THREE.PerspectiveCamera(
      75,
      mountRef.current.clientWidth / mountRef.current.clientHeight,
      0.1,
      1000
    )
    camera.position.set(0, 0, 30)

    // Create renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight)
    mountRef.current.appendChild(renderer.domElement)

    // Add lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5)
    scene.add(ambientLight)

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8)
    directionalLight.position.set(10, 10, 10)
    scene.add(directionalLight)

    // Create E. coli cell visualization
    const cellGroup = createEColiCell(protocol.host_cell.toLowerCase().includes('e. coli'))
    scene.add(cellGroup)

    // Add rotation
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
      cellGroup.rotation.y += deltaX * 0.01
      cellGroup.rotation.x += deltaY * 0.01
      mouseX = event.clientX
      mouseY = event.clientY
    }

    renderer.domElement.addEventListener('mousedown', onMouseDown)
    renderer.domElement.addEventListener('mouseup', onMouseUp)
    renderer.domElement.addEventListener('mousemove', onMouseMove)

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate)
      cellGroup.rotation.y += 0.002
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
  }, [protocol.host_cell])

  const createEColiCell = (isEcoli) => {
    const group = new THREE.Group()

    // Cell wall (outer membrane)
    const cellGeometry = new THREE.SphereGeometry(8, 32, 32)
    const cellMaterial = new THREE.MeshPhongMaterial({
      color: isEcoli ? 0x4a90e2 : 0x8b4513,
      transparent: true,
      opacity: 0.3,
      side: THREE.DoubleSide,
    })
    const cellWall = new THREE.Mesh(cellGeometry, cellMaterial)
    group.add(cellWall)

    // Inner membrane
    const innerGeometry = new THREE.SphereGeometry(7.5, 32, 32)
    const innerMaterial = new THREE.MeshPhongMaterial({
      color: 0x2c5aa0,
      transparent: true,
      opacity: 0.2,
    })
    const innerMembrane = new THREE.Mesh(innerGeometry, innerMaterial)
    group.add(innerMembrane)

    // Cytoplasm (inner volume)
    const cytoGeometry = new THREE.SphereGeometry(7, 32, 32)
    const cytoMaterial = new THREE.MeshPhongMaterial({
      color: 0xfff8dc,
      transparent: true,
      opacity: 0.4,
    })
    const cytoplasm = new THREE.Mesh(cytoGeometry, cytoMaterial)
    group.add(cytoplasm)

    // Ribosomes (protein synthesis sites) - glowing points
    for (let i = 0; i < 20; i++) {
      const riboGeometry = new THREE.SphereGeometry(0.2, 8, 8)
      const riboMaterial = new THREE.MeshPhongMaterial({
        color: 0xffd700,
        emissive: 0xffd700,
        emissiveIntensity: 0.5,
      })
      const ribosome = new THREE.Mesh(riboGeometry, riboMaterial)

      // Random position inside cell
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(2 * Math.random() - 1)
      const r = 5 + Math.random() * 2
      ribosome.position.set(
        r * Math.sin(phi) * Math.cos(theta),
        r * Math.sin(phi) * Math.sin(theta),
        r * Math.cos(phi)
      )

      group.add(ribosome)
    }

    // Protein expression site (highlighted area)
    const expressionGeometry = new THREE.SphereGeometry(1.5, 16, 16)
    const expressionMaterial = new THREE.MeshPhongMaterial({
      color: 0xff4444,
      emissive: 0xff0000,
      emissiveIntensity: 0.8,
      transparent: true,
      opacity: 0.7,
    })
    const expressionSite = new THREE.Mesh(expressionGeometry, expressionMaterial)
    expressionSite.position.set(4, 2, 3)
    group.add(expressionSite)

    // Add pulsing animation to expression site
    let pulse = 0
    const pulseAnimation = () => {
      pulse += 0.05
      expressionSite.scale.set(
        1 + Math.sin(pulse) * 0.2,
        1 + Math.sin(pulse) * 0.2,
        1 + Math.sin(pulse) * 0.2
      )
      requestAnimationFrame(pulseAnimation)
    }
    pulseAnimation()

    return group
  }

  return (
    <div className="manufacturing-container">
      <div className="manufacturing-header">
        <h2>Manufacturing Protocol</h2>
        <p>Industrial production recipe for your protein design</p>
      </div>

      <div className="manufacturing-wrapper">
        <div className="protocol-card">
          <h3>Production Details</h3>
          <div className="protocol-details">
            <div className="detail-item">
              <span className="detail-label">Host Cell:</span>
              <span className="detail-value">{protocol.host_cell}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Expression System:</span>
              <span className="detail-value">{protocol.expression_system}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Optimal Temperature:</span>
              <span className="detail-value">{protocol.optimal_temperature}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Culture Time:</span>
              <span className="detail-value">{protocol.culture_time}</span>
            </div>
            <div className="detail-item highlight">
              <span className="detail-label">Predicted Yield:</span>
              <span className="detail-value">{protocol.predicted_yield} g/L</span>
            </div>
            <div className="detail-item highlight">
              <span className="detail-label">Cost per Gram:</span>
              <span className="detail-value">${protocol.cost_per_gram}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Total Cost (1 kg):</span>
              <span className="detail-value">${protocol.total_production_cost_1kg}</span>
            </div>
          </div>

          <div className="protocol-steps">
            <h3>Production Protocol</h3>
            <ol>
              {protocol.protocol_steps.map((step, idx) => (
                <li key={`step-${idx}`}>{step}</li>
              ))}
            </ol>
          </div>
        </div>

        <div className="cell-visualization-card">
          <h3>Host Organism View</h3>
          <div ref={mountRef} className="cell-viewer" />
          <p className="cell-description">
            Visualization of {protocol.host_cell} showing protein expression
            sites (glowing red areas). The highlighted region indicates where
            your designed protein will be synthesized.
          </p>
        </div>
      </div>

      <div className="oracle-results">
        <h3>Expressibility Oracle Results</h3>
        <div className="oracle-grid">
          <div className="oracle-item">
            <span className="oracle-label">Stability Score</span>
            <span className="oracle-value">{oracleResults.stability_score}/100</span>
          </div>
          <div className="oracle-item">
            <span className="oracle-label">Instability Index</span>
            <span className="oracle-value">{oracleResults.instability_index}</span>
          </div>
          <div className="oracle-item">
            <span className="oracle-label">Cost Penalty</span>
            <span className="oracle-value">${oracleResults.cost_penalty}</span>
          </div>
          <div className="oracle-item">
            <span className="oracle-label">Status</span>
            <span
              className={`oracle-status ${
                oracleResults.is_stable ? 'stable' : 'unstable'
              }`}
            >
              {oracleResults.is_stable ? '✓ Stable' : '⚠ Unstable'}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ManufacturingView


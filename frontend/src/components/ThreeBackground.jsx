import { useEffect, useRef } from 'react'
import * as THREE from 'three'

export default function ThreeBackground() {
  const containerRef = useRef(null)
  const mouseRef = useRef({ x: 0, y: 0 })
  const rendererRef = useRef(null)
  const frameRef = useRef(null)

  useEffect(() => {
    if (!containerRef.current) return

    const container = containerRef.current
    const scene = new THREE.Scene()
    scene.fog = new THREE.FogExp2(0x0a0e1a, 0.02)

    const camera = new THREE.PerspectiveCamera(75, container.clientWidth / container.clientHeight, 0.1, 1000)
    camera.position.z = 30

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true })
    renderer.setSize(container.clientWidth, container.clientHeight)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setClearColor(0x0a0e1a, 1)
    rendererRef.current = renderer
    container.appendChild(renderer.domElement)

    // Create floating particles
    const particlesGeometry = new THREE.BufferGeometry()
    const particlesCount = 800
    const posArray = new Float32Array(particlesCount * 3)
    const colorArray = new Float32Array(particlesCount * 3)

    for (let i = 0; i < particlesCount * 3; i += 3) {
      posArray[i] = (Math.random() - 0.5) * 80
      posArray[i + 1] = (Math.random() - 0.5) * 80
      posArray[i + 2] = (Math.random() - 0.5) * 60

      const isBlue = Math.random() > 0.5
      colorArray[i] = isBlue ? 0.04 : 0.02
      colorArray[i + 1] = isBlue ? 0.41 : 0.08
      colorArray[i + 2] = isBlue ? 1.0 : 0.2
    }

    particlesGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3))
    particlesGeometry.setAttribute('color', new THREE.BufferAttribute(colorArray, 3))

    const particlesMaterial = new THREE.PointsMaterial({
      size: 0.15,
      vertexColors: true,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending,
    })

    const particlesMesh = new THREE.Points(particlesGeometry, particlesMaterial)
    scene.add(particlesMesh)

    // Create wireframe geometric shapes
    const geometries = []
    const shapes = [
      new THREE.IcosahedronGeometry(4, 0),
      new THREE.OctahedronGeometry(3, 0),
      new THREE.TetrahedronGeometry(2.5, 0),
      new THREE.TorusGeometry(3, 0.5, 16, 100),
    ]

    shapes.forEach((geo, idx) => {
      const wireframe = new THREE.WireframeGeometry(geo)
      const line = new THREE.LineSegments(
        wireframe,
        new THREE.LineBasicMaterial({
          color: idx % 2 === 0 ? 0x0b69ff : 0x5ee7ff,
          transparent: true,
          opacity: 0.15,
        })
      )
      line.position.set(
        (Math.random() - 0.5) * 50,
        (Math.random() - 0.5) * 40,
        (Math.random() - 0.5) * 30 - 10
      )
      line.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0)
      scene.add(line)
      geometries.push(line)
    })

    // Mouse interaction
    const handleMouseMove = (e) => {
      mouseRef.current.x = (e.clientX / window.innerWidth) * 2 - 1
      mouseRef.current.y = -(e.clientY / window.innerHeight) * 2 + 1
    }
    window.addEventListener('mousemove', handleMouseMove)

    // Resize handler
    const handleResize = () => {
      if (!container) return
      camera.aspect = container.clientWidth / container.clientHeight
      camera.updateProjectionMatrix()
      renderer.setSize(container.clientWidth, container.clientHeight)
    }
    window.addEventListener('resize', handleResize)

    // Animation loop
    const animate = () => {
      frameRef.current = requestAnimationFrame(animate)

      particlesMesh.rotation.y += 0.0003
      particlesMesh.rotation.x += 0.0001

      geometries.forEach((geo, i) => {
        geo.rotation.x += 0.002 * (i + 1) * 0.3
        geo.rotation.y += 0.003 * (i + 1) * 0.3
        geo.position.y += Math.sin(Date.now() * 0.001 + i) * 0.01
      })

      camera.position.x += (mouseRef.current.x * 2 - camera.position.x) * 0.02
      camera.position.y += (mouseRef.current.y * 2 - camera.position.y) * 0.02
      camera.lookAt(scene.position)

      renderer.render(scene, camera)
    }
    animate()

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('resize', handleResize)
      if (frameRef.current) cancelAnimationFrame(frameRef.current)
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement)
      }
      renderer.dispose()
    }
  }, [])

  return (
    <div
      ref={containerRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 0,
        pointerEvents: 'none',
      }}
    />
  )
}

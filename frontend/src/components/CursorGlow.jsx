import { useEffect, useRef } from 'react'

export default function CursorGlow() {
  const glowRef = useRef(null)
  const dotRef = useRef(null)

  useEffect(() => {
    const glow = glowRef.current
    const dot = dotRef.current
    if (!glow || !dot) return

    let x = 0, y = 0, targetX = 0, targetY = 0

    const handleMouseMove = (e) => {
      targetX = e.clientX
      targetY = e.clientY
    }

    const animate = () => {
      x += (targetX - x) * 0.1
      y += (targetY - y) * 0.1

      glow.style.transform = `translate(${x - 150}px, ${y - 150}px)`
      dot.style.transform = `translate(${targetX - 4}px, ${targetY - 4}px)`

      requestAnimationFrame(animate)
    }

    window.addEventListener('mousemove', handleMouseMove)
    animate()

    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  return (
    <>
      <div
        ref={glowRef}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: 300,
          height: 300,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(11,105,255,0.15) 0%, transparent 70%)',
          pointerEvents: 'none',
          zIndex: 9998,
          transition: 'none',
        }}
      />
      <div
        ref={dotRef}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: 8,
          height: 8,
          borderRadius: '50%',
          background: '#0b69ff',
          pointerEvents: 'none',
          zIndex: 9999,
          boxShadow: '0 0 10px rgba(11,105,255,0.8)',
        }}
      />
    </>
  )
}

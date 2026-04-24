import React, { Suspense, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Environment, ContactShadows, PerspectiveCamera, SpotLight } from '@react-three/drei'
import { Chair } from './Chair'
import { Table } from './Table'
import { Projector } from './Projector'
import { Screen } from './Screen'

function AnimatedFire() {
  const ref = useRef()
  useFrame((state) => {
    if (ref.current) {
      ref.current.intensity = 1.5 + Math.sin(state.clock.elapsedTime * 8) * 0.5
      ref.current.position.y = 0.8 + Math.sin(state.clock.elapsedTime * 12) * 0.05
    }
  })
  return (
    <pointLight
      ref={ref}
      position={[-2.5, 0.8, 0]}
      intensity={1.5}
      color="#ff6b35"
      castShadow
      shadow-mapSize-width={1024}
      shadow-mapSize-height={1024}
    />
  )
}

function AnimatedFireGlow() {
  const ref = useRef()
  useFrame((state) => {
    if (ref.current) {
      ref.current.material.emissiveIntensity = 2 + Math.sin(state.clock.elapsedTime * 10) * 0.8
      ref.current.scale.setScalar(1 + Math.sin(state.clock.elapsedTime * 6) * 0.1)
    }
  })
  return (
    <mesh ref={ref} position={[-2.5, 0.8, 0]}>
      <sphereGeometry args={[0.3, 16, 16]} />
      <meshStandardMaterial
        color="#ff6b35"
        emissive="#ff6b35"
        emissiveIntensity={2}
        transparent
        opacity={0.9}
      />
    </mesh>
  )
}

function PulsingCeilingLight() {
  const ref = useRef()
  useFrame((state) => {
    if (ref.current) {
      ref.current.intensity = 0.6 + Math.sin(state.clock.elapsedTime * 1.5) * 0.15
    }
  })
  return (
    <pointLight
      ref={ref}
      position={[0, 4.5, 0]}
      intensity={0.6}
      color="#ffd4a3"
      castShadow
      shadow-mapSize-width={1024}
      shadow-mapSize-height={1024}
    />
  )
}

function CabinInterior() {
  return (
    <group>
      {/* Floor - Wood planks effect */}
      <mesh receiveShadow position={[0, -0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[6, 6]} />
        <meshStandardMaterial
          color="#8b6f47"
          roughness={0.8}
          metalness={0.1}
        />
      </mesh>

      {/* Back Wall - Wood paneling */}
      <mesh receiveShadow position={[0, 2.5, -3]}>
        <planeGeometry args={[6, 5]} />
        <meshStandardMaterial
          color="#a0826d"
          roughness={0.7}
          metalness={0.1}
        />
      </mesh>

      {/* Front Wall - Wood paneling with opening */}
      <mesh receiveShadow position={[0, 2.5, 3]}>
        <planeGeometry args={[6, 5]} />
        <meshStandardMaterial
          color="#a0826d"
          roughness={0.7}
          metalness={0.1}
        />
      </mesh>

      {/* Left Wall - Wood paneling */}
      <mesh receiveShadow position={[-3, 2.5, 0]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[6, 5]} />
        <meshStandardMaterial
          color="#a0826d"
          roughness={0.7}
          metalness={0.1}
        />
      </mesh>

      {/* Right Wall - Wood paneling */}
      <mesh receiveShadow position={[3, 2.5, 0]} rotation={[0, -Math.PI / 2, 0]}>
        <planeGeometry args={[6, 5]} />
        <meshStandardMaterial
          color="#a0826d"
          roughness={0.7}
          metalness={0.1}
        />
      </mesh>

      {/* Ceiling - Wood beams */}
      <mesh position={[0, 5, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[6, 6]} />
        <meshStandardMaterial
          color="#b8956f"
          roughness={0.6}
          metalness={0.1}
        />
      </mesh>

      {/* Ceiling Beams */}
      <mesh position={[0, 4.8, 0]}>
        <boxGeometry args={[0.3, 0.4, 6]} />
        <meshStandardMaterial
          color="#8b6f47"
          roughness={0.8}
          metalness={0.1}
        />
      </mesh>

      <mesh position={[0, 4.8, 0]} rotation={[0, Math.PI / 2, 0]}>
        <boxGeometry args={[0.3, 0.4, 6]} />
        <meshStandardMaterial
          color="#8b6f47"
          roughness={0.8}
          metalness={0.1}
        />
      </mesh>

      {/* Window on back wall */}
      <mesh position={[0, 3, -2.99]}>
        <planeGeometry args={[2, 1.5]} />
        <meshStandardMaterial
          color="#87ceeb"
          roughness={0.1}
          metalness={0.1}
          opacity={0.8}
          transparent={true}
        />
      </mesh>

      {/* Window Frame */}
      <mesh position={[0, 3, -2.98]}>
        <boxGeometry args={[2.1, 1.6, 0.05]} />
        <meshStandardMaterial
          color="#654321"
          roughness={0.5}
          metalness={0.2}
        />
      </mesh>

      {/* Fireplace on left wall */}
      <mesh position={[-2.9, 1, 0]} rotation={[0, Math.PI / 2, 0]}>
        <boxGeometry args={[2, 2, 1.5]} />
        <meshStandardMaterial
          color="#4a4a4a"
          roughness={0.8}
          metalness={0.1}
        />
      </mesh>

      {/* Fireplace Hearth */}
      <mesh position={[-2.9, 0.1, 0]} rotation={[0, Math.PI / 2, 0]}>
        <boxGeometry args={[0.2, 2.2, 1.7]} />
        <meshStandardMaterial
          color="#5a5a5a"
          roughness={0.6}
          metalness={0.2}
        />
      </mesh>

      {/* Animated fire glow */}
      <AnimatedFireGlow />

      {/* Table in the center */}
      <Table />

      {/* 4 chairs positioned further from table */}
      <Chair position={[0, 0, 2.2]} rotation={[0, Math.PI, 0]} />
      <Chair position={[0, 0, -2.2]} rotation={[0, 0, 0]} />
      <Chair position={[1.8, 0, 0]} rotation={[0, -Math.PI / 2, 0]} />
      <Chair position={[-1.8, 0, 0]} rotation={[0, Math.PI / 2, 0]} />

      {/* Screen on front wall */}
      <Screen />

      {/* Projector mounted on ceiling */}
      <Projector position={[0, 4.5, -2.5]} rotation={[Math.PI / 4, 0, 0]} />

      {/* Additional spotlights for presentation lighting */}
      <SpotLight
        position={[2, 4, 2]}
        angle={0.5}
        penumbra={0.5}
        intensity={0.8}
        color="#ffffff"
        castShadow
      />
      <SpotLight
        position={[-2, 4, 2]}
        angle={0.5}
        penumbra={0.5}
        intensity={0.8}
        color="#ffffff"
        castShadow
      />
    </group>
  )
}

export function CabinRoom() {
  return (
    <div style={{ width: '100vw', height: '100vh', background: 'linear-gradient(180deg,#1a0f0a 0%, #2c1810 100%)' }}>
      <Canvas shadows>
        <PerspectiveCamera makeDefault position={[6, 4, 6]} fov={50} />

        {/* Ambient light */}
        <ambientLight intensity={0.4} color="#d4a574" />

        {/* Animated fireplace light */}
        <AnimatedFire />

        {/* Pulsing ceiling light */}
        <PulsingCeilingLight />

        {/* Window daylight */}
        <directionalLight
          position={[0, 2, -2]}
          intensity={0.5}
          color="#87ceeb"
        />

        {/* Environment */}
        <Environment preset="warehouse" />

        <Suspense fallback={null}>
          <CabinInterior />
        </Suspense>

        <ContactShadows position={[0, -0.5, 0]} opacity={0.6} scale={10} blur={2} />

        <OrbitControls
          target={[0, 2, 0]}
          enableZoom
          enablePan={false}
          minDistance={4}
          maxDistance={12}
          minPolarAngle={Math.PI / 8}
          maxPolarAngle={Math.PI / 2.5}
          autoRotate={true}
          autoRotateSpeed={0.5}
        />
      </Canvas>
    </div>
  )
}

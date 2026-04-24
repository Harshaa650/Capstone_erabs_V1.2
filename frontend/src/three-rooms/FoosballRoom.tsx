import React, { Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Environment, ContactShadows, PerspectiveCamera, SpotLight } from '@react-three/drei'

function FoosballMan({ color }) {
  return (
    <group>
      {/* Torso */}
      <mesh castShadow position={[0, -0.15, 0]}>
        <boxGeometry args={[0.16, 0.28, 0.14]} />
        <meshStandardMaterial color={color} metalness={0.05} roughness={0.4} />
      </mesh>
      {/* Head */}
      <mesh castShadow position={[0, 0.06, 0]}>
        <sphereGeometry args={[0.1, 24, 24]} />
        <meshStandardMaterial color="#d4a574" roughness={0.55} metalness={0} />
      </mesh>
      {/* Hair */}
      <mesh castShadow position={[0, 0.12, 0]}>
        <sphereGeometry args={[0.09, 16, 16]} />
        <meshStandardMaterial color="#1a1a1a" roughness={0.7} />
      </mesh>
      {/* Left Arm */}
      <mesh castShadow position={[-0.12, -0.12, 0]} rotation={[0, 0, 0.3]}>
        <boxGeometry args={[0.06, 0.22, 0.06]} />
        <meshStandardMaterial color={color} roughness={0.4} metalness={0.05} />
      </mesh>
      {/* Right Arm */}
      <mesh castShadow position={[0.12, -0.12, 0]} rotation={[0, 0, -0.3]}>
        <boxGeometry args={[0.06, 0.22, 0.06]} />
        <meshStandardMaterial color={color} roughness={0.4} metalness={0.05} />
      </mesh>
      {/* Left Leg */}
      <mesh castShadow position={[-0.05, -0.46, 0]}>
        <boxGeometry args={[0.065, 0.22, 0.065]} />
        <meshStandardMaterial color="#111" roughness={0.5} />
      </mesh>
      {/* Right Leg */}
      <mesh castShadow position={[0.05, -0.46, 0]}>
        <boxGeometry args={[0.065, 0.22, 0.065]} />
        <meshStandardMaterial color="#111" roughness={0.5} />
      </mesh>
      {/* Left Shoe */}
      <mesh castShadow position={[-0.05, -0.6, 0.02]}>
        <boxGeometry args={[0.07, 0.06, 0.1]} />
        <meshStandardMaterial color="#fff" roughness={0.3} />
      </mesh>
      {/* Right Shoe */}
      <mesh castShadow position={[0.05, -0.6, 0.02]}>
        <boxGeometry args={[0.07, 0.06, 0.1]} />
        <meshStandardMaterial color="#fff" roughness={0.3} />
      </mesh>
    </group>
  )
}

function FoosballRod({ x, color, playerPositions, facing = 1 }) {
  return (
    <group position={[x, 0.55, 0]}>
      {/* Main chrome rod - rotated to extend along Z axis (across short side) */}
      <mesh castShadow rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.035, 0.035, 3.2, 32]} />
        <meshStandardMaterial color="#d4d4d4" metalness={0.95} roughness={0.08} />
      </mesh>

      {/* Players positioned along Z, rotated to face opponent goal */}
      {playerPositions.map((z, i) => (
        <group key={i} position={[0, 0, z]} rotation={[0, facing * Math.PI / 2, 0]}>
          <FoosballMan color={color} />
        </group>
      ))}

      {/* Rod stoppers at Z ends */}
      <mesh position={[0, 0, -1.55]} castShadow rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.065, 0.065, 0.12, 24]} />
        <meshStandardMaterial color="#111" metalness={0.7} roughness={0.3} />
      </mesh>
      <mesh position={[0, 0, 1.55]} castShadow rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.065, 0.065, 0.12, 24]} />
        <meshStandardMaterial color="#111" metalness={0.7} roughness={0.3} />
      </mesh>

      {/* Handles - rubber at Z ends */}
      <mesh position={[0, 0, -1.85]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <cylinderGeometry args={[0.09, 0.1, 0.42, 24]} />
        <meshStandardMaterial color="#1a1a1a" roughness={0.85} metalness={0.1} />
      </mesh>
      <mesh position={[0, 0, 1.85]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <cylinderGeometry args={[0.09, 0.1, 0.42, 24]} />
        <meshStandardMaterial color="#1a1a1a" roughness={0.85} metalness={0.1} />
      </mesh>
    </group>
  )
}

function FieldMarkings() {
  const lineMat = (
    <meshStandardMaterial color="#ffffff" roughness={0.8} emissive="#ffffff" emissiveIntensity={0.15} />
  )

  return (
    <group position={[0, 0.052, 0]}>
      {/* Center line */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[0.025, 0.008, 2.2]} />
        {lineMat}
      </mesh>

      {/* Center circle */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
        <ringGeometry args={[0.22, 0.26, 64]} />
        {lineMat}
      </mesh>
      <mesh position={[0, 0, 0]}>
        <circleGeometry args={[0.055, 32]} />
        {lineMat}
      </mesh>

      {/* Goal area - left */}
      <mesh position={[-1.7, 0, 0]}>
        <boxGeometry args={[0.025, 0.008, 1.0]} />
        {lineMat}
      </mesh>
      <mesh position={[-1.9, 0, 0.5]}>
        <boxGeometry args={[0.4, 0.008, 0.025]} />
        {lineMat}
      </mesh>
      <mesh position={[-1.9, 0, -0.5]}>
        <boxGeometry args={[0.4, 0.008, 0.025]} />
        {lineMat}
      </mesh>

      {/* Goal area - right */}
      <mesh position={[1.7, 0, 0]}>
        <boxGeometry args={[0.025, 0.008, 1.0]} />
        {lineMat}
      </mesh>
      <mesh position={[1.9, 0, 0.5]}>
        <boxGeometry args={[0.4, 0.008, 0.025]} />
        {lineMat}
      </mesh>
      <mesh position={[1.9, 0, -0.5]}>
        <boxGeometry args={[0.4, 0.008, 0.025]} />
        {lineMat}
      </mesh>
    </group>
  )
}

function FoosballTable() {
  const tableWidth = 4.6
  const tableDepth = 2.6
  const wallHeight = 0.55
  const legHeight = 2.4

  return (
    <group>
      {/* Playing surface - green felt */}
      <mesh receiveShadow position={[0, 0, 0]}>
        <boxGeometry args={[4.2, 0.04, 2.3]} />
        <meshStandardMaterial color="#1a7a2e" roughness={0.75} metalness={0.02} />
      </mesh>

      <FieldMarkings />

      {/* Ball */}
      <mesh position={[0.3, 0.065, 0.15]} castShadow>
        <sphereGeometry args={[0.065, 32, 32]} />
        <meshStandardMaterial color="#f0f0f0" roughness={0.2} metalness={0.1} />
      </mesh>

      {/* Side walls - wooden */}
      <mesh receiveShadow position={[0, wallHeight / 2, tableDepth / 2]}>
        <boxGeometry args={[tableWidth, wallHeight, 0.15]} />
        <meshStandardMaterial color="#2d1b0e" roughness={0.35} metalness={0.15} />
      </mesh>
      <mesh receiveShadow position={[0, wallHeight / 2, -tableDepth / 2]}>
        <boxGeometry args={[tableWidth, wallHeight, 0.15]} />
        <meshStandardMaterial color="#2d1b0e" roughness={0.35} metalness={0.15} />
      </mesh>

      {/* End walls with goals */}
      <group position={[-tableWidth / 2, wallHeight / 2, 0]}>
        <mesh position={[0, 0.15, 0]}>
          <boxGeometry args={[0.15, 0.25, tableDepth]} />
          <meshStandardMaterial color="#2d1b0e" roughness={0.35} metalness={0.15} />
        </mesh>
        <mesh position={[0, -0.15, 0]}>
          <boxGeometry args={[0.15, 0.25, tableDepth]} />
          <meshStandardMaterial color="#2d1b0e" roughness={0.35} metalness={0.15} />
        </mesh>
        <mesh position={[-0.05, 0, 0]}>
          <boxGeometry args={[0.02, 0.32, 0.55]} />
          <meshStandardMaterial color="#0a0a0a" roughness={0.9} />
        </mesh>
      </group>

      <group position={[tableWidth / 2, wallHeight / 2, 0]}>
        <mesh position={[0, 0.15, 0]}>
          <boxGeometry args={[0.15, 0.25, tableDepth]} />
          <meshStandardMaterial color="#2d1b0e" roughness={0.35} metalness={0.15} />
        </mesh>
        <mesh position={[0, -0.15, 0]}>
          <boxGeometry args={[0.15, 0.25, tableDepth]} />
          <meshStandardMaterial color="#2d1b0e" roughness={0.35} metalness={0.15} />
        </mesh>
        <mesh position={[0.05, 0, 0]}>
          <boxGeometry args={[0.02, 0.32, 0.55]} />
          <meshStandardMaterial color="#0a0a0a" roughness={0.9} />
        </mesh>
      </group>

      {/* Top rim */}
      <mesh position={[0, wallHeight + 0.02, tableDepth / 2]}>
        <boxGeometry args={[tableWidth + 0.15, 0.06, 0.2]} />
        <meshStandardMaterial color="#3d2618" roughness={0.3} metalness={0.2} />
      </mesh>
      <mesh position={[0, wallHeight + 0.02, -tableDepth / 2]}>
        <boxGeometry args={[tableWidth + 0.15, 0.06, 0.2]} />
        <meshStandardMaterial color="#3d2618" roughness={0.3} metalness={0.2} />
      </mesh>
      <mesh position={[-tableWidth / 2, wallHeight + 0.02, 0]}>
        <boxGeometry args={[0.2, 0.06, tableDepth + 0.2]} />
        <meshStandardMaterial color="#3d2618" roughness={0.3} metalness={0.2} />
      </mesh>
      <mesh position={[tableWidth / 2, wallHeight + 0.02, 0]}>
        <boxGeometry args={[0.2, 0.06, tableDepth + 0.2]} />
        <meshStandardMaterial color="#3d2618" roughness={0.3} metalness={0.2} />
      </mesh>

      {/* Legs */}
      {[
        [-tableWidth / 2 + 0.15, -legHeight / 2, -tableDepth / 2 + 0.15],
        [tableWidth / 2 - 0.15, -legHeight / 2, -tableDepth / 2 + 0.15],
        [-tableWidth / 2 + 0.15, -legHeight / 2, tableDepth / 2 - 0.15],
        [tableWidth / 2 - 0.15, -legHeight / 2, tableDepth / 2 - 0.15],
      ].map((p, i) => (
        <group key={i} position={p}>
          <mesh castShadow>
            <boxGeometry args={[0.22, legHeight, 0.22]} />
            <meshStandardMaterial color="#1a1a1a" metalness={0.6} roughness={0.3} />
          </mesh>
          <mesh position={[0, -legHeight / 2 - 0.04, 0]}>
            <cylinderGeometry args={[0.14, 0.16, 0.08, 24]} />
            <meshStandardMaterial color="#111" metalness={0.7} roughness={0.25} />
          </mesh>
        </group>
      ))}

      {/* Score beads - positioned on the short side walls (where rods pass through) */}
      {[-1, 1].map((side) =>
        [0, 0.2, 0.4, 0.6, 0.8].map((y, i) => (
          <mesh key={`${side}-${i}`} position={[tableWidth / 2 + 0.08, wallHeight - 0.15 - y, side * (tableDepth / 2 - 0.06)]}>
            <sphereGeometry args={[0.055, 16, 16]} />
            <meshStandardMaterial color={side === -1 ? '#cc2222' : '#2244cc'} roughness={0.3} metalness={0.2} />
          </mesh>
        ))
      )}

      {/* Rods - positioned along X axis, extending along Z axis (across short side) */}
      {/* Standard 1-2-5-3 formation per side */}
      {/* Red team (left side, facing right toward +X) */}
      <FoosballRod x={-1.6} color="#cc2222" playerPositions={[0]} facing={1} />
      <FoosballRod x={-1.0} color="#cc2222" playerPositions={[-0.5, 0.5]} facing={1} />
      <FoosballRod x={-0.35} color="#cc2222" playerPositions={[-0.8, -0.4, 0, 0.4, 0.8]} facing={1} />
      <FoosballRod x={0.35} color="#cc2222" playerPositions={[-0.6, 0, 0.6]} facing={1} />

      {/* Blue team (right side, facing left toward -X) */}
      <FoosballRod x={0.85} color="#2244cc" playerPositions={[-0.6, 0, 0.6]} facing={-1} />
      <FoosballRod x={1.45} color="#2244cc" playerPositions={[-0.8, -0.4, 0, 0.4, 0.8]} facing={-1} />
      <FoosballRod x={2.05} color="#2244cc" playerPositions={[-0.5, 0.5]} facing={-1} />
      <FoosballRod x={2.5} color="#2244cc" playerPositions={[0]} facing={-1} />
    </group>
  )
}

function Floor() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2.4, 0]} receiveShadow>
      <planeGeometry args={[50, 50]} />
      <meshStandardMaterial color="#1a1a1a" roughness={0.85} metalness={0.05} />
    </mesh>
  )
}

export default function FoosballRoom() {
  return (
    <div style={{ width: '100vw', height: '100vh', background: '#121212' }}>
      <Canvas shadows dpr={[1, 2]}>
        <PerspectiveCamera makeDefault position={[5.5, 3.5, 3.5]} fov={40} near={0.1} far={100} />

        {/* Key light */}
        <SpotLight position={[4, 8, 6]} angle={0.4} penumbra={0.3} intensity={2.5} color="#fff5e6" castShadow shadow-mapSize-width={2048} shadow-mapSize-height={2048} shadow-bias={-0.0001} />

        {/* Fill light */}
        <SpotLight position={[-5, 5, 2]} angle={0.6} penumbra={0.8} intensity={1.2} color="#e6eeff" castShadow={false} />

        {/* Rim light */}
        <SpotLight position={[0, 4, -6]} angle={0.35} penumbra={0.5} intensity={1.0} color="#fff8f0" castShadow={false} />

        <ambientLight intensity={0.25} color="#d4d8e0" />
        <pointLight position={[0, -1, 0]} intensity={0.3} color="#b8c4d4" />

        <Environment preset="studio" background={false} />

        <Suspense fallback={null}>
          <Floor />
          <FoosballTable />
        </Suspense>

        <ContactShadows position={[0, -2.38, 0]} opacity={0.5} scale={18} blur={2.5} far={6} />

        <OrbitControls
          target={[0, 0.3, 0]}
          enableZoom
          enablePan={false}
          minDistance={3}
          maxDistance={12}
          minPolarAngle={Math.PI / 8}
          maxPolarAngle={Math.PI / 2.1}
        />
      </Canvas>
    </div>
  )
}

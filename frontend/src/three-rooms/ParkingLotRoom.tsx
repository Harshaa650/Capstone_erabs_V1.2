import React, { Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Environment, ContactShadows, PerspectiveCamera } from '@react-three/drei'

// -------- CAR -------- //

function Car({ position, rotation = [0, 0, 0], color = '#3366cc' }) {
  return (
    <group position={position} rotation={rotation}>
      {/* Body */}
      <mesh castShadow position={[0, 0.25, 0]}>
        <boxGeometry args={[1.8, 0.4, 0.9]} />
        <meshStandardMaterial color={color} roughness={0.3} metalness={0.6} />
      </mesh>

      {/* Cabin */}
      <mesh castShadow position={[0.1, 0.6, 0]}>
        <boxGeometry args={[1.1, 0.35, 0.8]} />
        <meshStandardMaterial color={color} roughness={0.2} metalness={0.7} />
      </mesh>

      {/* Windshield front */}
      <mesh position={[0.65, 0.55, 0]}>
        <boxGeometry args={[0.05, 0.28, 0.7]} />
        <meshStandardMaterial color="#b8d8f8" roughness={0.1} metalness={0.3} transparent opacity={0.7} />
      </mesh>

      {/* Windshield rear */}
      <mesh position={[-0.45, 0.55, 0]}>
        <boxGeometry args={[0.05, 0.28, 0.7]} />
        <meshStandardMaterial color="#b8d8f8" roughness={0.1} metalness={0.3} transparent opacity={0.7} />
      </mesh>

      {/* Wheels */}
      {[
        [0.55, 0.08, 0.5],
        [0.55, 0.08, -0.5],
        [-0.55, 0.08, 0.5],
        [-0.55, 0.08, -0.5],
      ].map((p, i) => (
        <mesh key={i} position={p} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.12, 0.12, 0.08, 16]} />
          <meshStandardMaterial color="#1a1a1a" roughness={0.8} />
        </mesh>
      ))}

      {/* Headlights */}
      {[0.3, -0.3].map((z, i) => (
        <mesh key={`hl-${i}`} position={[0.91, 0.25, z]}>
          <sphereGeometry args={[0.06, 12, 12]} />
          <meshStandardMaterial color="#ffe066" emissive="#ffe066" emissiveIntensity={0.5} />
        </mesh>
      ))}

      {/* Taillights */}
      {[0.3, -0.3].map((z, i) => (
        <mesh key={`tl-${i}`} position={[-0.91, 0.25, z]}>
          <sphereGeometry args={[0.06, 12, 12]} />
          <meshStandardMaterial color="#ff3333" emissive="#ff3333" emissiveIntensity={0.4} />
        </mesh>
      ))}
    </group>
  )
}

// -------- PARKING SPOT -------- //

function ParkingSpot({ position, hasCar = false, carColor = '#3366cc', carRotation = [0, 0, 0] }) {
  return (
    <group position={position}>
      {/* Spot surface */}
      <mesh receiveShadow position={[0, 0.01, 0]}>
        <boxGeometry args={[2.4, 0.02, 1.3]} />
        <meshStandardMaterial color="#2a2a2e" roughness={0.9} />
      </mesh>

      {/* White line markings — left and right */}
      <mesh position={[0, 0.025, 0.65]}>
        <boxGeometry args={[2.4, 0.01, 0.04]} />
        <meshStandardMaterial color="#ffffff" roughness={0.6} />
      </mesh>
      <mesh position={[0, 0.025, -0.65]}>
        <boxGeometry args={[2.4, 0.01, 0.04]} />
        <meshStandardMaterial color="#ffffff" roughness={0.6} />
      </mesh>

      {/* Spot number marking */}
      <mesh position={[-0.9, 0.025, 0]}>
        <boxGeometry args={[0.04, 0.01, 1.2]} />
        <meshStandardMaterial color="#ffffff" roughness={0.6} />
      </mesh>

      {hasCar && <Car position={[0.1, 0, 0]} rotation={carRotation} color={carColor} />}
    </group>
  )
}

// -------- BOLLARD -------- //

function Bollard({ position }) {
  return (
    <group position={position}>
      <mesh castShadow>
        <cylinderGeometry args={[0.08, 0.1, 0.6, 12]} />
        <meshStandardMaterial color="#f5c518" roughness={0.4} metalness={0.5} />
      </mesh>
      <mesh position={[0, 0.35, 0]}>
        <sphereGeometry args={[0.09, 12, 12]} />
        <meshStandardMaterial color="#f5c518" roughness={0.4} metalness={0.5} />
      </mesh>
    </group>
  )
}

// -------- EV CHARGER -------- //

function EVCharger({ position }) {
  return (
    <group position={position}>
      {/* Post */}
      <mesh castShadow>
        <boxGeometry args={[0.25, 1.2, 0.15]} />
        <meshStandardMaterial color="#2d7d46" roughness={0.4} metalness={0.3} />
      </mesh>
      {/* Screen */}
      <mesh position={[0, 0.2, 0.08]}>
        <boxGeometry args={[0.18, 0.22, 0.02]} />
        <meshStandardMaterial color="#1a1a2e" emissive="#4488ff" emissiveIntensity={0.3} />
      </mesh>
      {/* Cable */}
      <mesh position={[0.15, -0.2, 0.08]}>
        <cylinderGeometry args={[0.02, 0.02, 0.6, 8]} />
        <meshStandardMaterial color="#222" />
      </mesh>
    </group>
  )
}

// -------- PARKING LOT SCENE -------- //

export default function ParkingLotRoom() {
  const carColors = ['#3366cc', '#cc3333', '#f5f5f5', '#1a1a1a', '#cc8833', '#6633cc', '#33aa66', '#888888']

  // 4 rows × 5 spots = 20 spots
  const spots = []
  for (let row = 0; row < 4; row++) {
    for (let col = 0; col < 5; col++) {
      const idx = row * 5 + col
      const hasCar = idx < 12 // 12 out of 20 occupied
      spots.push(
        <ParkingSpot
          key={`spot-${idx}`}
          position={[col * 2.6 - 5.2, 0, row * 2.8 - 4.2]}
          hasCar={hasCar}
          carColor={carColors[idx % carColors.length]}
        />
      )
    }
  }

  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <Canvas shadows>
        <PerspectiveCamera makeDefault position={[12, 10, 14]} fov={45} />

        <ambientLight intensity={0.6} />
        <directionalLight position={[10, 15, 8]} intensity={1.4} castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
        />
        {/* Secondary fill light */}
        <directionalLight position={[-8, 6, -4]} intensity={0.3} />

        <Environment preset="city" />

        <Suspense fallback={null}>
          {/* Ground / Asphalt */}
          <mesh receiveShadow position={[0, -0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[20, 18]} />
            <meshStandardMaterial color="#3a3a3e" roughness={0.95} />
          </mesh>

          {/* Driving lane */}
          <mesh receiveShadow position={[0, 0.005, -1.4]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[16, 2.5]} />
            <meshStandardMaterial color="#4a4a4e" roughness={0.9} />
          </mesh>

          {/* Lane arrows */}
          {[-4, 0, 4].map((x, i) => (
            <mesh key={`arrow-${i}`} position={[x, 0.015, -1.4]} rotation={[-Math.PI / 2, 0, 0]}>
              <boxGeometry args={[0.15, 0.8, 0.01]} />
              <meshStandardMaterial color="#e8e8e8" />
            </mesh>
          ))}

          {/* Parking spots */}
          {spots}

          {/* Bollards along the edges */}
          {[-6.5, -3.5, -0.5, 2.5, 5.5].map((x, i) => (
            <Bollard key={`b-${i}`} position={[x, 0, -6.8]} />
          ))}

          {/* EV Charging stations */}
          <EVCharger position={[5.8, 0.6, -4.2]} />
          <EVCharger position={[5.8, 0.6, -1.4]} />

          {/* Sign post */}
          <group position={[-7.5, 0, -6]}>
            {/* Post */}
            <mesh>
              <cylinderGeometry args={[0.06, 0.06, 2.5, 8]} />
              <meshStandardMaterial color="#777" metalness={0.7} />
            </mesh>
            {/* Sign */}
            <mesh position={[0, 1.0, 0]}>
              <boxGeometry args={[1.2, 0.8, 0.05]} />
              <meshStandardMaterial color="#2255aa" roughness={0.5} />
            </mesh>
            {/* P letter — represented as a small white box */}
            <mesh position={[0, 1.0, 0.03]}>
              <boxGeometry args={[0.5, 0.5, 0.01]} />
              <meshStandardMaterial color="#ffffff" />
            </mesh>
          </group>

          {/* Roof pillars */}
          {[
            [-6, 0, 3.5], [6, 0, 3.5],
            [-6, 0, -6], [6, 0, -6],
          ].map((p, i) => (
            <mesh key={`pillar-${i}`} position={[p[0], 2, p[2]]}>
              <cylinderGeometry args={[0.15, 0.15, 4, 12]} />
              <meshStandardMaterial color="#888" metalness={0.6} roughness={0.4} />
            </mesh>
          ))}

          {/* Roof */}
          <mesh position={[0, 4, -1]} receiveShadow>
            <boxGeometry args={[14, 0.12, 12]} />
            <meshStandardMaterial color="#555" metalness={0.4} roughness={0.6} transparent opacity={0.6} />
          </mesh>
        </Suspense>

        <ContactShadows position={[0, -0.01, 0]} opacity={0.5} scale={25} blur={2} />

        <OrbitControls target={[0, 1, 0]} maxPolarAngle={Math.PI / 2.2} />
      </Canvas>
    </div>
  )
}

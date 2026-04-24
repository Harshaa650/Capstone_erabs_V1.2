import React, { Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Environment, ContactShadows, PerspectiveCamera } from '@react-three/drei'

// -------- PIECES -------- //

function Piece({ type, color, position }) {
  const baseColor = color === 'white' ? '#f5efe2' : '#1a1a1a'

  const configs = {
    pawn: [0.12, 0.4],
    rook: [0.16, 0.5],
    knight: [0.14, 0.55],
    bishop: [0.13, 0.6],
    queen: [0.15, 0.7],
    king: [0.16, 0.8],
  }

  const [radius, height] = configs[type]

  return (
    <group position={position}>
      <mesh castShadow>
        <cylinderGeometry args={[radius, radius * 1.2, height, 32]} />
        <meshStandardMaterial color={baseColor} roughness={0.35} metalness={0.2} />
      </mesh>

      <mesh position={[0, height / 2 + 0.1, 0]}>
        <sphereGeometry args={[radius * 0.7, 32, 32]} />
        <meshStandardMaterial color={baseColor} />
      </mesh>

      {type === 'king' && (
        <mesh position={[0, height / 2 + 0.3, 0]}>
          <boxGeometry args={[0.05, 0.2, 0.05]} />
          <meshStandardMaterial color={baseColor} />
        </mesh>
      )}
    </group>
  )
}

// -------- BOARD -------- //

function ChessBoard() {
  const squares = []

  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const dark = (r + c) % 2

      squares.push(
        <mesh
          key={`${r}-${c}`}
          position={[(c - 3.5) * 0.6, 0, (r - 3.5) * 0.6]}
        >
          <boxGeometry args={[0.6, 0.08, 0.6]} />
          <meshStandardMaterial
            color={dark ? '#4a2e1a' : '#f5e6c8'}
            roughness={0.5}
          />
        </mesh>
      )
    }
  }

  return <group>{squares}</group>
}

// -------- SETUP -------- //

function ChessSetup() {
  const pieces = []

  const add = (type, color, row, col) => {
    pieces.push(
      <Piece
        key={`${type}-${color}-${row}-${col}`}
        type={type}
        color={color}
        position={[(col - 3.5) * 0.6, 0.15, (row - 3.5) * 0.6]}
      />
    )
  }

  for (let i = 0; i < 8; i++) {
    add('pawn', 'white', 1, i)
    add('pawn', 'black', 6, i)
  }

  add('rook', 'white', 0, 0)
  add('rook', 'white', 0, 7)
  add('rook', 'black', 7, 0)
  add('rook', 'black', 7, 7)

  add('knight', 'white', 0, 1)
  add('knight', 'white', 0, 6)
  add('knight', 'black', 7, 1)
  add('knight', 'black', 7, 6)

  add('bishop', 'white', 0, 2)
  add('bishop', 'white', 0, 5)
  add('bishop', 'black', 7, 2)
  add('bishop', 'black', 7, 5)

  add('queen', 'white', 0, 3)
  add('king', 'white', 0, 4)
  add('queen', 'black', 7, 3)
  add('king', 'black', 7, 4)

  return <group>{pieces}</group>
}

// -------- TABLE -------- //

function Table() {
  return (
    <group>
      {/* Table */}
      <mesh receiveShadow castShadow>
        <boxGeometry args={[5.5, 0.25, 5.5]} />
        <meshStandardMaterial color="#2a1e14" />
      </mesh>

      {/* Legs */}
      {[[-2.3, -1.2, -2.3], [2.3, -1.2, -2.3], [-2.3, -1.2, 2.3], [2.3, -1.2, 2.3]].map((p, i) => (
        <mesh key={i} position={p}>
          <cylinderGeometry args={[0.1, 0.1, 2.2]} />
          <meshStandardMaterial color="#111" />
        </mesh>
      ))}

      {/* Board lifted */}
      <group position={[0, 0.3, 0]}>
        <ChessBoard />
        <ChessSetup />
      </group>
    </group>
  )
}

// -------- CHAIR -------- //

function Chair({ position, rotation }) {
  return (
    <group position={position} rotation={rotation}>
      <mesh position={[0, 0.25, 0]}>
        <boxGeometry args={[1.2, 0.1, 1.2]} />
        <meshStandardMaterial color="#3a2a1c" />
      </mesh>

      <mesh position={[0, 0.9, -0.5]}>
        <boxGeometry args={[1.2, 1.2, 0.1]} />
        <meshStandardMaterial color="#3a2a1c" />
      </mesh>
    </group>
  )
}

// -------- ROOM -------- //

export default function ChessRoom() {
  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <Canvas shadows>
        {/* CAMERA FIX */}
        <PerspectiveCamera makeDefault position={[6, 4, 6]} fov={50} />

        <ambientLight intensity={0.5} />
        <directionalLight position={[6, 8, 4]} intensity={1.2} castShadow />

        <Environment preset="apartment" />

        <Suspense fallback={null}>
          {/* FIRST TABLE */}
          <group position={[0, 0, 0]}>
            <Table />

            {/* Chairs facing each other */}
            <Chair position={[0, 0, 3]} rotation={[0, Math.PI, 0]} />
            <Chair position={[0, 0, -3]} rotation={[0, 0, 0]} />
          </group>

          {/* SECOND TABLE (SPACED) */}
          <group position={[10, 0, 0]}>
            <Table />

            <Chair position={[0, 0, 3]} rotation={[0, Math.PI, 0]} />
            <Chair position={[0, 0, -3]} rotation={[0, 0, 0]} />
          </group>
        </Suspense>

        <ContactShadows position={[0, -1.2, 0]} opacity={0.6} scale={25} />

        {/* CAMERA TARGET FIX */}
        <OrbitControls target={[5, 0.5, 0]} />
      </Canvas>
    </div>
  )
}
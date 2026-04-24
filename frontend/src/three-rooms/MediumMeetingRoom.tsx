import React, { Suspense } from 'react';
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Environment, PerspectiveCamera, SpotLight } from "@react-three/drei";
import { Table } from './Table';
import { Screen } from './Screen';
import { Chair } from './Chair';
import { MediumRoom } from './MediumRoom';
import { Laptop } from './Laptop';
import { CoffeeCup } from './CoffeeCup';
import { Plant } from './Plant';
import { Projector } from './Projector';

function Chairs() {
  // 5 chairs positioned around the round table - exact atan2 angles to face center
  const chairData = [
    { pos: [0, 0, 2.2], rot: [0, Math.PI, 0] },           // Top - atan2(0, -2.2) = π
    { pos: [2.1, 0, 0.7], rot: [0, -Math.PI * 0.6, 0] },  // Top-right - atan2(-2.1, -0.7) = -1.89 rad ≈ -0.6π
    { pos: [1.3, 0, -1.8], rot: [0, -Math.PI * 0.2, 0] }, // Bottom-right - atan2(-1.3, 1.8) = -0.62 rad ≈ -0.2π
    { pos: [-1.3, 0, -1.8], rot: [0, Math.PI * 0.2, 0] }, // Bottom-left - atan2(1.3, 1.8) = 0.62 rad ≈ 0.2π
    { pos: [-2.1, 0, 0.7], rot: [0, Math.PI * 0.6, 0] },  // Top-left - atan2(2.1, -0.7) = 1.89 rad ≈ 0.6π
  ];

  return (
    <>
      {chairData.map((chair, i) => (
        <Chair key={i} position={chair.pos as [number, number, number]} rotation={chair.rot as [number, number, number]} />
      ))}
    </>
  );
}

function Laptops() {
  // 3 laptops on the round table
  const positions = [
    [0.5, 0.85, 0.3, Math.PI / 8],
    [-0.5, 0.85, 0.3, -Math.PI / 8],
    [0, 0.85, -0.4, Math.PI / 6],
  ];
  
  return (
    <>
      {positions.map((pos, i) => (
        <Laptop key={i} position={pos.slice(0, 3) as [number, number, number]} rotation={[0, pos[3], 0]} />
      ))}
    </>
  );
}

function CoffeeCups() {
  // 3 coffee cups on the round table
  const positions = [
    [0.7, 0.85, 0.2],
    [-0.7, 0.85, 0.2],
    [0, 0.85, -0.6],
  ];
  
  return (
    <>
      {positions.map((pos, i) => (
        <CoffeeCup key={i} position={pos as [number, number, number]} />
      ))}
    </>
  );
}

function Plants() {
  return (
    <>
      <Plant position={[4, 0, 4]} />
      <Plant position={[-4, 0, 4]} />
      <Plant position={[4, 0, -4]} />
      <Plant position={[-4, 0, -4]} />
    </>
  );
}

function Projectors() {
  return (
    <>
      <Projector position={[0, 5, 4.5]} rotation={[Math.PI / 6, 0, 0]} />
      <Projector position={[0, 5, -4.5]} rotation={[-Math.PI / 6, Math.PI, 0]} />
    </>
  );
}

export default function MediumMeetingRoom() {
  return (
    <div style={{ width: '100vw', height: '100vh', background: '#0a0a0a' }}>
      <Canvas shadows>
        {/* Camera Setup */}
        <PerspectiveCamera makeDefault position={[10, 6, 10]} fov={45} />
        
        {/* Medium Room Lighting */}
        <ambientLight intensity={0.4} color="#f0e6d2" />
        
        {/* Main directional light */}
        <directionalLight
          position={[15, 15, 8]}
          intensity={1.3}
          color="#fff8e7"
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
          shadow-camera-far={50}
          shadow-camera-left={-8}
          shadow-camera-right={8}
          shadow-camera-top={8}
          shadow-camera-bottom={-8}
          shadow-bias={-0.0001}
        />
        
        {/* Warm central spotlight */}
        <SpotLight
          position={[0, 8, 0]}
          angle={0.5}
          penumbra={0.5}
          intensity={1.1}
          color="#ffd4a3"
          castShadow
          shadow-mapSize-width={1024}
          shadow-mapSize-height={1024}
        />
        
        <SpotLight
          position={[6, 6, 6]}
          angle={0.3}
          penumbra={0.5}
          intensity={0.7}
          color="#e3f2fd"
          castShadow
        />
        
        <SpotLight
          position={[-6, 6, -6]}
          angle={0.3}
          penumbra={0.5}
          intensity={0.7}
          color="#fce4ec"
          castShadow
        />

        {/* Additional accent lights for professional feel */}
        <SpotLight
          position={[4, 5, 4]}
          angle={0.2}
          penumbra={0.4}
          intensity={0.5}
          color="#ffd700"
          castShadow
        />

        <SpotLight
          position={[-4, 5, -4]}
          angle={0.2}
          penumbra={0.4}
          intensity={0.5}
          color="#ffd700"
          castShadow
        />
        
        {/* Environment */}
        <Environment preset="warehouse" background={false} />
        
        {/* Scene Components */}
        <MediumRoom />
        <Table />
        <Screen />
        <Suspense fallback={null}>
          <Chairs />
          <Laptops />
          <CoffeeCups />
          <Plants />
          <Projectors />
        </Suspense>
        
        {/* Camera Controls */}
        <OrbitControls
          enableZoom={true}
          enablePan={false}
          minDistance={6}
          maxDistance={20}
          minPolarAngle={Math.PI / 6}
          maxPolarAngle={Math.PI / 2.2}
          autoRotate={false}
        />
      </Canvas>
    </div>
  );
}

import React, { Suspense } from 'react';
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Environment, ContactShadows, PerspectiveCamera, SpotLight } from "@react-three/drei";
import { Table } from './Table';
import { Screen } from './Screen';
import { Chair } from './Chair';
import { Room } from './Room';
import { Laptop } from './Laptop';
import { CoffeeCup } from './CoffeeCup';
import { Plant } from './Plant';
import { Projector } from './Projector';

function Chairs() {
  // 8 chairs positioned around the round table - exact atan2 angles to face center
  const chairData = [
    { pos: [2.2, 0, 0], rot: [0, -Math.PI / 2, 0] },      // Right - atan2(-2.2, 0) = -π/2
    { pos: [-2.2, 0, 0], rot: [0, Math.PI / 2, 0] },       // Left - atan2(2.2, 0) = π/2
    { pos: [0, 0, 2.2], rot: [0, Math.PI, 0] },           // Top - atan2(0, -2.2) = π
    { pos: [0, 0, -2.2], rot: [0, 0, 0] },              // Bottom - atan2(0, 2.2) = 0
    { pos: [1.8, 0, 1.8], rot: [0, -Math.PI * 0.75, 0] }, // Top-right - atan2(-1.8, -1.8) = -3π/4
    { pos: [-1.8, 0, -1.8], rot: [0, Math.PI * 0.25, 0] }, // Bottom-left - atan2(1.8, 1.8) = π/4
    { pos: [1.8, 0, -1.8], rot: [0, -Math.PI * 0.25, 0] }, // Bottom-right - atan2(-1.8, 1.8) = -π/4
    { pos: [-1.8, 0, 1.8], rot: [0, Math.PI * 0.75, 0] }, // Top-left - atan2(1.8, -1.8) = 3π/4
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
  const positions = [
    [0.8, 0.85, 0.3, Math.PI / 8],
    [-0.8, 0.85, 0.3, -Math.PI / 8],
    [0.5, 0.85, -0.8, Math.PI / 6],
    [-0.5, 0.85, -0.8, -Math.PI / 6],
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
  const positions = [
    [1.2, 0.85, 0.2],
    [-1.2, 0.85, 0.2],
    [0.7, 0.85, -0.6],
    [-0.7, 0.85, -0.6],
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
      <Plant position={[2.8, 0, 2.8]} />
      <Plant position={[-2.8, 0, 2.8]} />
      <Plant position={[2.8, 0, -2.8]} />
    </>
  );
}

function Projectors() {
  return (
    <>
      <Projector position={[0, 4.5, 3.5]} rotation={[Math.PI / 6, 0, 0]} />
      <Projector position={[0, 4.5, -3.5]} rotation={[-Math.PI / 6, Math.PI, 0]} />
    </>
  );
}

export default function MeetingRoom() {
  return (
    <div style={{ width: '100vw', height: '100vh', background: '#0a0a0a' }}>
      <Canvas shadows>
        {/* Enhanced Camera Setup */}
        <PerspectiveCamera makeDefault position={[8, 6, 8]} fov={45} />
        
        {/* Enhanced Lighting Setup */}
        <ambientLight intensity={0.4} color="#f0e6d2" />
        
        {/* Main directional light - simulating daylight */}
        <directionalLight
          position={[15, 15, 8]}
          intensity={1.5}
          color="#fff8e7"
          castShadow
          shadow-mapSize-width={4096}
          shadow-mapSize-height={4096}
          shadow-camera-far={50}
          shadow-camera-left={-10}
          shadow-camera-right={10}
          shadow-camera-top={10}
          shadow-camera-bottom={-10}
          shadow-bias={-0.0001}
        />
        
        {/* Warm central spotlight for atmosphere */}
        <SpotLight
          position={[0, 8, 0]}
          angle={0.5}
          penumbra={0.5}
          intensity={1.2}
          color="#ffd4a3"
          castShadow
          shadow-mapSize-width={1024}
          shadow-mapSize-height={1024}
        />
        
        <SpotLight
          position={[5, 6, 5]}
          angle={0.3}
          penumbra={0.5}
          intensity={0.8}
          color="#e3f2fd"
          castShadow
        />
        
        <SpotLight
          position={[-5, 6, -5]}
          angle={0.3}
          penumbra={0.5}
          intensity={0.8}
          color="#fce4ec"
          castShadow
        />

        {/* Additional accent lights for professional feel */}
        <SpotLight
          position={[3, 5, 3]}
          angle={0.2}
          penumbra={0.4}
          intensity={0.5}
          color="#ffd700"
          castShadow
        />

        <SpotLight
          position={[-3, 5, -3]}
          angle={0.2}
          penumbra={0.4}
          intensity={0.5}
          color="#ffd700"
          castShadow
        />
        
        {/* HDRI Environment for realism */}
        <Environment preset="apartment" background={false} />
        
        {/* Scene Components */}
        <Room />
        <Table />
        <Screen />
        <Suspense fallback={null}>
          <Chairs />
          <Laptops />
          <CoffeeCups />
          <Plants />
          <Projectors />
        </Suspense>
        
        {/* Enhanced Ground Shadows */}
        <ContactShadows
          position={[0, 0.01, 0]}
          opacity={0.6}
          scale={12}
          blur={3}
          far={8}
        />
        
        {/* Camera Controls */}
        <OrbitControls
          enableZoom={true}
          enablePan={false}
          minDistance={5}
          maxDistance={20}
          minPolarAngle={Math.PI / 6}
          maxPolarAngle={Math.PI / 2.2}
          autoRotate={false}
          target={[0, 1, 0]}
        />
      </Canvas>
    </div>
  );
}

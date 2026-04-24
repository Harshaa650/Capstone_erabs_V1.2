import React, { Suspense } from 'react';
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Environment, ContactShadows, PerspectiveCamera, SpotLight } from "@react-three/drei";
import { RectangularTable } from './RectangularTable';
import { Screen } from './Screen';
import { Chair } from './Chair';
import { Room } from './Room';
import { Laptop } from './Laptop';
import { CoffeeCup } from './CoffeeCup';
import { Plant } from './Plant';
import { Projector } from './Projector';

function Chairs() {
  // 12 chairs positioned around the rectangular table - all facing toward center
  const chairData = [
    // Long sides - 4 chairs on each side facing toward table center
    { pos: [1.5, 0, 1.2], rot: [0, Math.PI, 0] },     // Front side, facing back
    { pos: [0.5, 0, 1.2], rot: [0, Math.PI, 0] },     // Front side, facing back
    { pos: [-0.5, 0, 1.2], rot: [0, Math.PI, 0] },    // Front side, facing back
    { pos: [-1.5, 0, 1.2], rot: [0, Math.PI, 0] },    // Front side, facing back
    { pos: [1.5, 0, -1.2], rot: [0, 0, 0] },          // Back side, facing front
    { pos: [0.5, 0, -1.2], rot: [0, 0, 0] },          // Back side, facing front
    { pos: [-0.5, 0, -1.2], rot: [0, 0, 0] },         // Back side, facing front
    { pos: [-1.5, 0, -1.2], rot: [0, 0, 0] },         // Back side, facing front
    // Short sides - 2 chairs on each end facing toward center
    { pos: [2.2, 0, 0.5], rot: [0, -Math.PI / 2, 0] }, // Right side, facing left
    { pos: [2.2, 0, -0.5], rot: [0, -Math.PI / 2, 0] }, // Right side, facing left
    { pos: [-2.2, 0, 0.5], rot: [0, Math.PI / 2, 0] },  // Left side, facing right
    { pos: [-2.2, 0, -0.5], rot: [0, Math.PI / 2, 0] }, // Left side, facing right
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
  // Laptops on the rectangular table
  const positions = [
    [1.2, 0.85, 0.4, Math.PI / 8],
    [-1.2, 0.85, 0.4, -Math.PI / 8],
    [0.8, 0.85, -0.4, Math.PI / 6],
    [-0.8, 0.85, -0.4, -Math.PI / 6],
    [0.3, 0.85, 0.4, 0],
    [-0.3, 0.85, -0.4, Math.PI],
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
  // Coffee cups on the rectangular table
  const positions = [
    [1.5, 0.85, 0.6],
    [-1.5, 0.85, 0.6],
    [1.0, 0.85, -0.6],
    [-1.0, 0.85, -0.6],
    [0.5, 0.85, 0.6],
    [-0.5, 0.85, -0.6],
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
      <Plant position={[3.5, 0, 3.5]} />
      <Plant position={[-3.5, 0, 3.5]} />
      <Plant position={[3.5, 0, -3.5]} />
      <Plant position={[-3.5, 0, -3.5]} />
      <Plant position={[0, 0, 4]} />
      <Plant position={[0, 0, -4]} />
    </>
  );
}

function Projectors() {
  return (
    <>
      {/* Front projector */}
      <Projector 
        position={[0, 5.5, 5.8]} 
        rotation={[Math.PI / 6, 0, 0]} 
      />
      
      {/* Back projector */}
      <Projector 
        position={[0, 5.5, -5.8]} 
        rotation={[-Math.PI / 6, Math.PI, 0]} 
      />
    </>
  );
}

function LargeRoom() {
  return (
    <group>
      {/* Larger room dimensions */}
      {/* Floor */}
      <mesh receiveShadow position={[0, -0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[12, 12]} />
        <meshStandardMaterial 
          color="#8b8b8b" 
          roughness={0.6} 
          metalness={0.2}
        />
      </mesh>
      
      {/* Back Wall */}
      <mesh receiveShadow position={[0, 3, -6]}>
        <planeGeometry args={[12, 6]} />
        <meshPhysicalMaterial 
          color="#e8f4f8" 
          roughness={0.1} 
          metalness={0.0}
          transmission={0.6}
          thickness={0.5}
          ior={1.5}
        />
      </mesh>
      
      {/* Front Wall */}
      <mesh receiveShadow position={[0, 3, 6]}>
        <planeGeometry args={[12, 6]} />
        <meshPhysicalMaterial 
          color="#e8f4f8" 
          roughness={0.1} 
          metalness={0.0}
          transmission={0.6}
          thickness={0.5}
          ior={1.5}
        />
      </mesh>
      
      {/* Left Wall */}
      <mesh receiveShadow position={[-6, 3, 0]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[12, 6]} />
        <meshPhysicalMaterial 
          color="#e8f4f8" 
          roughness={0.1} 
          metalness={0.0}
          transmission={0.6}
          thickness={0.5}
          ior={1.5}
        />
      </mesh>
      
      {/* Right Wall */}
      <mesh receiveShadow position={[6, 3, 0]} rotation={[0, -Math.PI / 2, 0]}>
        <planeGeometry args={[12, 6]} />
        <meshPhysicalMaterial 
          color="#e8f4f8" 
          roughness={0.1} 
          metalness={0.0}
          transmission={0.6}
          thickness={0.5}
          ior={1.5}
        />
      </mesh>
      
      {/* Ceiling */}
      <mesh position={[0, 6, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[12, 12]} />
        <meshStandardMaterial 
          color="#d0d0d0" 
          roughness={0.4} 
          metalness={0.1}
        />
      </mesh>
      
      {/* Ceiling Light Fixtures */}
      <mesh position={[0, 5.8, 0]}>
        <cylinderGeometry args={[0.4, 0.4, 0.2, 16]} />
        <meshStandardMaterial 
          color="#ffffff" 
          emissive={"#ffffff"} 
          emissiveIntensity={0.5}
        />
      </mesh>
      
      <mesh position={[3, 5.8, 3]}>
        <cylinderGeometry args={[0.3, 0.3, 0.15, 16]} />
        <meshStandardMaterial 
          color="#ffffff" 
          emissive={"#ffffff"} 
          emissiveIntensity={0.3}
        />
      </mesh>
      
      <mesh position={[-3, 5.8, -3]}>
        <cylinderGeometry args={[0.3, 0.3, 0.15, 16]} />
        <meshStandardMaterial 
          color="#ffffff" 
          emissive={"#ffffff"} 
          emissiveIntensity={0.3}
        />
      </mesh>
      
      <mesh position={[3, 5.8, -3]}>
        <cylinderGeometry args={[0.3, 0.3, 0.15, 16]} />
        <meshStandardMaterial 
          color="#ffffff" 
          emissive={"#ffffff"} 
          emissiveIntensity={0.3}
        />
      </mesh>
      
      <mesh position={[-3, 5.8, 3]}>
        <cylinderGeometry args={[0.3, 0.3, 0.15, 16]} />
        <meshStandardMaterial 
          color="#ffffff" 
          emissive={"#ffffff"} 
          emissiveIntensity={0.3}
        />
      </mesh>
    </group>
  );
}

export default function LargeMeetingRoom() {
  return (
    <div style={{ width: '100vw', height: '100vh', background: '#0a0a0a' }}>
      <Canvas shadows>
        {/* Enhanced Camera Setup */}
        <PerspectiveCamera makeDefault position={[12, 8, 12]} fov={45} />
        
        {/* Enhanced Lighting Setup */}
        <ambientLight intensity={0.3} color="#f5f5dc" />
        
        {/* Main directional light - simulating daylight */}
        <directionalLight
          position={[20, 20, 10]}
          intensity={1.5}
          color="#fff8e7"
          castShadow
          shadow-mapSize-width={4096}
          shadow-mapSize-height={4096}
          shadow-camera-far={50}
          shadow-camera-left={-15}
          shadow-camera-right={15}
          shadow-camera-top={15}
          shadow-camera-bottom={-15}
          shadow-bias={-0.0001}
        />
        
        {/* Warm central spotlight for atmosphere */}
        <SpotLight
          position={[0, 8, 0]}
          angle={0.4}
          penumbra={0.6}
          intensity={1.0}
          color="#ffd4a3"
          castShadow
          shadow-mapSize-width={1024}
          shadow-mapSize-height={1024}
        />
        
        <SpotLight
          position={[8, 6, 8]}
          angle={0.25}
          penumbra={0.5}
          intensity={0.6}
          color="#e3f2fd"
          castShadow
        />
        
        <SpotLight
          position={[-8, 6, -8]}
          angle={0.25}
          penumbra={0.5}
          intensity={0.6}
          color="#fce4ec"
          castShadow
        />
        
        {/* HDRI Environment for realism */}
        <Environment preset="apartment" background={false} />
        
        {/* Scene Components */}
        <LargeRoom />
        <RectangularTable />
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
          scale={18}
          blur={3}
          far={12}
        />
        
        {/* Camera Controls */}
        <OrbitControls
          enableZoom={true}
          enablePan={false}
          minDistance={8}
          maxDistance={30}
          minPolarAngle={Math.PI / 6}
          maxPolarAngle={Math.PI / 2.2}
          autoRotate={false}
          target={[0, 1, 0]}
        />
      </Canvas>
    </div>
  );
}

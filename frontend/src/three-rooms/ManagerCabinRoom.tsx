import React, { Suspense } from 'react';
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Environment, PerspectiveCamera, SpotLight } from "@react-three/drei";
import { CoffeeTable } from './CoffeeTable';
import { Chair } from './Chair';
import { ManagerCabinRoom as ManagerCabin } from './ManagerCabin';
import { Laptop } from './Laptop';
import { CoffeeCup } from './CoffeeCup';
import { Plant } from './Plant';

function Chairs() {
  // 3 chairs: 2 on one side (manager side), 1 on opposite side (visitor side)
  const positions = [
    [-0.6, 0, 0.8],   // Manager chair 1
    [0.6, 0, 0.8],    // Manager chair 2  
    [0, 0, -0.8],     // Visitor chair (opposite side)
  ];
  
  const rotations = [
    [0, Math.PI, 0],           // Manager chair 1 - facing table
    [0, Math.PI, 0],           // Manager chair 2 - facing table
    [0, 0, 0],                 // Visitor chair - facing table
  ];
  
  return (
    <>
      {positions.map((pos, i) => (
        <Chair key={i} position={pos as [number, number, number]} rotation={rotations[i] as [number, number, number]} />
      ))}
    </>
  );
}

function Laptops() {
  // 2 laptops on the coffee table (for managers)
  const positions = [
    [-0.4, 0.48, 0.1, Math.PI / 8],
    [0.4, 0.48, 0.1, -Math.PI / 8],
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
  // 3 coffee cups on the table
  const positions = [
    [-0.3, 0.48, 0.2],
    [0.3, 0.48, 0.2],
    [0, 0.48, -0.3],
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
      <Plant position={[2, 0, 2]} />
      <Plant position={[-2, 0, 2]} />
      <Plant position={[2, 0, -2]} />
    </>
  );
}

export default function ManagerCabinRoom() {
  return (
    <div style={{ width: '100vw', height: '100vh', background: '#1a1a1a' }}>
      <Canvas shadows>
        {/* Camera Setup */}
        <PerspectiveCamera makeDefault position={[6, 4, 6]} fov={50} />
        
        {/* Professional Manager Cabin Lighting */}
        <ambientLight intensity={0.3} color="#f0e6d2" />
        
        {/* Executive desk light */}
        <pointLight
          position={[0, 3, 0]}
          intensity={1.2}
          color="#fff8dc"
          castShadow
          shadow-mapSize-width={1024}
          shadow-mapSize-height={1024}
        />
        
        {/* Warm accent lights */}
        <SpotLight
          position={[1.5, 3, 1.5]}
          angle={0.3}
          penumbra={0.5}
          intensity={0.7}
          color="#ffd700"
          castShadow
          shadow-mapSize-width={512}
          shadow-mapSize-height={512}
        />
        
        <SpotLight
          position={[-1.5, 3, 1.5]}
          angle={0.3}
          penumbra={0.5}
          intensity={0.7}
          color="#ffd700"
          castShadow
          shadow-mapSize-width={512}
          shadow-mapSize-height={512}
        />
        
        {/* Window light effect */}
        <directionalLight
          position={[0, 2, -1]}
          intensity={0.4}
          color="#87ceeb"
        />
        
        {/* Professional Environment */}
        <Environment preset="warehouse" background={false} />
        
        {/* Scene Components */}
        <ManagerCabin />
        <CoffeeTable />
        
        {/* Chairs: 2 on manager side, 1 on visitor side */}
        <Suspense fallback={null}>
          <Chairs />
          <Laptops />
          <CoffeeCups />
          <Plants />
        </Suspense>
        
        {/* Camera Controls */}
        <OrbitControls
          enableZoom={true}
          enablePan={false}
          minDistance={3}
          maxDistance={10}
          minPolarAngle={Math.PI / 8}
          maxPolarAngle={Math.PI / 2.5}
          autoRotate={false}
        />
      </Canvas>
    </div>
  );
}

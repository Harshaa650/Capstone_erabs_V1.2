import React, { Suspense } from 'react';
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Environment, ContactShadows, PerspectiveCamera, SpotLight } from "@react-three/drei";
import { CoffeeTable } from './CoffeeTable';
import { Sofa } from './Sofa';
import { CabinRoom } from './CabinRoom';
import { CoffeeCup } from './CoffeeCup';

function CoffeeCups() {
  // Coffee cups positioned on the coffee table
  const positions = [
    [0.3, 0.48, 0.1],
    [-0.3, 0.48, 0.1],
    [0, 0.48, -0.2],
  ];
  
  return (
    <>
      {positions.map((pos, i) => (
        <CoffeeCup key={i} position={pos as [number, number, number]} />
      ))}
    </>
  );
}

export default function Cabin() {
  return (
    <div style={{ width: '100vw', height: '100vh', background: '#2c1810' }}>
      <Canvas shadows>
        {/* Camera Setup */}
        <PerspectiveCamera makeDefault position={[6, 4, 6]} fov={50} />
        
        {/* Cozy Cabin Lighting */}
        <ambientLight intensity={0.4} color="#d4a574" />
        
        {/* Warm fireplace light */}
        <pointLight
          position={[-2.5, 1, 0]}
          intensity={1.5}
          color="#ff6b35"
          castShadow
          shadow-mapSize-width={1024}
          shadow-mapSize-height={1024}
        />
        
        {/* Warm ceiling light */}
        <pointLight
          position={[0, 4.5, 0]}
          intensity={0.8}
          color="#ffd4a3"
          castShadow
          shadow-mapSize-width={1024}
          shadow-mapSize-height={1024}
        />
        
        {/* Soft spotlight for reading atmosphere */}
        <SpotLight
          position={[1, 3, 1]}
          angle={0.4}
          penumbra={0.6}
          intensity={0.6}
          color="#fff8e7"
          castShadow
          shadow-mapSize-width={512}
          shadow-mapSize-height={512}
        />
        
        {/* Window daylight effect */}
        <directionalLight
          position={[0, 2, -2]}
          intensity={0.5}
          color="#87ceeb"
        />
        
        {/* Cozy Environment */}
        <Environment preset="warehouse" background={false} />
        
        {/* Scene Components */}
        <CabinRoom />
        <CoffeeTable />
        
        {/* Sofas on two sides of the table */}
        <Suspense fallback={null}>
          <Sofa position={[0, 0, 1.2]} color="blue" />
          <Sofa position={[0, 0, -1.2]} rotation={[0, Math.PI, 0]} color="green" />
          <CoffeeCups />
        </Suspense>
        
                
        {/* Camera Controls */}
        <OrbitControls
          enableZoom={true}
          enablePan={false}
          minDistance={4}
          maxDistance={12}
          minPolarAngle={Math.PI / 8}
          maxPolarAngle={Math.PI / 2.5}
          autoRotate={false}
        />
      </Canvas>
    </div>
  );
}

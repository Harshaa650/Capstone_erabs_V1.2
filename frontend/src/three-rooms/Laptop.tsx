import React from 'react';

interface LaptopProps {
  position: [number, number, number];
  rotation?: [number, number, number];
}

export function Laptop({ position, rotation = [0, 0, 0] }: LaptopProps) {
  return (
    <group position={position} rotation={rotation}>
      {/* Laptop Base */}
      <mesh castShadow receiveShadow position={[0, 0, 0]}>
        <boxGeometry args={[0.4, 0.02, 0.25]} />
        <meshStandardMaterial 
          color="#2d3748" 
          roughness={0.3} 
          metalness={0.8}
        />
      </mesh>
      
      {/* Keyboard */}
      <mesh castShadow position={[0, 0.01, 0]}>
        <boxGeometry args={[0.38, 0.01, 0.23]} />
        <meshStandardMaterial 
          color="#1a202c" 
          roughness={0.6} 
        />
      </mesh>
      
      {/* Screen */}
      <mesh castShadow position={[0, 0.15, -0.12]} rotation={[Math.PI / 6, 0, 0]}>
        <boxGeometry args={[0.35, 0.02, 0.22]} />
        <meshStandardMaterial 
          color="#2d3748" 
          roughness={0.3} 
          metalness={0.8}
        />
      </mesh>
      
      {/* Screen Display */}
      <mesh position={[0, 0.16, -0.11]} rotation={[Math.PI / 6, 0, 0]}>
        <planeGeometry args={[0.32, 0.2]} />
        <meshStandardMaterial 
          emissive={"#1e40af"} 
          emissiveIntensity={0.4}
          color="#3b82f6"
        />
      </mesh>
      
      {/* Trackpad */}
      <mesh castShadow position={[0, 0.02, 0.05]}>
        <boxGeometry args={[0.12, 0.01, 0.08]} />
        <meshStandardMaterial 
          color="#4a5568" 
          roughness={0.4} 
        />
      </mesh>
    </group>
  );
}

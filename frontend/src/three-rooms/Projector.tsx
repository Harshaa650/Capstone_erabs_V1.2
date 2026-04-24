import React from 'react';

interface ProjectorProps {
  position: [number, number, number];
  rotation?: [number, number, number];
}

export function Projector({ position, rotation = [0, 0, 0] }: ProjectorProps) {
  return (
    <group position={position} rotation={rotation}>
      {/* Projector Body */}
      <mesh castShadow>
        <boxGeometry args={[0.3, 0.15, 0.4]} />
        <meshStandardMaterial 
          color="#2c2c2c" 
          roughness={0.3} 
          metalness={0.8}
        />
      </mesh>
      
      {/* Projector Lens */}
      <mesh position={[0, 0, 0.21]}>
        <cylinderGeometry args={[0.08, 0.06, 0.05, 16]} />
        <meshStandardMaterial 
          color="#1a1a1a" 
          roughness={0.1} 
          metalness={0.9}
        />
      </mesh>
      
      {/* Ventilation Grills */}
      <mesh position={[0, 0.08, -0.1]}>
        <boxGeometry args={[0.25, 0.02, 0.2]} />
        <meshStandardMaterial 
          color="#0a0a0a" 
          roughness={0.8}
        />
      </mesh>
      
      {/* Focus Ring */}
      <mesh position={[0, 0, 0.18]}>
        <torusGeometry args={[0.08, 0.01, 8, 16]} />
        <meshStandardMaterial 
          color="#4a4a4a" 
          roughness={0.2} 
          metalness={0.7}
        />
      </mesh>
      
      {/* Status Light */}
      <mesh position={[0.12, 0.06, 0]}>
        <sphereGeometry args={[0.01, 8, 8]} />
        <meshStandardMaterial 
          color="#00ff00" 
          emissive="#00ff00"
          emissiveIntensity={0.5}
        />
      </mesh>
    </group>
  );
}

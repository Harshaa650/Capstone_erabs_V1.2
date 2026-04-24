import React from 'react';

export function Table() {
  return (
    <group position={[0, 0.75, 0]}>
      {/* Table Top */}
      <mesh castShadow receiveShadow position={[0, 0, 0]}>
        <cylinderGeometry args={[1.8, 1.8, 0.12, 64]} />
        <meshStandardMaterial 
          color="#8b7355" 
          roughness={0.3} 
          metalness={0.1}
        />
      </mesh>
      
      {/* Table Edge */}
      <mesh castShadow receiveShadow position={[0, -0.06, 0]}>
        <cylinderGeometry args={[1.85, 1.85, 0.02, 64]} />
        <meshStandardMaterial 
          color="#6b5a45" 
          roughness={0.2} 
          metalness={0.2}
        />
      </mesh>
      
      {/* Central Support */}
      <mesh castShadow position={[0, -0.6, 0]}>
        <cylinderGeometry args={[0.15, 0.15, 1.2, 32]} />
        <meshStandardMaterial 
          color="#4a3f36" 
          roughness={0.4} 
          metalness={0.3}
        />
      </mesh>
      
      {/* Base */}
      <mesh castShadow receiveShadow position={[0, -1.25, 0]}>
        <cylinderGeometry args={[0.4, 0.4, 0.1, 32]} />
        <meshStandardMaterial 
          color="#3a2f26" 
          roughness={0.5} 
          metalness={0.4}
        />
      </mesh>
    </group>
  );
}

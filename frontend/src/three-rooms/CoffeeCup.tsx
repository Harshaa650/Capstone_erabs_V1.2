import React from 'react';

interface CoffeeCupProps {
  position: [number, number, number];
}

export function CoffeeCup({ position }: CoffeeCupProps) {
  return (
    <group position={position}>
      {/* Cup */}
      <mesh castShadow position={[0, 0, 0]}>
        <cylinderGeometry args={[0.04, 0.03, 0.08, 16]} />
        <meshStandardMaterial 
          color="#ffffff" 
          roughness={0.1} 
        />
      </mesh>
      
      {/* Coffee */}
      <mesh position={[0, 0.04, 0]}>
        <cylinderGeometry args={[0.028, 0.028, 0.04, 16]} />
        <meshStandardMaterial 
          color="#4a2c2a" 
          roughness={0.8}
        />
      </mesh>
      
      {/* Handle */}
      <mesh castShadow position={[0.05, 0.02, 0]}>
        <torusGeometry args={[0.02, 0.008, 8, 12]} />
        <meshStandardMaterial 
          color="#ffffff" 
          roughness={0.1} 
        />
      </mesh>
      
      {/* Saucer */}
      <mesh castShadow receiveShadow position={[0, -0.01, 0]}>
        <cylinderGeometry args={[0.08, 0.08, 0.01, 32]} />
        <meshStandardMaterial 
          color="#ffffff" 
          roughness={0.1} 
        />
      </mesh>
    </group>
  );
}

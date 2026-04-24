import React from 'react';

interface PlantProps {
  position: [number, number, number];
}

export function Plant({ position }: PlantProps) {
  return (
    <group position={position}>
      {/* Pot */}
      <mesh castShadow receiveShadow position={[0, 0.3, 0]}>
        <cylinderGeometry args={[0.15, 0.12, 0.6, 16]} />
        <meshStandardMaterial 
          color="#8b4513" 
          roughness={0.6} 
        />
      </mesh>
      
      {/* Soil */}
      <mesh position={[0, 0.6, 0]}>
        <cylinderGeometry args={[0.11, 0.11, 0.04, 16]} />
        <meshStandardMaterial 
          color="#3e2723" 
          roughness={0.8}
        />
      </mesh>
      
      {/* Plant Stems */}
      <mesh castShadow position={[0, 0.7, 0]}>
        <cylinderGeometry args={[0.02, 0.01, 0.3, 8]} />
        <meshStandardMaterial 
          color="#2e7d32" 
          roughness={0.7}
        />
      </mesh>
      
      {/* Leaves */}
      <mesh castShadow position={[0.05, 0.85, 0]} rotation={[0, 0, Math.PI / 6]}>
        <sphereGeometry args={[0.12, 8, 6]} />
        <meshStandardMaterial 
          color="#4caf50" 
          roughness={0.6}
        />
      </mesh>
      
      <mesh castShadow position={[-0.05, 0.82, 0.05]} rotation={[0, 0, -Math.PI / 8]}>
        <sphereGeometry args={[0.1, 8, 6]} />
        <meshStandardMaterial 
          color="#66bb6a" 
          roughness={0.6}
        />
      </mesh>
      
      <mesh castShadow position={[0.03, 0.88, -0.05]} rotation={[0, 0, Math.PI / 4]}>
        <sphereGeometry args={[0.08, 8, 6]} />
        <meshStandardMaterial 
          color="#81c784" 
          roughness={0.6}
        />
      </mesh>
      
      <mesh castShadow position={[-0.08, 0.8, -0.03]} rotation={[0, 0, -Math.PI / 6]}>
        <sphereGeometry args={[0.09, 8, 6]} />
        <meshStandardMaterial 
          color="#4caf50" 
          roughness={0.6}
        />
      </mesh>
    </group>
  );
}

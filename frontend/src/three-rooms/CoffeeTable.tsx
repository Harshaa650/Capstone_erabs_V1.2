import React from 'react';

export function CoffeeTable() {
  return (
    <group position={[0, 0.4, 0]}>
      {/* Table Top */}
      <mesh castShadow receiveShadow position={[0, 0, 0]}>
        <boxGeometry args={[1.2, 0.08, 0.6]} />
        <meshStandardMaterial 
          color="#8b6f47" 
          roughness={0.3} 
          metalness={0.1}
        />
      </mesh>
      
      {/* Table Edge */}
      <mesh castShadow receiveShadow position={[0, -0.04, 0]}>
        <boxGeometry args={[1.22, 0.02, 0.62]} />
        <meshStandardMaterial 
          color="#6b5a45" 
          roughness={0.2} 
          metalness={0.2}
        />
      </mesh>
      
      {/* Table Legs - Four corners */}
      <mesh castShadow position={[0.5, -0.3, 0.25]}>
        <cylinderGeometry args={[0.04, 0.04, 0.6, 8]} />
        <meshStandardMaterial 
          color="#4a3f36" 
          roughness={0.4} 
          metalness={0.3}
        />
      </mesh>
      
      <mesh castShadow position={[-0.5, -0.3, 0.25]}>
        <cylinderGeometry args={[0.04, 0.04, 0.6, 8]} />
        <meshStandardMaterial 
          color="#4a3f36" 
          roughness={0.4} 
          metalness={0.3}
        />
      </mesh>
      
      <mesh castShadow position={[0.5, -0.3, -0.25]}>
        <cylinderGeometry args={[0.04, 0.04, 0.6, 8]} />
        <meshStandardMaterial 
          color="#4a3f36" 
          roughness={0.4} 
          metalness={0.3}
        />
      </mesh>
      
      <mesh castShadow position={[-0.5, -0.3, -0.25]}>
        <cylinderGeometry args={[0.04, 0.04, 0.6, 8]} />
        <meshStandardMaterial 
          color="#4a3f36" 
          roughness={0.4} 
          metalness={0.3}
        />
      </mesh>
      
      {/* Bottom Shelf */}
      <mesh castShadow receiveShadow position={[0, -0.5, 0]}>
        <boxGeometry args={[1.1, 0.04, 0.5]} />
        <meshStandardMaterial 
          color="#8b6f47" 
          roughness={0.3} 
          metalness={0.1}
        />
      </mesh>
    </group>
  );
}

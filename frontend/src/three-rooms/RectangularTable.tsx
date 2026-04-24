import React from 'react';

export function RectangularTable() {
  return (
    <group position={[0, 0.75, 0]}>
      {/* Table Top - Rectangular */}
      <mesh castShadow receiveShadow position={[0, 0, 0]}>
        <boxGeometry args={[4, 0.12, 2]} />
        <meshStandardMaterial 
          color="#8b7355" 
          roughness={0.3} 
          metalness={0.1}
        />
      </mesh>
      
      {/* Table Edge */}
      <mesh castShadow receiveShadow position={[0, -0.06, 0]}>
        <boxGeometry args={[4.05, 0.02, 2.05]} />
        <meshStandardMaterial 
          color="#6b5a45" 
          roughness={0.2} 
          metalness={0.2}
        />
      </mesh>
      
      {/* Table Legs - Four corners */}
      <mesh castShadow position={[1.8, -0.6, 0.8]}>
        <cylinderGeometry args={[0.08, 0.08, 1.2, 16]} />
        <meshStandardMaterial 
          color="#4a3f36" 
          roughness={0.4} 
          metalness={0.3}
        />
      </mesh>
      
      <mesh castShadow position={[-1.8, -0.6, 0.8]}>
        <cylinderGeometry args={[0.08, 0.08, 1.2, 16]} />
        <meshStandardMaterial 
          color="#4a3f36" 
          roughness={0.4} 
          metalness={0.3}
        />
      </mesh>
      
      <mesh castShadow position={[1.8, -0.6, -0.8]}>
        <cylinderGeometry args={[0.08, 0.08, 1.2, 16]} />
        <meshStandardMaterial 
          color="#4a3f36" 
          roughness={0.4} 
          metalness={0.3}
        />
      </mesh>
      
      <mesh castShadow position={[-1.8, -0.6, -0.8]}>
        <cylinderGeometry args={[0.08, 0.08, 1.2, 16]} />
        <meshStandardMaterial 
          color="#4a3f36" 
          roughness={0.4} 
          metalness={0.3}
        />
      </mesh>
      
      {/* Support Braces */}
      <mesh castShadow position={[0, -0.4, 0.8]}>
        <boxGeometry args={[3.6, 0.05, 0.1]} />
        <meshStandardMaterial 
          color="#3a2f26" 
          roughness={0.5} 
          metalness={0.4}
        />
      </mesh>
      
      <mesh castShadow position={[0, -0.4, -0.8]}>
        <boxGeometry args={[3.6, 0.05, 0.1]} />
        <meshStandardMaterial 
          color="#3a2f26" 
          roughness={0.5} 
          metalness={0.4}
        />
      </mesh>
    </group>
  );
}

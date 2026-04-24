import React from 'react';

export function Screen() {
  return (
    <group position={[0, 2.2, -2.8]}>
      {/* Screen Frame */}
      <mesh castShadow position={[0, 0, -0.05]}>
        <boxGeometry args={[2.8, 1.8, 0.1]} />
        <meshStandardMaterial 
          color="#2a2a2a" 
          roughness={0.3} 
          metalness={0.8}
        />
      </mesh>
      
      {/* Screen Display */}
      <mesh position={[0, 0, 0]}>
        <planeGeometry args={[2.6, 1.6]} />
        <meshStandardMaterial 
          emissive={"#1a1a2e"} 
          emissiveIntensity={0.8}
          color="#0f3460"
        />
      </mesh>
      
      {/* Screen Content (simulated presentation) */}
      <mesh position={[0, 0, 0.01]}>
        <planeGeometry args={[2.4, 1.4]} />
        <meshStandardMaterial 
          emissive={"#ffffff"} 
          emissiveIntensity={0.3}
          color="#e94560"
        />
      </mesh>
      
      {/* Stand */}
      <mesh castShadow position={[0, -1.2, 0]}>
        <cylinderGeometry args={[0.08, 0.08, 2.4, 16]} />
        <meshStandardMaterial 
          color="#1a1a1a" 
          roughness={0.2} 
          metalness={0.9}
        />
      </mesh>
      
      {/* Base */}
      <mesh castShadow receiveShadow position={[0, -1.35, 0]}>
        <cylinderGeometry args={[0.3, 0.3, 0.1, 32]} />
        <meshStandardMaterial 
          color="#2a2a2a" 
          roughness={0.3} 
          metalness={0.7}
        />
      </mesh>
    </group>
  );
}

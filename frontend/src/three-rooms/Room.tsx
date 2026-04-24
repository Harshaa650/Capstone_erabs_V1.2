import React from 'react';

export function Room() {
  return (
    <group>
      {/* Floor */}
      <mesh receiveShadow position={[0, -0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[8, 8]} />
        <meshStandardMaterial 
          color="#8b8b8b" 
          roughness={0.6} 
          metalness={0.2}
        />
      </mesh>
      
      {/* Back Wall */}
      <mesh receiveShadow position={[0, 3, -4]}>
        <planeGeometry args={[8, 6]} />
        <meshStandardMaterial 
          color="#2a2a3a" 
          roughness={0.4} 
          metalness={0.1}
        />
      </mesh>
      
      {/* Front Wall */}
      <mesh receiveShadow position={[0, 3, 4]}>
        <planeGeometry args={[8, 6]} />
        <meshStandardMaterial 
          color="#2a2a3a" 
          roughness={0.4} 
          metalness={0.1}
        />
      </mesh>
      
      {/* Left Wall */}
      <mesh receiveShadow position={[-4, 3, 0]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[8, 6]} />
        <meshStandardMaterial 
          color="#2a2a3a" 
          roughness={0.4} 
          metalness={0.1}
        />
      </mesh>
      
      {/* Right Wall */}
      <mesh receiveShadow position={[4, 3, 0]} rotation={[0, -Math.PI / 2, 0]}>
        <planeGeometry args={[8, 6]} />
        <meshStandardMaterial 
          color="#2a2a3a" 
          roughness={0.4} 
          metalness={0.1}
        />
      </mesh>
      
      {/* Ceiling */}
      <mesh position={[0, 6, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[8, 8]} />
        <meshStandardMaterial 
          color="#d0d0d0" 
          roughness={0.4} 
          metalness={0.1}
        />
      </mesh>
      
      {/* Ceiling Light Fixtures */}
      <mesh position={[0, 5.8, 0]}>
        <cylinderGeometry args={[0.3, 0.3, 0.2, 16]} />
        <meshStandardMaterial 
          color="#ffffff" 
          emissive={"#ffffff"} 
          emissiveIntensity={0.5}
        />
      </mesh>
      
      <mesh position={[2, 5.8, 2]}>
        <cylinderGeometry args={[0.2, 0.2, 0.15, 16]} />
        <meshStandardMaterial 
          color="#ffffff" 
          emissive={"#ffffff"} 
          emissiveIntensity={0.3}
        />
      </mesh>
      
      <mesh position={[-2, 5.8, -2]}>
        <cylinderGeometry args={[0.2, 0.2, 0.15, 16]} />
        <meshStandardMaterial 
          color="#ffffff" 
          emissive={"#ffffff"} 
          emissiveIntensity={0.3}
        />
      </mesh>
    </group>
  );
}

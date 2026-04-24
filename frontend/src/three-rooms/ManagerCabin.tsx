import React from 'react';

export function ManagerCabinRoom() {
  return (
    <group>
      {/* Floor - Professional wood flooring */}
      <mesh receiveShadow position={[0, -0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[5, 5]} />
        <meshStandardMaterial 
          color="#6b5d54" 
          roughness={0.7} 
          metalness={0.1}
        />
      </mesh>
      
      {/* Back Wall - Professional wood paneling */}
      <mesh receiveShadow position={[0, 2.5, -2.5]}>
        <planeGeometry args={[5, 5]} />
        <meshStandardMaterial 
          color="#8b7355" 
          roughness={0.6} 
          metalness={0.1}
        />
      </mesh>
      
      {/* Front Wall - Wood paneling with door space */}
      <mesh receiveShadow position={[0, 2.5, 2.5]}>
        <planeGeometry args={[5, 5]} />
        <meshStandardMaterial 
          color="#8b7355" 
          roughness={0.6} 
          metalness={0.1}
        />
      </mesh>
      
      {/* Left Wall - Wood paneling */}
      <mesh receiveShadow position={[-2.5, 2.5, 0]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[5, 5]} />
        <meshStandardMaterial 
          color="#8b7355" 
          roughness={0.6} 
          metalness={0.1}
        />
      </mesh>
      
      {/* Right Wall - Wood paneling */}
      <mesh receiveShadow position={[2.5, 2.5, 0]} rotation={[0, -Math.PI / 2, 0]}>
        <planeGeometry args={[5, 5]} />
        <meshStandardMaterial 
          color="#8b7355" 
          roughness={0.6} 
          metalness={0.1}
        />
      </mesh>
      
      {/* Ceiling - Professional ceiling */}
      <mesh position={[0, 5, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[5, 5]} />
        <meshStandardMaterial 
          color="#f5f5f5" 
          roughness={0.4} 
          metalness={0.1}
        />
      </mesh>
      
      {/* Executive Ceiling Light */}
      <mesh position={[0, 4.8, 0]}>
        <cylinderGeometry args={[0.3, 0.3, 0.15, 16]} />
        <meshStandardMaterial 
          color="#ffffff" 
          emissive={"#ffffff"} 
          emissiveIntensity={0.8}
        />
      </mesh>
      
      {/* Accent Lights */}
      <mesh position={[1.5, 4.8, 1.5]}>
        <cylinderGeometry args={[0.15, 0.15, 0.1, 16]} />
        <meshStandardMaterial 
          color="#ffffff" 
          emissive={"#ffd700"} 
          emissiveIntensity={0.4}
        />
      </mesh>
      
      <mesh position={[-1.5, 4.8, 1.5]}>
        <cylinderGeometry args={[0.15, 0.15, 0.1, 16]} />
        <meshStandardMaterial 
          color="#ffffff" 
          emissive={"#ffd700"} 
          emissiveIntensity={0.4}
        />
      </mesh>
      
      {/* Executive Window on back wall */}
      <mesh position={[0, 3, -2.49]}>
        <planeGeometry args={[1.5, 1.2]} />
        <meshStandardMaterial 
          color="#87ceeb" 
          roughness={0.1} 
          metalness={0.1}
          opacity={0.7}
          transparent={true}
        />
      </mesh>
      
      {/* Window Frame */}
      <mesh position={[0, 3, -2.48]}>
        <boxGeometry args={[1.6, 1.3, 0.05]} />
        <meshStandardMaterial 
          color="#4a4a4a" 
          roughness={0.5} 
          metalness={0.3}
        />
      </mesh>
      
      {/* Bookshelf on left wall */}
      <mesh position={[-2.49, 1.5, 0]} rotation={[0, Math.PI / 2, 0]}>
        <boxGeometry args={[2, 3, 0.3]} />
        <meshStandardMaterial 
          color="#654321" 
          roughness={0.6} 
          metalness={0.2}
        />
      </mesh>
      
      {/* Bookshelf Shelves */}
      <mesh position={[-2.48, 2.5, 0]} rotation={[0, Math.PI / 2, 0]}>
        <boxGeometry args={[2, 0.05, 0.25]} />
        <meshStandardMaterial 
          color="#4a3c28" 
          roughness={0.7} 
          metalness={0.1}
        />
      </mesh>
      
      <mesh position={[-2.48, 1.8, 0]} rotation={[0, Math.PI / 2, 0]}>
        <boxGeometry args={[2, 0.05, 0.25]} />
        <meshStandardMaterial 
          color="#4a3c28" 
          roughness={0.7} 
          metalness={0.1}
        />
      </mesh>
      
      <mesh position={[-2.48, 1.1, 0]} rotation={[0, Math.PI / 2, 0]}>
        <boxGeometry args={[2, 0.05, 0.25]} />
        <meshStandardMaterial 
          color="#4a3c28" 
          roughness={0.7} 
          metalness={0.1}
        />
      </mesh>
      
      <mesh position={[-2.48, 0.4, 0]} rotation={[0, Math.PI / 2, 0]}>
        <boxGeometry args={[2, 0.05, 0.25]} />
        <meshStandardMaterial 
          color="#4a3c28" 
          roughness={0.7} 
          metalness={0.1}
        />
      </mesh>
    </group>
  );
}

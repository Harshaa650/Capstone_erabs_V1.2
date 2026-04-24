import React from 'react';

interface ChairProps {
  position: [number, number, number];
  rotation?: [number, number, number];
}

export function Chair({ position, rotation = [0, 0, 0] }: ChairProps) {
  return (
    <group position={position} rotation={rotation}>
      {/* Seat */}
      <mesh castShadow receiveShadow position={[0, 0.45, 0]}>
        <boxGeometry args={[0.55, 0.12, 0.55]} />
        <meshStandardMaterial 
          color="#4a5568" 
          roughness={0.6} 
          metalness={0.1}
        />
      </mesh>
      
      {/* Seat Cushion */}
      <mesh castShadow position={[0, 0.52, 0]}>
        <boxGeometry args={[0.52, 0.04, 0.52]} />
        <meshStandardMaterial 
          color="#718096" 
          roughness={0.8} 
        />
      </mesh>
      
      {/* Backrest */}
      <mesh castShadow position={[0, 0.9, -0.22]}>
        <boxGeometry args={[0.55, 0.7, 0.12]} />
        <meshStandardMaterial 
          color="#4a5568" 
          roughness={0.6} 
          metalness={0.1}
        />
      </mesh>
      
      {/* Backrest Cushion */}
      <mesh castShadow position={[0, 0.9, -0.16]}>
        <boxGeometry args={[0.48, 0.6, 0.04]} />
        <meshStandardMaterial 
          color="#718096" 
          roughness={0.8} 
        />
      </mesh>
      
      {/* Armrests */}
      <mesh castShadow position={[0.35, 0.65, 0]}>
        <boxGeometry args={[0.08, 0.4, 0.45]} />
        <meshStandardMaterial 
          color="#2d3748" 
          roughness={0.4} 
          metalness={0.2}
        />
      </mesh>
      
      <mesh castShadow position={[-0.35, 0.65, 0]}>
        <boxGeometry args={[0.08, 0.4, 0.45]} />
        <meshStandardMaterial 
          color="#2d3748" 
          roughness={0.4} 
          metalness={0.2}
        />
      </mesh>
      
      {/* Legs */}
      <mesh castShadow position={[0.2, -0.3, 0.2]}>
        <cylinderGeometry args={[0.04, 0.04, 0.6, 8]} />
        <meshStandardMaterial 
          color="#1a202c" 
          roughness={0.3} 
          metalness={0.8}
        />
      </mesh>
      
      <mesh castShadow position={[-0.2, -0.3, 0.2]}>
        <cylinderGeometry args={[0.04, 0.04, 0.6, 8]} />
        <meshStandardMaterial 
          color="#1a202c" 
          roughness={0.3} 
          metalness={0.8}
        />
      </mesh>
      
      <mesh castShadow position={[0.2, -0.3, -0.2]}>
        <cylinderGeometry args={[0.04, 0.04, 0.6, 8]} />
        <meshStandardMaterial 
          color="#1a202c" 
          roughness={0.3} 
          metalness={0.8}
        />
      </mesh>
      
      <mesh castShadow position={[-0.2, -0.3, -0.2]}>
        <cylinderGeometry args={[0.04, 0.04, 0.6, 8]} />
        <meshStandardMaterial 
          color="#1a202c" 
          roughness={0.3} 
          metalness={0.8}
        />
      </mesh>
      
      {/* Wheels */}
      <mesh castShadow position={[0.2, -0.65, 0.2]}>
        <sphereGeometry args={[0.06, 16, 16]} />
        <meshStandardMaterial 
          color="#2d3748" 
          roughness={0.6} 
          metalness={0.4}
        />
      </mesh>
      
      <mesh castShadow position={[-0.2, -0.65, 0.2]}>
        <sphereGeometry args={[0.06, 16, 16]} />
        <meshStandardMaterial 
          color="#2d3748" 
          roughness={0.6} 
          metalness={0.4}
        />
      </mesh>
      
      <mesh castShadow position={[0.2, -0.65, -0.2]}>
        <sphereGeometry args={[0.06, 16, 16]} />
        <meshStandardMaterial 
          color="#2d3748" 
          roughness={0.6} 
          metalness={0.4}
        />
      </mesh>
      
      <mesh castShadow position={[-0.2, -0.65, -0.2]}>
        <sphereGeometry args={[0.06, 16, 16]} />
        <meshStandardMaterial 
          color="#2d3748" 
          roughness={0.6} 
          metalness={0.4}
        />
      </mesh>
    </group>
  );
}

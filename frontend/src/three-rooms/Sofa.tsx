import React from 'react';

interface SofaProps {
  position: [number, number, number];
  rotation?: [number, number, number];
  color: 'blue' | 'green';
}

export function Sofa({ position, rotation = [0, 0, 0], color }: SofaProps) {
  const sofaColors = {
    blue: {
      main: '#2c5aa0',
      cushion: '#3d6db3',
      legs: '#1a3a6e'
    },
    green: {
      main: '#2d5a3d',
      cushion: '#3d7a4d',
      legs: '#1a3a2e'
    }
  };

  const colors = sofaColors[color];

  return (
    <group position={position} rotation={rotation}>
      {/* Sofa Base/Main Frame */}
      <mesh castShadow receiveShadow position={[0, 0.3, 0]}>
        <boxGeometry args={[2, 0.6, 0.8]} />
        <meshStandardMaterial 
          color={colors.main} 
          roughness={0.7} 
        />
      </mesh>
      
      {/* Back Rest */}
      <mesh castShadow position={[0, 0.8, -0.35]}>
        <boxGeometry args={[2, 0.8, 0.15]} />
        <meshStandardMaterial 
          color={colors.main} 
          roughness={0.7} 
        />
      </mesh>
      
      {/* Arm Rests */}
      <mesh castShadow position={[-1.1, 0.6, 0]}>
        <boxGeometry args={[0.2, 0.6, 0.8]} />
        <meshStandardMaterial 
          color={colors.main} 
          roughness={0.7} 
        />
      </mesh>
      
      <mesh castShadow position={[1.1, 0.6, 0]}>
        <boxGeometry args={[0.2, 0.6, 0.8]} />
        <meshStandardMaterial 
          color={colors.main} 
          roughness={0.7} 
        />
      </mesh>
      
      {/* Seat Cushions */}
      <mesh castShadow position={[-0.5, 0.65, 0]}>
        <boxGeometry args={[0.45, 0.15, 0.75]} />
        <meshStandardMaterial 
          color={colors.cushion} 
          roughness={0.8}
        />
      </mesh>
      
      <mesh castShadow position={[0.5, 0.65, 0]}>
        <boxGeometry args={[0.45, 0.15, 0.75]} />
        <meshStandardMaterial 
          color={colors.cushion} 
          roughness={0.8}
        />
      </mesh>
      
      {/* Back Cushions */}
      <mesh castShadow position={[-0.5, 0.85, -0.28]}>
        <boxGeometry args={[0.45, 0.4, 0.1]} />
        <meshStandardMaterial 
          color={colors.cushion} 
          roughness={0.8}
        />
      </mesh>
      
      <mesh castShadow position={[0.5, 0.85, -0.28]}>
        <boxGeometry args={[0.45, 0.4, 0.1]} />
        <meshStandardMaterial 
          color={colors.cushion} 
          roughness={0.8}
        />
      </mesh>
      
      {/* Sofa Legs */}
      <mesh castShadow position={[-0.9, 0, -0.35]}>
        <cylinderGeometry args={[0.05, 0.05, 0.3, 8]} />
        <meshStandardMaterial 
          color={colors.legs} 
          roughness={0.3} 
          metalness={0.6}
        />
      </mesh>
      
      <mesh castShadow position={[0.9, 0, -0.35]}>
        <cylinderGeometry args={[0.05, 0.05, 0.3, 8]} />
        <meshStandardMaterial 
          color={colors.legs} 
          roughness={0.3} 
          metalness={0.6}
        />
      </mesh>
      
      <mesh castShadow position={[-0.9, 0, 0.35]}>
        <cylinderGeometry args={[0.05, 0.05, 0.3, 8]} />
        <meshStandardMaterial 
          color={colors.legs} 
          roughness={0.3} 
          metalness={0.6}
        />
      </mesh>
      
      <mesh castShadow position={[0.9, 0, 0.35]}>
        <cylinderGeometry args={[0.05, 0.05, 0.3, 8]} />
        <meshStandardMaterial 
          color={colors.legs} 
          roughness={0.3} 
          metalness={0.6}
        />
      </mesh>
      
      {/* Decorative Piping */}
      <mesh position={[0, 0.6, 0]}>
        <torusGeometry args={[1.05, 0.02, 4, 32]} />
        <meshStandardMaterial 
          color={colors.legs} 
          roughness={0.2} 
          metalness={0.8}
        />
      </mesh>
    </group>
  );
}

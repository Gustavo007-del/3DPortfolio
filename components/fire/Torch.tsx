"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import ParticleSystem from "./ParticleSystem";

type TorchProps = {
  position?: [number, number, number];
  scale?: number;
  lightIntensity?: number;
};

export default function Torch({
  position = [0, 0, 0],
  scale = 1,
  lightIntensity = 18,
}: TorchProps) {
  const lightRef = useRef<THREE.PointLight>(null!);
  const flameRef = useRef<THREE.Mesh>(null!);

  useFrame((state) => {
    const t = state.clock.elapsedTime;

    // --------------------------
    // Flame movement
    // --------------------------

    if (flameRef.current) {
      flameRef.current.position.x =
        Math.sin(t * 14) * 0.02;

      flameRef.current.position.z =
        Math.cos(t * 12) * 0.02;

      flameRef.current.scale.y =
        0.8 +
        Math.sin(t * 16) * 0.18 +
        Math.sin(t * 7) * 0.08;

      flameRef.current.scale.x =
        0.9 +
        Math.sin(t * 11) * 0.08;

      flameRef.current.scale.z =
        flameRef.current.scale.x;
    }

    // --------------------------
    // Light Flicker
    // --------------------------

    if (lightRef.current) {
      lightRef.current.intensity =
        lightIntensity +
        Math.sin(t * 22) * 2 +
        Math.sin(t * 9) * 1.4 +
        (Math.random() - 0.5);

      lightRef.current.distance =
        18 +
        Math.sin(t * 8);

      lightRef.current.position.x =
        Math.sin(t * 10) * 0.05;

      lightRef.current.position.z =
        Math.cos(t * 9) * 0.05;
    }
  });

  return (
    <group position={position} scale={scale}>
      {/* Pole */}

      <mesh position={[0, 1, 0]} castShadow>
        <cylinderGeometry args={[0.05, 0.07, 2.2, 10]} />
        <meshStandardMaterial
          color="#4b311c"
          roughness={1}
        />
      </mesh>

      {/* Holder */}

      <mesh position={[0, 2.05, 0]} castShadow>
        <cylinderGeometry args={[0.11, 0.11, 0.18, 10]} />
        <meshStandardMaterial
          color="#2f2f2f"
          metalness={0.8}
          roughness={0.4}
        />
      </mesh>

      {/* Flame */}

  

      {/* Fire */}

      <ParticleSystem
        position={[0, 2.12, 0]}
        count={120}
        area={[0.22, 0.8, 0.22]}
        size={0.07}
        color="#ff8a1f"
        riseSpeed={1}
      />

      {/* Smoke */}

      <ParticleSystem
        position={[0, 2.4, 0]}
        count={45}
        area={[0.35, 1.6, 0.35]}
        size={0.18}
        color="#707070"
        opacity={0.15}
        riseSpeed={0.35}
      />

      {/* Light */}

      <pointLight
        ref={lightRef}
        color="#ffb65d"
        intensity={lightIntensity}
        distance={18}
        decay={2}
        position={[0, 2.2, 0]}
        castShadow
        shadow-mapSize={[1024, 1024]}
      />
    </group>
  );
}
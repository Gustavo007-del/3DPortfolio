"use client";

import { useRef } from "react";
import { Mesh } from "three";
import { useFrame } from "@react-three/fiber";

export default function Jupiter() {
  const ref = useRef<Mesh>(null);
  const bandRef = useRef<Mesh>(null);

  useFrame((_, delta) => {
    if (!ref.current) return;
    ref.current.rotation.y += delta * 0.5;
    if (bandRef.current) {
      bandRef.current.rotation.y += delta * 0.5;
    }
  });

  return (
    <group>
      <mesh ref={ref}>
        <sphereGeometry args={[2.2, 48, 48]} />
        <meshStandardMaterial
          color="#d4a574"
          roughness={0.6}
          metalness={0.05}
        />
      </mesh>
      {/* Subtle equatorial band */}
      <mesh ref={bandRef} scale={[1.01, 0.92, 1.01]}>
        <sphereGeometry args={[2.2, 48, 48]} />
        <meshStandardMaterial
          color="#c49a6c"
          roughness={0.7}
          transparent
          opacity={0.6}
        />
      </mesh>
      {/* Great Red Spot */}
      <mesh position={[1.8, -0.3, 1.2]}>
        <sphereGeometry args={[0.35, 16, 16]} />
        <meshStandardMaterial
          color="#b5653a"
          roughness={0.8}
          transparent
          opacity={0.7}
        />
      </mesh>
    </group>
  );
}

"use client";

import { useRef } from "react";
import { Mesh, DoubleSide } from "three";
import { useFrame } from "@react-three/fiber";

export default function Saturn() {
  const ref = useRef<Mesh>(null);

  useFrame((_, delta) => {
    if (!ref.current) return;
    ref.current.rotation.y += delta * 0.4;
  });

  return (
    <group>
      <mesh ref={ref}>
        <sphereGeometry args={[1.9, 48, 48]} />
        <meshStandardMaterial
          color="#e8d5a3"
          roughness={0.65}
          metalness={0.05}
        />
      </mesh>
      {/* Ring */}
      <mesh rotation={[Math.PI / 2.3, 0, 0]}>
        <ringGeometry args={[2.6, 4.2, 128]} />
        <meshStandardMaterial
          color="#c9b896"
          side={DoubleSide}
          transparent
          opacity={0.7}
          roughness={0.8}
        />
      </mesh>
      {/* Inner ring detail */}
      <mesh rotation={[Math.PI / 2.3, 0, 0]}>
        <ringGeometry args={[2.3, 2.55, 128]} />
        <meshStandardMaterial
          color="#a89870"
          side={DoubleSide}
          transparent
          opacity={0.5}
          roughness={0.9}
        />
      </mesh>
    </group>
  );
}

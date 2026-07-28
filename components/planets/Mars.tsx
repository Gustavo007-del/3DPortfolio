"use client";

import { useRef } from "react";
import { Mesh } from "three";
import { useFrame } from "@react-three/fiber";

export default function Mars() {
  const ref = useRef<Mesh>(null);

  useFrame((_, delta) => {
    if (!ref.current) return;
    ref.current.rotation.y += delta * 0.7;
  });

  return (
    <mesh ref={ref}>
      <sphereGeometry args={[0.7, 32, 32]} />
      <meshStandardMaterial
        color="#c1440e"
        roughness={0.85}
        metalness={0.1}
      />
    </mesh>
  );
}

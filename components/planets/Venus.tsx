"use client";

import { useRef } from "react";
import { Mesh } from "three";
import { useFrame } from "@react-three/fiber";

export default function Venus() {
  const ref = useRef<Mesh>(null);

  useFrame((_, delta) => {
    if (!ref.current) return;
    ref.current.rotation.y += delta * 0.2;
  });

  return (
    <mesh ref={ref}>
      <sphereGeometry args={[0.9, 32, 32]} />
      <meshStandardMaterial
        color="#e6d7a3"
        roughness={0.7}
        metalness={0.05}
        emissive="#e6d7a3"
        emissiveIntensity={0.05}
      />
    </mesh>
  );
}

"use client";

import { useRef } from "react";
import { Mesh } from "three";
import { useFrame } from "@react-three/fiber";

export default function Mercury() {
  const ref = useRef<Mesh>(null);

  useFrame((_, delta) => {
    if (!ref.current) return;
    ref.current.rotation.y += delta * 0.3;
  });

  return (
    <mesh ref={ref}>
      <sphereGeometry args={[0.4, 32, 32]} />
      <meshStandardMaterial
        color="#b0b0b0"
        roughness={0.9}
        metalness={0.1}
      />
    </mesh>
  );
}

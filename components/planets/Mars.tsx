// components/planets/Mars.tsx
"use client";

import { useRef } from "react";
import { Mesh } from "three";
import { useFrame } from "@react-three/fiber";
import { useTexture } from "@react-three/drei";

export default function Mars() {
  const texture = useTexture("/textures/mars.jpg");
  const ref = useRef<Mesh>(null);

  useFrame((_, delta) => {
    if (ref.current) ref.current.rotation.y += delta * 0.7;
  });

  return (
    <mesh ref={ref}>
      <sphereGeometry args={[0.7, 32, 32]} />
      <meshStandardMaterial map={texture} roughness={0.85} metalness={0.1} />
    </mesh>
  );
}
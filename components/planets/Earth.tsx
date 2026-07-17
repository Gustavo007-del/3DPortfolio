"use client";

import { useRef } from "react";
import { Mesh } from "three";
import { useFrame } from "@react-three/fiber";
import { useTexture } from "@react-three/drei";

export default function Earth() {
  const texture = useTexture("/textures/earth.png");

  const earthRef = useRef<Mesh>(null);

  useFrame((state, delta) => {
    if (!earthRef.current) return;

    // Earth spinning
    earthRef.current.rotation.y += delta * 0.8;
  });

  return (
    <mesh ref={earthRef}>
      <sphereGeometry args={[1, 64, 64]} />
      <meshStandardMaterial map={texture} />
    </mesh>
  );
}
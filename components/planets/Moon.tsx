"use client";

import { useRef } from "react";
import { Mesh } from "three";
import { useFrame } from "@react-three/fiber";
import { useTexture } from "@react-three/drei";

export default function Moon() {
  const moonRef = useRef<Mesh>(null);

  const texture =
    useTexture("/textures/moon.png");

  useFrame((state, delta) => {
    if (!moonRef.current) return;

    moonRef.current.rotation.y +=
      delta * 0.5;
  });

  return (
    <mesh ref={moonRef}>
      <sphereGeometry args={[0.3, 32, 32]} />

      <meshStandardMaterial
        map={texture}
      />
    </mesh>
  );
}
"use client";

import { useRef } from "react";
import { Group } from "three";
import { useFrame } from "@react-three/fiber";

import Moon from "../planets/Moon";

export default function MoonOrbit() {
  const moonOrbitRef =
    useRef<Group>(null);

  useFrame((state) => {
    if (!moonOrbitRef.current) return;

    moonOrbitRef.current.rotation.y =
      state.clock.elapsedTime * 1.2;
  });

  return (
    <group ref={moonOrbitRef}>
      <group position={[2, 0, 0]}>
        <Moon />
      </group>
    </group>
  );
}
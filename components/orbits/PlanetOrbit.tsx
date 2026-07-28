"use client";

import { useRef, ReactNode } from "react";
import { Group } from "three";
import { useFrame } from "@react-three/fiber";

interface PlanetOrbitProps {
  radius: number;
  speed: number;
  children: ReactNode;
  offset?: number;
}

export default function PlanetOrbit({ radius, speed, children, offset = 0 }: PlanetOrbitProps) {
  const orbitRef = useRef<Group>(null);

  useFrame((state) => {
    if (!orbitRef.current) return;
    orbitRef.current.rotation.y = state.clock.elapsedTime * speed + offset;
  });

  return (
    <group ref={orbitRef}>
      <group position={[radius, 0, 0]}>{children}</group>
    </group>
  );
}

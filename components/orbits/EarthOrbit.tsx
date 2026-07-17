"use client";

import { useRef } from "react";
import { Group } from "three";
import { useFrame } from "@react-three/fiber";
import MoonOrbit from "./MoonOrbit";
import Earth from "../planets/Earth";

export default function EarthOrbit() {
  const orbitRef = useRef<Group>(null);

  useFrame((state) => {
    if (!orbitRef.current) return;

    orbitRef.current.rotation.y =
      state.clock.elapsedTime * 0.25;
  });

  return (
    <group ref={orbitRef}>
      <group position={[8, 0, 0]}>
        <Earth />

        <MoonOrbit />
      </group>
    </group>
  );
}
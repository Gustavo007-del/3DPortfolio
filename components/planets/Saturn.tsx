// components/planets/Saturn.tsx
"use client";

import { useMemo, useRef } from "react";
import { Mesh } from "three";
import { useFrame } from "@react-three/fiber";
import { SaturnRingMaterial } from "./SaturnRingMaterial";
import Atmosphere from "./Atmosphere";

export default function Saturn() {
  const ref = useRef<Mesh>(null);
  const ringMaterial = useMemo(() => new SaturnRingMaterial(2.3, 4.2), []);

  useFrame((_, delta) => {
    if (ref.current) ref.current.rotation.y += delta * 0.4;
  });

  return (
    <group>
      <mesh ref={ref}>
        <sphereGeometry args={[1.9, 48, 48]} />
        <meshStandardMaterial color="#e8d5a3" roughness={0.65} metalness={0.05} />
      </mesh>
      <Atmosphere radius={1.9} color="#f0e0b8" intensity={0.5} scale={1.06} />
      <mesh rotation={[Math.PI / 2.3, 0, 0]}>
        <ringGeometry args={[2.3, 4.2, 128]} />
        <primitive object={ringMaterial} attach="material" />
      </mesh>
    </group>
  );
}
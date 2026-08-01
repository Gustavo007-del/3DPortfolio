// components/planets/Jupiter.tsx
"use client";

import { useMemo, useRef } from "react";
import { Mesh } from "three";
import { useFrame } from "@react-three/fiber";
import { JupiterMaterial } from "./JupiterMaterial";
import Atmosphere from "./Atmosphere";

export default function Jupiter() {
  const ref = useRef<Mesh>(null);
  const material = useMemo(() => new JupiterMaterial(), []);

  useFrame((state, delta) => {
    if (ref.current) ref.current.rotation.y += delta * 0.5;
    material.update(state.clock.elapsedTime);
  });

  return (
    <group>
      <mesh ref={ref}>
        <sphereGeometry args={[2.2, 64, 64]} />
        <primitive object={material} attach="material" />
      </mesh>
      <Atmosphere radius={2.2} color="#e0b888" intensity={0.5} scale={1.06} />
    </group>
  );
}